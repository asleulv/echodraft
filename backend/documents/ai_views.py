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
    encoding = tiktoken.encoding_for_model(model)
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

def build_fallback_prompt(concept, style_guide, combined_content, suggestion_length="medium"):
    """Build the fallback prompt when templates are not available."""
    # Map length preferences to descriptions
    length_descriptions = {
        'short': "2-3 sentences each (75-100 words)",
        'medium': "3-5 sentences each (150-200 words)", 
        'long': "6-8 sentences each (300-400 words)",
        'detailed': "8-12 sentences each with rich details (500-700 words)"
    }
    
    length_desc = length_descriptions.get(suggestion_length, "2-4 sentences each")
    num_suggestions = "3 to 5" if suggestion_length in ['long', 'detailed'] else "5 to 10"
    
    prompt_parts = [
        f"TASK: Generate {num_suggestions} creative, diverse, and engaging opening paragraphs for a new text. Each suggestion should be {length_desc}.",
        "",
        "IMPORTANT: Respond in the exact same language as the concept below.",
        "",
        "TOPIC/CONCEPT TO WRITE ABOUT:",
        concept,
        "",
        "REQUIREMENTS:",
        "- Write ONLY about the concept above, not about the reference texts below",
        "- Each suggestion should be unique in tone, structure, or perspective",
        f"- Generate substantial opening paragraphs ({length_desc}), not just single sentences",
        "- Each opening should be detailed enough to inspire continued writing",
        "- Return as a numbered list, each on a new line",
        "- Make suggestions inspiring and engaging with vivid details",
        "- Use the same language as the concept above"
    ]
    
    if style_guide:
        prompt_parts.extend(["", "ADDITIONAL STYLE INSTRUCTIONS:", style_guide])
    
    if combined_content:
        prompt_parts.extend([
            "",
            "STYLE REFERENCE (use ONLY for writing style, NOT for topic/content):",
            "The following texts show the desired writing style and tone. Study their style but write about the concept above:",
            "",
            combined_content
        ])
    
    return "\n".join(prompt_parts)

