from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from openai import OpenAI
import re
import tiktoken
from .models import TextDocument, AIModelSettings, AIPromptTemplate


# Constants for document processing
MAX_REFERENCE_DOCS = 3
MAX_CHARS_PER_DOC = 600
MAX_TOTAL_TOKENS = 3000
DEFAULT_MODEL = "gpt-3.5-turbo-0125"
DEFAULT_TEMPERATURE = 0.7


# Fixed number of suggestions as per your request
FIXED_NUM_SUGGESTIONS = "5"


# Length settings that exactly mirror the dropdown in the frontend
LENGTH_SETTINGS = {
    'short':    {'min': 50,  'max': 75},   # Short (50-75 words)
    'medium':   {'min': 75,  'max': 125},  # Medium (75-125 words)
    'long':     {'min': 125, 'max': 200},  # Long (125-200 words)
    'detailed': {'min': 200, 'max': 300},  # Detailed (200-300 words)
}


def get_model_for_length(suggestion_length):
    """Select optimal model based on suggestion length."""
    if suggestion_length in ["detailed", "long"]:
        return "gpt-4o-mini"  # Use GPT-4o-mini for long and detailed requests
    else:
        return "gpt-3.5-turbo"  # Use GPT-3.5-turbo for short/medium


def get_default_model_settings():
    """Get the default model settings from the database"""
    try:
        model_settings = AIModelSettings.objects.filter(is_default=True, is_active=True).first()
        if not model_settings:
            model_settings = AIModelSettings.objects.filter(is_active=True).first()
        if model_settings:
            return {
                'model': model_settings.model_name,
                'temperature': model_settings.temperature,
                'max_tokens': model_settings.max_tokens
            }
        return {'model': DEFAULT_MODEL, 'temperature': DEFAULT_TEMPERATURE, 'max_tokens': 4000}
    except Exception as e:
        print(f"Error getting model settings: {str(e)}")
        return {'model': DEFAULT_MODEL, 'temperature': DEFAULT_TEMPERATURE, 'max_tokens': 4000}


def count_tokens(text, model=DEFAULT_MODEL):
    """Count the number of tokens in a text string."""
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        # Handle newer models that aren't automatically mapped
        if "gpt-4o" in model.lower():
            encoding = tiktoken.get_encoding("o200k_base")  # GPT-4o encoding
        elif "gpt-4" in model.lower():
            encoding = tiktoken.get_encoding("cl100k_base")  # GPT-4 encoding
        else:
            encoding = tiktoken.get_encoding("cl100k_base")  # Default fallback
    
    return len(encoding.encode(text))


def truncate_document(text, max_chars=MAX_CHARS_PER_DOC):
    """Truncate a document to a maximum character count."""
    return text[:max_chars] if len(text) > max_chars else text


def prepare_reference_content(queryset):
    """Prepare reference content from a queryset or list of documents."""
    if hasattr(queryset, 'filter') and hasattr(queryset, 'order_by'):
        sampled_docs = list(queryset.order_by('-updated_at')[:MAX_REFERENCE_DOCS])
    else:
        sampled_docs = queryset[:MAX_REFERENCE_DOCS]


    document_contents = []
    total_tokens = 0


    for doc in sampled_docs:
        truncated_text = truncate_document(doc.plain_text)
        doc_snippet = f"Title: {doc.title}\n\nContent: {truncated_text}\n\n"
        doc_tokens = count_tokens(doc_snippet)
        if total_tokens + doc_tokens > MAX_TOTAL_TOKENS and document_contents:
            break
        document_contents.append(doc_snippet)
        total_tokens += doc_tokens
        if total_tokens >= MAX_TOTAL_TOKENS:
            break


    return "\n---\n".join(document_contents)