def get_prompt_from_template(template_type, organization, concept, style_guide, combined_content, suggestion_length="medium"):
    """Get prompt from template or fallback to hardcoded version."""
    template = AIPromptTemplate.get_template(template_type, organization)
    if not template:
        return build_fallback_prompt(concept, style_guide, combined_content, suggestion_length)
    
    # Map length preferences to word count descriptions
    length_descriptions = {
        'short': "75-100 words",
        'medium': "150-200 words", 
        'long': "300-400 words",
        'detailed': "EXACTLY 500-700 words minimum - count as you write"  
    }
    
    # Adjust number of suggestions based on length
    num_suggestions_mapping = {
        'short': "5 to 10",
        'medium': "5 to 8",
        'long': "3 to 5",
        'detailed': "3 to 5"
    }
    
    template_vars = {
        'concept': concept,
        'style_guide': style_guide or "",
        'condensed_style_guide': style_guide or "",  # Same as style_guide for backward compatibility
        'combined_content': combined_content or "",
        'num_suggestions': num_suggestions_mapping.get(suggestion_length, "5 to 8"),
        'length_description': length_descriptions.get(suggestion_length, "75-125"),
        'reference_content': combined_content or "",
    }
    
    try:
        return template.format(**template_vars)
    except KeyError as e:
        print(f"Missing template variable: {e}")
        return build_fallback_prompt(concept, style_guide, combined_content, suggestion_length)

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
    suggestion_length = request.data.get('suggestion_length', 'medium')  # ✅ Extract suggestion length

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
            model_settings = get_default_model_settings()
            model = model_settings['model']
            temperature = model_settings['temperature']
            
            # Get system message from template or use fallback
            system_message = (
                AIPromptTemplate.get_template('system_message', user.organization) or
                "You are a creative writing assistant that generates opening sentences and paragraphs based on a user's concept while matching the writing style of provided reference texts. Always respond in the same language as the user's concept."
            )
            
            # Get user prompt from template or fallback (✅ Pass suggestion_length)
            prompt = get_prompt_from_template('new_content', user.organization, concept, style_guide, combined_content, suggestion_length)

            # ✅ ADD COMPREHENSIVE DEBUG INFO
            system_tokens = count_tokens(system_message, model)
            prompt_tokens = count_tokens(prompt, model)
            total_input_tokens = system_tokens + prompt_tokens
            available_for_generation = model_settings['max_tokens'] - total_input_tokens
            reference_content_tokens = count_tokens(combined_content, model) if combined_content else 0
            
            # Debug info that will always print to console
            print(f"\n🔍 TOKEN USAGE DEBUG INFO:")
            print(f"Model: {model}")
            print(f"Max tokens setting from DB: {model_settings['max_tokens']}")
            print(f"System message tokens: {system_tokens}")
            print(f"User prompt tokens: {prompt_tokens}")
            print(f"Reference content tokens: {reference_content_tokens}")
            print(f"Total input tokens: {total_input_tokens}")
            print(f"Available for generation: {available_for_generation}")
            print(f"Suggestion length requested: {suggestion_length}")
            print(f"Reference content chars: {len(combined_content) if combined_content else 0}")
            print(f"Documents used: {len(selected_document_ids)}")
            print(f"Using template: {bool(AIPromptTemplate.get_template('new_content', user.organization))}")
            
            # Estimate tokens needed for different lengths
            estimated_tokens_needed = {
                'short': 100,      # ~75 words
                'medium': 170,     # ~125 words  
                'long': 270,       # ~200 words
                'detailed': 400    # ~300 words
            }
            needed = estimated_tokens_needed.get(suggestion_length, 170)
            print(f"Estimated tokens needed for '{suggestion_length}': {needed}")
            print(f"Token sufficiency: {'✅ SUFFICIENT' if available_for_generation >= needed else '❌ INSUFFICIENT'}")
            print("-" * 50)

            if debug_mode:
                return Response({
                    'debug': True,
                    'prompt': prompt,
                    'system_message': system_message,
                    'suggestion_length': suggestion_length,
                    'token_usage': {  # ✅ Include all debug info in response
                        'model': model,
                        'max_tokens_setting': model_settings['max_tokens'],
                        'system_message_tokens': system_tokens,
                        'user_prompt_tokens': prompt_tokens,
                        'reference_content_tokens': reference_content_tokens,
                        'total_input_tokens': total_input_tokens,
                        'available_for_generation': available_for_generation,
                        'estimated_tokens_needed': needed,
                        'sufficient_tokens': available_for_generation >= needed,
                        'reference_content_chars': len(combined_content) if combined_content else 0,
                        'documents_used': len(selected_document_ids)
                    },
                    'using_templates': {
                        'system_message': bool(AIPromptTemplate.get_template('system_message', user.organization)),
                        'new_content': bool(AIPromptTemplate.get_template('new_content', user.organization))
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
                max_tokens=model_settings['max_tokens'],
                temperature=temperature,
                timeout=60
            )
            
            ai_output = response.choices[0].message.content.strip()
            
            # ✅ Add debug info about the actual response
            response_tokens = count_tokens(ai_output, model)
            print(f"📤 RESPONSE DEBUG INFO:")
            print(f"Response tokens used: {response_tokens}")
            print(f"Response character count: {len(ai_output)}")
            print(f"Estimated word count: ~{response_tokens * 0.75:.0f} words")
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
                "debug_info": {  # ✅ Include debug in regular response too
                    "response_tokens": response_tokens,
                    "available_tokens": available_for_generation,
                    "sufficient_tokens": available_for_generation >= needed
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error in suggestions mode: {str(e)}")
            return Response({"error": f"Failed to generate suggestions: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(
        {"detail": "Invalid generation_type. Only 'suggestions' is supported."},
        status=status.HTTP_400_BAD_REQUEST
    )