def get_prompt_from_template(template_type, organization, concept, style_guide, combined_content, suggestion_length="medium"):
    """
    Get prompt from template or raise error if not found.
    No built-in fallback. Templates are required and must define ALL length and suggestion variables.
    """
    template = AIPromptTemplate.get_template(template_type, organization)
    if not template:
        raise ValueError(f"Missing required template: {template_type} for organization {organization}")


    # Get numeric min/max values from LENGTH_SETTINGS
    settings = LENGTH_SETTINGS.get(suggestion_length, LENGTH_SETTINGS['medium'])
    min_words = settings['min']
    max_words = settings['max']
    length_description = f"{min_words}-{max_words} words"


    template_vars = {
        'concept': concept,
        'style_guide': style_guide or "",
        'condensed_style_guide': style_guide or "",
        'combined_content': combined_content or "",
        'suggestion_length': suggestion_length,
        'length_description': length_description,  # e.g. "200-300 words"
        'min_words': min_words,                    # 200
        'max_words': max_words,                    # 300
        'num_suggestions': FIXED_NUM_SUGGESTIONS,  # always "5"
    }
    try:
        return template.format(**template_vars)
    except KeyError as e:
        raise ValueError(f"Missing template variable: {e}")


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_document_with_ai(request):
    """Generate suggestions using AI based on existing documents."""
    generation_type = request.data.get('generation_type', 'suggestions')
    concept = request.data.get('concept', '').strip()
    style_guide = request.data.get('style_guide', None)
    selected_document_ids = request.data.get('selected_document_ids', [])
    debug_mode = request.data.get('debug_mode', False)
    suggestion_length = request.data.get('suggestion_length', 'medium')  # Passed directly to template


    # Validate input
    if not concept:
        return Response(
            {"detail": "Concept is required and cannot be empty."}, 
            status=status.HTTP_400_BAD_REQUEST
        )


    user = request.user


    # Check OpenAI API key
    from django.conf import settings
    openai_api_key = settings.OPENAI_API_KEY
    if not openai_api_key:
        return Response(
            {"detail": "OpenAI API key is not configured in the server settings."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


    # Get documents
    queryset = TextDocument.objects.filter(
        organization=user.organization,
        is_latest=True
    ).exclude(status='deleted')


    if selected_document_ids:
        queryset = queryset.filter(id__in=selected_document_ids)


    combined_content = prepare_reference_content(queryset)


    if generation_type == "suggestions":
        try:
            client = OpenAI(api_key=openai_api_key)
            
            # HYBRID MODEL SELECTION: Use optimal model based on suggestion length
            selected_model = get_model_for_length(suggestion_length)
            
            # Get model settings from database but override model selection
            model_settings = get_default_model_settings()
            model = selected_model  # Override with our hybrid selection
            temperature = model_settings['temperature']
            max_tokens = model_settings['max_tokens']


            # Always require a template from the admin dashboard. No fallback.
            system_message_template = AIPromptTemplate.get_template('system_message', user.organization)
            if not system_message_template:
                return Response(
                    {"error": "Missing required system_message template in admin dashboard."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            system_message = system_message_template


            try:
                prompt = get_prompt_from_template('new_content', user.organization, concept, style_guide, combined_content, suggestion_length)
            except Exception as e:
                return Response(
                    {"error": f"Error rendering prompt template: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )


            # Calculate length targets for debugging
            settings = LENGTH_SETTINGS.get(suggestion_length, LENGTH_SETTINGS['medium'])
            min_words_target = settings['min']
            max_words_target = settings['max']
            total_words_target = min_words_target * 5  # 5 suggestions


            system_tokens = count_tokens(system_message, model)
            prompt_tokens = count_tokens(prompt, model)
            total_input_tokens = system_tokens + prompt_tokens
            available_for_generation = max_tokens - total_input_tokens
            reference_content_tokens = count_tokens(combined_content, model) if combined_content else 0


            print(f"\n🔍 TOKEN USAGE DEBUG INFO:")
            print(f"Model: {model} (Selected by hybrid logic)")
            print(f"Max tokens setting from DB: {max_tokens}")
            print(f"System message tokens: {system_tokens}")
            print(f"User prompt tokens: {prompt_tokens}")
            print(f"Reference content tokens: {reference_content_tokens}")
            print(f"Total input tokens: {total_input_tokens}")
            print(f"Available for generation: {available_for_generation}")
            print(f"Suggestion length requested: {suggestion_length}")
            print(f"Reference content chars: {len(combined_content) if combined_content else 0}")
            print(f"Documents used: {len(selected_document_ids)}")
            print(f"Using template: True")
            print(f"📏 LENGTH TARGET DEBUG:")
            print(f"Min words per suggestion: {min_words_target}")
            print(f"Max words per suggestion: {max_words_target}")
            print(f"Total words target: {total_words_target}+ words")
            print("-" * 50)


            if debug_mode:
                return Response({
                    'debug': True,
                    'prompt': prompt,
                    'system_message': system_message,
                    'suggestion_length': suggestion_length,
                    'token_usage': {
                        'model': model,
                        'max_tokens_setting': max_tokens,
                        'system_message_tokens': system_tokens,
                        'user_prompt_tokens': prompt_tokens,
                        'reference_content_tokens': reference_content_tokens,
                        'total_input_tokens': total_input_tokens,
                        'available_for_generation': available_for_generation,
                        'reference_content_chars': len(combined_content) if combined_content else 0,
                        'documents_used': len(selected_document_ids)
                    },
                    'using_templates': {
                        'system_message': True,
                        'new_content': True
                    },
                    'model': model,
                    'temperature': temperature,
                    'document_count': queryset.count() if hasattr(queryset, 'count') else len(queryset),
                    'combined_content_length': len(combined_content) if combined_content else 0
                }, status=status.HTTP_200_OK)


            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=60
            )


            ai_output = response.choices[0].message.content.strip()
            response_tokens = count_tokens(ai_output, model)


            print(f"📤 RESPONSE DEBUG INFO:")
            print(f"Response tokens used: {response_tokens}")
            print(f"Response character count: {len(ai_output)}")
            print(f"Estimated word count: ~{response_tokens * 0.75:.0f} words")
            print(f"Actual words generated: ~{response_tokens * 0.75:.0f} words")
            print(f"Length compliance: {('✅ GOOD' if (response_tokens * 0.75) >= total_words_target else '❌ SHORT')}")
            print("-" * 50)


            suggestions = []
            for line in ai_output.splitlines():
                match = re.match(r"^\s*\d+\.\s*(.+)", line)
                if match:
                    suggestions.append(match.group(1).strip())
            if not suggestions:
                suggestions = [l.strip() for l in ai_output.splitlines() if l.strip()]


            return Response({
                "suggestions": suggestions,
                "raw_output": ai_output,
                "style_guide_used": bool(style_guide),
                "suggestion_length": suggestion_length,
                "model": model,
                "debug_info": {
                    "response_tokens": response_tokens,
                    "available_tokens": available_for_generation,
                    "sufficient_tokens": available_for_generation >= 0
                }
            }, status=status.HTTP_200_OK)


        except Exception as e:
            print(f"Error in suggestions mode: {str(e)}")
            return Response({"error": f"Failed to generate suggestions: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    return Response(
        {"detail": "Invalid generation_type. Only 'suggestions' is supported."},
        status=status.HTTP_400_BAD_REQUEST
    )
