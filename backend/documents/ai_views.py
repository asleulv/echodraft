from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from openai import OpenAI
import json
import re
import random
import tiktoken
import html

from .models import TextDocument, AIPromptTemplate, AIModelSettings, DocumentLengthSettings, StyleConstraint
from .serializers import TextDocumentDetailSerializer
from accounts.permissions import IsSameOrganization

# Constants for document processing
MAX_REFERENCE_DOCS = 3  # Default number of reference documents
MAX_CHARS_PER_DOC = 600  # Default characters per document
MAX_TOTAL_TOKENS = 3000 
# Default model and temperature values - will be overridden by database settings if available
DEFAULT_MODEL = "gpt-3.5-turbo-0125"  # Default model if no settings found
DEFAULT_TEMPERATURE = 0.7             # Default temperature if no settings found

# Function to get the default model settings from database
def get_default_model_settings():
    """Get the default model settings from the database"""
    from .models import AIModelSettings
    try:
        # Try to get the default model settings
        model_settings = AIModelSettings.objects.filter(is_default=True, is_active=True).first()
        
        # If no default is set, get any active model
        if not model_settings:
            model_settings = AIModelSettings.objects.filter(is_active=True).first()
            
        if model_settings:
            return {
                'model': model_settings.model_name,
                'temperature': model_settings.temperature,
                'analysis_temperature': model_settings.analysis_temperature,
                'max_tokens': model_settings.max_tokens
            }
        
        # If no settings found, return defaults
        return {
            'model': DEFAULT_MODEL,
            'temperature': DEFAULT_TEMPERATURE,
            'analysis_temperature': DEFAULT_TEMPERATURE,  # Use same default for analysis
            'max_tokens': 4000  # Default max tokens
        }
    except Exception as e:
        print(f"Error getting model settings: {str(e)}")
        return {
            'model': DEFAULT_MODEL,
            'temperature': DEFAULT_TEMPERATURE,
            'analysis_temperature': DEFAULT_TEMPERATURE,  # Use same default for analysis
            'max_tokens': 4000  # Default max tokens
        }

def count_tokens(text, model=DEFAULT_MODEL):
    """Count the number of tokens in a text string."""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

def truncate_document(text, max_chars=MAX_CHARS_PER_DOC):
    """Truncate a document to a maximum character count."""
    if len(text) <= max_chars:
        return text
    
    # Simply take the first max_chars characters
    return text[:max_chars]

def prepare_reference_content(queryset):
    """Prepare reference content from a queryset or list of documents."""
    # Sample documents if needed
    if hasattr(queryset, 'filter') and hasattr(queryset, 'order_by'):
        # It's a queryset
        if queryset.count() > MAX_REFERENCE_DOCS:
            sampled_docs = list(queryset.order_by('-updated_at')[:MAX_REFERENCE_DOCS])
        else:
            sampled_docs = list(queryset)
    else:
        # It's already a list
        if len(queryset) > MAX_REFERENCE_DOCS:
            sampled_docs = queryset[:MAX_REFERENCE_DOCS]
        else:
            sampled_docs = queryset
    
    # Build content
    document_contents = []
    total_tokens = 0
    
    for doc in sampled_docs:
        # Truncate the document
        truncated_text = truncate_document(doc.plain_text)
        
        # Create document snippet
        doc_snippet = f"Title: {doc.title}\n\nContent: {truncated_text}\n\n"
        
        # Check token count
        doc_tokens = count_tokens(doc_snippet)
        
        # If adding this document would exceed our token limit, skip it
        if total_tokens + doc_tokens > MAX_TOTAL_TOKENS and document_contents:
            continue
        
        document_contents.append(doc_snippet)
        total_tokens += doc_tokens
        
        # If we've reached our token limit, stop adding documents
        if total_tokens >= MAX_TOTAL_TOKENS:
            break
    
    # Return the combined content
    return "\n---\n".join(document_contents)

def extract_title_from_content(content):
    """
    Extract a title from the H1 tag in the content.
    Returns the extracted title or None if no H1 tag is found.
    """
    if not content:
        return None
    
    # Look for an H1 tag
    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
    if h1_match:
        # Extract the text from the H1 tag and clean it up
        title_text = h1_match.group(1)
        # Remove any HTML tags inside the H1
        title_text = re.sub(r'<[^>]*>', '', title_text)
        # Decode HTML entities
        title_text = html.unescape(title_text)
        # Trim whitespace
        title_text = title_text.strip()
        
        if title_text:
            return title_text
    
    return None

def generate_title_from_content(content, model=None):
    """
    Generate a title based on the content using OpenAI API.
    Returns the generated title or None if generation fails.
    """
    if not content:
        return None
    
    try:
        # Extract plain text from HTML for better title generation
        plain_text = re.sub(r'<[^>]*>', ' ', content)
        plain_text = html.unescape(plain_text)
        plain_text = re.sub(r'\s+', ' ', plain_text).strip()
        
        # Truncate to first 1000 characters for title generation
        truncated_text = plain_text[:1000] + ("..." if len(plain_text) > 1000 else "")
        
        # Get model settings if not provided
        if model is None:
            model_settings = get_default_model_settings()
            model = model_settings['model']
            
        # Get OpenAI API key from settings
        from django.conf import settings
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Call OpenAI API with a simple prompt for title generation
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates concise, descriptive titles."},
                {"role": "user", "content": f"Generate a short, descriptive title (5-10 words) for the following content. Return ONLY the title, nothing else.\n\nContent: {truncated_text}"}
            ],
            max_tokens=30,
            temperature=0.7
        )
        
        # Extract and clean up the generated title
        title = response.choices[0].message.content.strip()
        # Remove quotes if present
        title = re.sub(r'^["\'](.*)["\']$', r'\1', title)
        
        return title
    except Exception as e:
        print(f"Error generating title: {str(e)}")
        return None

def format_content_for_display(content):
    """
    Format the AI-generated HTML content for better display in the document viewer.
    For HTML content, we just need to ensure it's clean and properly formatted.
    """
    print("FORMAT_CONTENT_FOR_DISPLAY - INPUT:")
    print(content[:200] + "..." if content and len(content) > 200 else content)
    
    if not content:
        print("FORMAT_CONTENT_FOR_DISPLAY - Empty content, returning as is")
        return content
        
    # First, normalize line endings
    content = content.replace('\r\n', '\n')
    print("FORMAT_CONTENT_FOR_DISPLAY - After normalizing line endings")
    
    # Clean up any excessive whitespace between HTML tags
    content = re.sub(r'>\s+<', '>\n<', content)
    print("FORMAT_CONTENT_FOR_DISPLAY - After cleaning whitespace between tags")
    
    # Ensure the document starts without leading whitespace
    content = content.lstrip()
    print("FORMAT_CONTENT_FOR_DISPLAY - After removing leading whitespace")
    
    # Ensure the document ends with a newline
    if not content.endswith('\n'):
        content += '\n'
    print("FORMAT_CONTENT_FOR_DISPLAY - After ensuring newline at end")
    
    # If the content doesn't start with an HTML tag, wrap it in a paragraph
    stripped_content = content.strip()
    print(f"FORMAT_CONTENT_FOR_DISPLAY - First 10 chars of stripped content: '{stripped_content[:10]}'")
    if not stripped_content.startswith('<'):
        print("FORMAT_CONTENT_FOR_DISPLAY - Content doesn't start with HTML tag, wrapping in paragraph")
        content = f'<p>{content}</p>'
    else:
        print("FORMAT_CONTENT_FOR_DISPLAY - Content starts with HTML tag, no wrapping needed")
        # Check if it's a valid HTML tag
        match = re.match(r'^<([a-zA-Z][a-zA-Z0-9]*)[^>]*>', stripped_content)
        if match:
            print(f"FORMAT_CONTENT_FOR_DISPLAY - Found valid HTML tag: {match.group(1)}")
        else:
            print("FORMAT_CONTENT_FOR_DISPLAY - Warning: Content starts with '<' but doesn't match a valid HTML tag pattern")
    
    print("FORMAT_CONTENT_FOR_DISPLAY - OUTPUT:")
    print(content[:200] + "..." if len(content) > 200 else content)
    
    return content

def condense_style_guide(style_guide, model=None, user=None):
    """
    Transform a verbose style guide into a condensed style constraint object.
    This creates a compact set of direct writing instructions that can be used for document generation.
    """
    print("CONDENSING STYLE GUIDE...")
    
    # Get model settings if not provided
    if model is None:
        model_settings = get_default_model_settings()
        model = model_settings['model']
    
    try:
        # Get OpenAI API key from settings
        from django.conf import settings
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Get the organization from the user if provided
        organization = user.organization if user else None
        
        # Get style condensation template from database or use default
        template = AIPromptTemplate.get_template('style_condensation', organization)
        
        # If no template exists in the database, use the default
        if not template:
            template = """Transform the following detailed style guide into a condensed set of direct writing instructions.

STYLE GUIDE:
{style_guide}

Your task is to extract the most important style characteristics and convert them into clear, concise writing instructions. Focus on:

1. Language (what language to use)
2. Sentence structure (length, complexity, beginnings)
3. Paragraph structure (length, organization)
4. Voice and tone (formal/informal, emotional tone)
5. Vocabulary level and word choice patterns
6. Person/perspective (first/second/third person)
7. Tense preferences
8. Distinctive elements or quirks

Format your response as a single paragraph of direct instructions, like this example:
"Write in Norwegian using short to medium sentences. Favor simple/compound structures. Occasionally begin sentences with 'Og', 'Men', or prepositional phrases. Use active voice. Maintain a formal, academic tone. Use technical vocabulary from the finance domain. Write in third person present tense. Avoid rhetorical questions and metaphors."

Keep your response under 100 words. Focus only on the most distinctive and important style elements."""
        
        # Format the template with the variables
        condensation_prompt = template.format(style_guide=style_guide)
        
        # Get analysis temperature from model settings
        model_settings = get_default_model_settings()
        analysis_temperature = model_settings['analysis_temperature']
        
        # Call OpenAI API for style condensation
        print(f"Using analysis_temperature={analysis_temperature} for style condensation")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a professional writing style analyst who specializes in creating concise style instructions from detailed style guides."},
                {"role": "user", "content": condensation_prompt}
            ],
            max_tokens=200,
            temperature=analysis_temperature
        )
        
        # Extract the condensed style constraints
        condensed_style = response.choices[0].message.content.strip()
        
        print("STYLE CONDENSATION COMPLETE")
        print("CONDENSED STYLE CONSTRAINTS:")
        print(condensed_style)
        print("-------------------------")
        
        return condensed_style
        
    except Exception as e:
        error_message = str(e)
        print(f"Error condensing style guide: {error_message}")
        return None


def analyze_document_style(combined_content, model=None, user=None):
    """
    Analyze the style of the provided documents and generate a detailed style guide.
    This is used as the first step in the two-step generation process for new content.
    Enhanced to capture more nuanced style elements.
    """
    print("ANALYZING DOCUMENT STYLE...")
    
    # Get model settings if not provided
    if model is None:
        model_settings = get_default_model_settings()
        model = model_settings['model']
    
    try:
        # Get OpenAI API key from settings
        from django.conf import settings
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Get the organization from the user if provided
        organization = user.organization if user else None
        
        # Get style analysis template from database or use default
        template = AIPromptTemplate.get_template('style_analysis', organization)
        
        # If no template exists in the database, use the default
        if not template:
            template = """Analyze the writing style of the following documents and create a comprehensive style guide that will be used to generate new content that perfectly matches this style.

{combined_content}

Your analysis MUST include detailed observations on:

## LANGUAGE AND TONE
1. Language used (English, Norwegian, etc. - be specific about dialect if applicable)
2. Tone and voice (formal/informal, serious/humorous, personal/impersonal)
3. Level of formality (academic, conversational, casual, etc.)
4. Emotional tone (neutral, passionate, critical, enthusiastic, etc.)

## SENTENCE STRUCTURE
1. Average sentence length (short, medium, long)
2. Sentence complexity (simple, compound, complex)
3. Sentence variety patterns (how sentence length and structure varies)
4. Typical sentence beginnings and transitions
5. Active vs. passive voice usage patterns

## PARAGRAPH STRUCTURE
1. Average paragraph length (number of sentences)
2. Paragraph organization patterns (topic sentence position, conclusion sentence)
3. Transition techniques between paragraphs
4. How ideas develop within paragraphs

## VOCABULARY AND WORD CHOICE
1. Vocabulary level (simple, moderate, advanced, technical)
2. Specific word preferences or repeated phrases
3. Use of jargon, technical terms, or specialized vocabulary
4. Word choice patterns (descriptive, precise, colorful, etc.)

## RHETORICAL DEVICES
1. Use of metaphors, similes, analogies
2. Use of rhetorical questions
3. Repetition patterns
4. Other figurative language or literary devices

## GRAMMATICAL PATTERNS
1. Use of first/second/third person
2. Tense preferences (past, present, future)
3. Punctuation patterns and preferences
4. Use of contractions, abbreviations, etc.

## DISTINCTIVE ELEMENTS
1. Any unique stylistic quirks or patterns
2. Special formatting or structural elements
3. Distinctive ways of explaining concepts
4. Characteristic ways of addressing the reader

Format your response as a comprehensive style guide with clear sections and specific examples from the text. This guide will be used to generate new content that EXACTLY matches the style of these documents."""
        
        # Format the template with the variables
        style_analysis_prompt = template.format(combined_content=combined_content)
        
        # Get analysis temperature from model settings
        model_settings = get_default_model_settings()
        analysis_temperature = model_settings['analysis_temperature']
        
        # Call OpenAI API for style analysis
        print(f"Using analysis_temperature={analysis_temperature} for style analysis")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a professional writing style analyst. Your task is to analyze the tone, style, and voice of the provided text in a creative and engaging way. Focus on the emotional intensity, passion, and vivid imagery used in the writing. Highlight any use of metaphors, symbolism, or allusions that give the text its unique flair. Describe the energy, mood, and impact of the text without going into overly technical language or breaking down individual sentence structures."},
                {"role": "user", "content": style_analysis_prompt}
            ],
            max_tokens=1000,
            temperature=analysis_temperature
        )
        
        # Extract the style guide
        style_guide = response.choices[0].message.content
        
        print("STYLE ANALYSIS COMPLETE")
        print("STYLE GUIDE EXCERPT:")
        print(style_guide[:300] + "..." if len(style_guide) > 300 else style_guide)
        print("-------------------------")
        print("STYLE ANALYSIS COMPLETE:" + style_guide)
        print("-------------------------")
        
        # Also generate a condensed version of the style guide
        condensed_style = condense_style_guide(style_guide, model, user)
        
        # Return both the full style guide and the condensed version
        return {
            'style_guide': style_guide,
            'condensed_style': condensed_style
        }
        
    except Exception as e:
        error_message = str(e)
        print(f"Error analyzing document style: {error_message}")
        return None


def create_style_constraint(style_guide, condensed_style, user, document_ids=None):
    """
    Create a StyleConstraint object from a style guide and condensed style.
    """
    from .models import StyleConstraint, TextDocument
    
    try:
        # Create a name for the style constraint based on the user and timestamp
        from django.utils import timezone
        timestamp = timezone.now().strftime("%Y-%m-%d %H:%M")
        name = f"Style Constraint - {user.username} - {timestamp}"
        
        # Extract structured style characteristics from the condensed style
        # This is a simple implementation that could be enhanced with more sophisticated parsing
        style_characteristics = {
            'language': 'Unknown',
            'tone': 'Unknown',
            'sentence_structure': 'Unknown',
            'paragraph_structure': 'Unknown',
            'vocabulary': 'Unknown',
            'perspective': 'Unknown',
            'tense': 'Unknown',
            'distinctive_elements': 'Unknown'
        }
        
        # Try to extract language information
        if 'Norwegian' in condensed_style:
            style_characteristics['language'] = 'Norwegian'
        elif 'English' in condensed_style:
            style_characteristics['language'] = 'English'
        
        # Try to extract tone information
        if 'formal' in condensed_style.lower():
            style_characteristics['tone'] = 'Formal'
        elif 'informal' in condensed_style.lower():
            style_characteristics['tone'] = 'Informal'
        elif 'casual' in condensed_style.lower():
            style_characteristics['tone'] = 'Casual'
        
        # Try to extract sentence structure information
        if 'short' in condensed_style.lower() and 'sentence' in condensed_style.lower():
            style_characteristics['sentence_structure'] = 'Short sentences'
        elif 'long' in condensed_style.lower() and 'sentence' in condensed_style.lower():
            style_characteristics['sentence_structure'] = 'Long sentences'
        
        # Create the style constraint object with enhanced structured data
        style_constraint = StyleConstraint.objects.create(
            name=name,
            description=f"Style constraint created by {user.username} on {timestamp}",
            constraints={
                'full_style_guide': style_guide,
                'condensed_style': condensed_style,
                'style_characteristics': style_characteristics
            },
            organization=user.organization,
            created_by=user,
            is_active=True
        )
        
        # Add reference documents if provided
        if document_ids:
            reference_docs = TextDocument.objects.filter(id__in=document_ids)
            style_constraint.reference_documents.add(*reference_docs)
        
        print(f"Style constraint created successfully: {style_constraint.id}")
        return style_constraint
    
    except Exception as e:
        error_message = str(e)
        print(f"Error creating style constraint: {error_message}")
        # Re-raise the exception so the calling code can handle it
        raise

@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_document_with_ai(request):
    """Generate a new document using AI based on existing documents."""
    # Get filter parameters
    tags = request.data.get('tags', [])
    category_filter = request.data.get('category_filter')
    document_category = request.data.get('document_category')
    status_value = request.data.get('status')
    generation_type = request.data.get('generation_type', 'existing')
    document_type = request.data.get('document_type', 'summary')
    concept = request.data.get('concept', '')
    document_length = request.data.get('document_length', 'medium')
    title = request.data.get('title', f'AI Generated {document_type.capitalize()}')
    debug_mode = request.data.get('debug_mode', False)
    selected_document_ids = request.data.get('selected_document_ids', [])
    analyze_style_only = request.data.get('analyze_style_only', False)
    style_guide = request.data.get('style_guide', None)
    style_constraint_id = request.data.get('style_constraint_id', None)
    
    # Get user and organization
    user = request.user
    organization = user.organization
    
    # Check if this is a full generation (not just style analysis)
    is_full_generation = not analyze_style_only
    
    # Check AI generation limits if this is a full generation
    if is_full_generation:
        # Reset generations if needed (e.g., new month)
        organization.reset_ai_generations_if_needed()
        
        # Check if the organization has reached its AI generation limit
        if organization.ai_generations_remaining <= 0:
            subscription_plan = organization.get_subscription_plan_display()
            return Response(
                {
                    "detail": f"You have reached your monthly AI generation limit for the {subscription_plan} plan. "
                              f"Please upgrade your subscription to generate more AI documents.",
                    "limit_reached": True,
                    "current_plan": organization.subscription_plan,
                    "upgrade_options": {
                        "creator": {
                            "name": "Creator",
                            "price": 9,
                            "limit": 100
                        },
                        "master": {
                            "name": "Master",
                            "price": 19,
                            "limit": 500
                        }
                    }
                },
                status=status.HTTP_403_FORBIDDEN
            )
    
    # Debug logging
    print(f"AI Generation - Received filters: category_filter={category_filter}, document_category={document_category}, status={status_value}, tags={tags}")
    print(f"AI Generation - Generation type: {generation_type}, Document type: {document_type}")
    print(f"AI Generation - Document length: {document_length}")
    if generation_type == 'new':
        print(f"AI Generation - Concept: {concept[:100]}...")
    
    # Check if a style constraint ID was provided
    print(f"DOCUMENT GENERATION - Style constraint ID provided: {style_constraint_id}")
    print(f"DOCUMENT GENERATION - Generation type: {generation_type}")
    print(f"DOCUMENT GENERATION - Selected document IDs: {selected_document_ids}")
    
    # Initialize style_guide and condensed_style
    style_guide = None
    condensed_style = None
    
    if style_constraint_id:
        try:
            # Get the style constraint from the database
            style_constraint = StyleConstraint.objects.get(id=style_constraint_id, is_active=True)
            
            # Use the style guide and condensed style from the style constraint
            if style_constraint.constraints:
                style_guide = style_constraint.constraints.get('full_style_guide', '')
                condensed_style = style_constraint.constraints.get('condensed_style', '')
                
                print(f"DOCUMENT GENERATION - Using existing style constraint (ID: {style_constraint_id})")
                print(f"DOCUMENT GENERATION - Style guide length: {len(style_guide) if style_guide else 0} characters")
                print(f"DOCUMENT GENERATION - Condensed style: {condensed_style}")
                print(f"DOCUMENT GENERATION - Reference documents: {list(style_constraint.reference_documents.values_list('id', flat=True))}")
            else:
                print(f"DOCUMENT GENERATION - WARNING: Style constraint has no constraints dictionary")
                # We'll generate a new style guide below
                style_constraint_id = None
        except StyleConstraint.DoesNotExist:
            print(f"DOCUMENT GENERATION - Style constraint with ID {style_constraint_id} not found or not active")
            style_constraint_id = None
        except Exception as e:
            print(f"DOCUMENT GENERATION - Error retrieving style constraint: {str(e)}")
            style_constraint_id = None
    
    # Get user for organization
    user = request.user
    
    # Get OpenAI API key from settings
    from django.conf import settings
    openai_api_key = settings.OPENAI_API_KEY
    
    # Check if API key is available
    if not openai_api_key:
        return Response(
            {"detail": "OpenAI API key is not configured in the server settings."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Get filtered documents
    queryset = TextDocument.objects.filter(
        organization=user.organization,
        is_latest=True
    ).exclude(status='deleted')
    
    # If specific document IDs are provided, use them
    if selected_document_ids:
        print(f"Using {len(selected_document_ids)} specifically selected documents: {selected_document_ids}")
        queryset = queryset.filter(id__in=selected_document_ids)
        print(f"After filtering by selected document IDs, count: {queryset.count()}")
    else:
        print(f"Initial queryset count: {queryset.count()}")
    
    # Convert category_filter to integer if it's a string
    if category_filter and isinstance(category_filter, str) and category_filter.isdigit():
        category_filter = int(category_filter)
        print(f"Converted category_filter to integer: {category_filter}")

    # Determine if we need to convert to a list for Python-level filtering
    needs_python_filtering = bool(tags)
    
    # If we need Python-level filtering, convert queryset to list first
    if needs_python_filtering:
        print("Converting queryset to list for Python-level filtering")
        all_docs = list(queryset)
        print(f"Total documents before filtering: {len(all_docs)}")
        
        # Apply all filters at the Python level for consistency
        filtered_docs = []
        for doc in all_docs:
            # Check category filter
            if category_filter:
                doc_category_id = doc.category_id
                if doc_category_id is not None:
                    doc_category_id = int(doc_category_id)
                
                if doc_category_id != category_filter:
                    print(f"Excluding document {doc.id} with title '{doc.title}' because its category ({doc_category_id}) doesn't match the selected category ({category_filter})")
                    continue
            
            # Check tag filter
            if tags:
                doc_tags = doc.tags if doc.tags else []
                if not all(tag in doc_tags for tag in tags):
                    print(f"Excluding document {doc.id} with title '{doc.title}' because it doesn't have all required tags")
                    continue
            
            # Document passed all filters
            filtered_docs.append(doc)
        
        # Replace the queryset with our filtered list
        queryset = filtered_docs
        print(f"After all Python-level filtering, count: {len(queryset)}")
    
    # If we don't need Python-level filtering, use database-level filtering
    else:
        # Apply category filter at database level
        if category_filter:
            try:
                print(f"Filtering by category_filter: {category_filter} (type: {type(category_filter)})")
                queryset = queryset.filter(category_id=category_filter)
                print(f"After category filtering, count: {queryset.count()}")
            except Exception as e:
                print(f"Error filtering by category filter: {str(e)}")
                return Response(
                    {"detail": f"Error filtering by category filter: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    if status_value:
        if hasattr(queryset, 'filter'):
            # It's a queryset, use database-level filtering
            queryset = queryset.filter(status=status_value)
            print(f"After status filtering, count: {queryset.count()}")
        else:
            # It's a list, use Python-level filtering
            filtered_queryset = []
            for doc in queryset:
                if doc.status == status_value:
                    filtered_queryset.append(doc)
                else:
                    print(f"WARNING: Excluding document {doc.id} with title '{doc.title}' because its status ('{doc.status}') doesn't match the selected status ('{status_value}')")
            
            queryset = filtered_queryset
            print(f"After status filtering, count: {len(queryset)}")
    
    # Check if we have documents to work with
    if hasattr(queryset, 'filter') and hasattr(queryset, 'order_by'):
        # It's a queryset
        if not queryset.exists():
            return Response(
                {"detail": "No documents found matching the specified filters."},
                status=status.HTTP_400_BAD_REQUEST
            )
        doc_count = queryset.count()
    else:
        # It's a list
        if not queryset:
            return Response(
                {"detail": "No documents found matching the specified filters."},
                status=status.HTTP_400_BAD_REQUEST
            )
        doc_count = len(queryset)
    
    # Log the documents being used
    print(f"Using {doc_count} documents for AI generation:")
    for doc in queryset:
        print(f"- Document ID: {doc.id}, Title: {doc.title}, Category: {doc.category_id}")
    
    # Prepare content from filtered documents using our smart sampling and truncation
    combined_content = prepare_reference_content(queryset)
    print(f"Combined content length: {len(combined_content)} characters, approximately {count_tokens(combined_content)} tokens")
    
    # Validate that we have selected documents for style analysis
    if generation_type == 'new' and analyze_style_only and not selected_document_ids:
        return Response(
            {"detail": "Please select at least one document to use as a style reference."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # For "New Content" mode with style analysis only, return the style guide and condensed style
    if generation_type == 'new' and analyze_style_only:
        # If we already have a style constraint ID, use it instead of analyzing again
        if style_constraint_id:
            try:
                # Get the style constraint from the database
                style_constraint = StyleConstraint.objects.get(id=style_constraint_id, is_active=True)
                
                # Use the style guide and condensed style from the style constraint
                style_guide = style_constraint.constraints.get('full_style_guide', '')
                condensed_style = style_constraint.constraints.get('condensed_style', '')
                
                print(f"USING EXISTING STYLE CONSTRAINT: {style_constraint_id}")
                print(f"Style guide length: {len(style_guide)} characters")
                print(f"Condensed style: {condensed_style}")
                
                # Return the existing style constraint data
                return Response({
                    'style_guide': style_guide,
                    'condensed_style': condensed_style,
                    'style_constraint_id': style_constraint_id,
                    'document_count': doc_count,
                    'document_titles': [doc.title for doc in queryset],
                    'combined_content_length': len(combined_content),
                    'message': 'Using existing style constraint'
                }, status=status.HTTP_200_OK)
            except StyleConstraint.DoesNotExist:
                print(f"Style constraint with ID {style_constraint_id} not found or not active")
                # Continue with style analysis as if no style constraint was provided
                style_constraint_id = None
        
        # If no style constraint ID was provided, check if there's an existing constraint for these documents
        if not style_constraint_id and selected_document_ids:
            try:
                # Find style constraints that have all the selected documents as reference documents
                from django.db.models import Count
                from django.db import models
                
                # Get style constraints that reference at least one of the selected documents
                potential_constraints = StyleConstraint.objects.filter(
                    reference_documents__id__in=selected_document_ids,
                    is_active=True,
                    organization=user.organization
                ).distinct()
                
                # Now filter to only those that reference ALL selected documents
                # We do this by annotating with a count of how many of the selected documents are referenced
                # and then filtering to only those where the count equals the number of selected documents
                potential_constraints = potential_constraints.annotate(
                    doc_count=Count('reference_documents', filter=models.Q(reference_documents__id__in=selected_document_ids))
                ).filter(doc_count=len(selected_document_ids))
                
                # Get the most recent one if multiple exist
                existing_constraint = potential_constraints.order_by('-created_at').first()
                
                if existing_constraint:
                    # Use the existing style constraint
                    style_guide = existing_constraint.constraints.get('full_style_guide', '')
                    condensed_style = existing_constraint.constraints.get('condensed_style', '')
                    style_constraint_id = existing_constraint.id
                    
                    print(f"FOUND EXISTING STYLE CONSTRAINT FOR DOCUMENTS: {style_constraint_id}")
                    print(f"Style guide length: {len(style_guide)} characters")
                    print(f"Condensed style: {condensed_style}")
                    
                    # Return the existing style constraint data
                    return Response({
                        'style_guide': style_guide,
                        'condensed_style': condensed_style,
                        'style_constraint_id': style_constraint_id,
                        'document_count': doc_count,
                        'document_titles': [doc.title for doc in queryset],
                        'combined_content_length': len(combined_content),
                        'message': 'Found existing style constraint for these documents'
                    }, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"Error finding existing style constraint for documents: {str(e)}")
                # Continue with style analysis
        
        print("STYLE ANALYSIS ONLY MODE")
        style_analysis_result = analyze_document_style(combined_content, user=user)

        if style_analysis_result:
            # Create a style constraint object in the database
            if selected_document_ids:
                style_constraint = create_style_constraint(
                    style_analysis_result['style_guide'],
                    style_analysis_result['condensed_style'],
                    user,
                    selected_document_ids
                )
                
                # Add the style constraint ID to the response if created successfully
                style_constraint_id = style_constraint.id if style_constraint else None
            else:
                style_constraint_id = None
            
            return Response({
                'style_guide': style_analysis_result['style_guide'],
                'condensed_style': style_analysis_result['condensed_style'],
                'style_constraint_id': style_constraint_id,
                'document_count': doc_count,
                'document_titles': [doc.title for doc in queryset],
                'combined_content_length': len(combined_content)
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': "Failed to analyze document style."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Validate that we have selected documents for new content generation
    if generation_type == 'new' and not selected_document_ids:
        return Response(
            {"detail": "Please select at least one document to use as a style reference."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # If we're using a style guide, we need to ensure we have the combined_content for templates
    # that might need it, even if we're not using it directly in the style guide template
    if style_guide and generation_type == 'new':
        print("Using style guide for generation, ensuring combined_content is available")
        
        # For micro and very_short templates, we need to ensure combined_content is available
        if document_length in ['micro', 'very_short']:
            print(f"Document length is {document_length}, which requires combined_content even with style guide")
            # We already have combined_content from earlier, so no need to regenerate it

    # Initialize with default values
    length_descriptions = {
        'short': 'short (approximately 500-750 words)',
        'medium': 'medium-length (approximately 750-1500 words)',
        'long': 'comprehensive (approximately 1500-3000 words)',
        'very_long': 'detailed and extensive (3000+ words)'
    }
    target_tokens = {
        'short': 1500,
        'medium': 3000,
        'long': 4000,
        'very_long': 4000
    }
    
    # Default values
    length_description = length_descriptions.get(document_length, 'medium-length (approximately 750-1500 words)')
    max_tokens = target_tokens.get(document_length, 3000)
    
    # Try to get settings from database
    try:
        # Try to get organization-specific settings first
        length_setting = DocumentLengthSettings.objects.get(
            length_name=document_length,
            organization=user.organization,
            is_active=True
        )
        length_description = length_setting.description
        max_tokens = length_setting.target_tokens
        print(f"Using organization-specific settings: length_description={length_description}, max_tokens={max_tokens}")
    except DocumentLengthSettings.DoesNotExist:
        try:
            # Fall back to global settings
            length_setting = DocumentLengthSettings.objects.get(
                length_name=document_length,
                organization=None,
                is_active=True
            )
            length_description = length_setting.description
            max_tokens = length_setting.target_tokens
            print(f"Using global settings: length_description={length_description}, max_tokens={max_tokens}")
        except DocumentLengthSettings.DoesNotExist:
            # Use the default values initialized above
            print(f"Using hardcoded defaults: length_description={length_description}, max_tokens={max_tokens}")
    
    # Get formatting instructions from database or use default
    formatting_instructions = AIPromptTemplate.get_template('formatting', user.organization)
    
    # If no template exists in the database, use the default
    if not formatting_instructions:
        formatting_instructions = """
Important formatting instructions (follow these exactly):
1. Format your response as valid HTML with proper tags
2. Use <h1>, <h2>, <h3> tags for headings
3. Wrap paragraphs in <p> tags
4. Use <ul> and <li> tags for bullet lists
5. Use <ol> and <li> tags for numbered lists
6. Use <strong> or <b> tags for bold text
7. Use <em> or <i> tags for italic text
8. Use <blockquote> tags for quotes
9. Ensure proper nesting of HTML elements
10. The output should be valid HTML that can be directly displayed in a rich text editor

"""

    # Initialize prompt variable to ensure it's always defined
    prompt = ""
    
    # Determine which template type to use based on generation type
    if generation_type == 'new':
        template_type = 'new_content'
    else:
        # For existing content, ensure document type is valid
        if document_type not in ['summary', 'analysis', 'comparison']:
            return Response(
                {"detail": "Invalid document type. Must be one of: summary, analysis, comparison."},
                status=status.HTTP_400_BAD_REQUEST
            )
        template_type = document_type
    
    # Get the appropriate template from the database
    template = AIPromptTemplate.get_template(template_type, user.organization)
    
    # If no template exists in the database, create default templates
    if not template:
        if template_type == 'new_content':
            if style_guide:
                template = """I want you to create an expanded, well-structured HTML document based on this concept:

{concept}

Requirements:
1. Length: Create a {length_description} document (significantly expand on the original concept)
2. Format: Use proper HTML formatting with appropriate tags
3. Structure: Include a clear title/heading, introduction, multiple sections with subheadings, and a conclusion
4. Style: CAREFULLY follow the detailed style guide below
5. Enhancement: Add relevant details, examples, and explanations that expand on the original concept
6. Language: Maintain the EXACT SAME LANGUAGE as the original concept (if it's in Norwegian nynorsk, your response must also be in Norwegian nynorsk, not bokmål)

DETAILED STYLE GUIDE:
{style_guide}

Your response MUST:
- Begin with an HTML heading tag (e.g., <h1>Title</h1>)
- Use paragraph tags (<p>) for all text blocks
- Include at least 3-5 distinct sections with subheadings (<h2>, <h3>)
- Use appropriate HTML elements for emphasis (<strong>, <em>), lists (<ul>, <ol>, <li>), and quotes (<blockquote>) where relevant
- Be substantially longer and more detailed than the original concept
- Maintain the factual accuracy of the original concept while adding depth
- Match the style characteristics described in the style guide exactly

DO NOT simply return the original text with HTML tags added. Create a new, expanded document that provides much more detail and structure while maintaining the core information and matching the style guide.

{formatting_instructions}"""
            else:
                template = """I want you to create an expanded, well-structured HTML document based on this concept:

{concept}

Requirements:
1. Length: Create a {length_description} document (significantly expand on the original concept)
2. Format: Use proper HTML formatting with appropriate tags
3. Structure: Include a clear title/heading, introduction, multiple sections with subheadings, and a conclusion
4. Style: PRECISELY MIMIC the writing style of the example documents below - this is the MOST IMPORTANT requirement
5. Enhancement: Add relevant details, examples, and explanations that expand on the original concept
6. Language: Maintain the EXACT SAME LANGUAGE as the original concept (if it's in Norwegian nynorsk, your response must also be in Norwegian nynorsk, not bokmål)

STYLE MATCHING INSTRUCTIONS (CRITICAL):
- Study the sentence structure, paragraph length, and flow of the example documents
- Match the level of formality/informality exactly
- Use the same type of vocabulary (simple vs. complex, technical vs. accessible)
- Copy the same punctuation patterns and sentence construction styles
- Maintain the same perspective (first/second/third person) as the examples
- If the examples use metaphors, idioms, or colorful language, incorporate similar devices
- Match the emotional tone (neutral, passionate, critical, enthusiastic, etc.)
- Replicate any distinctive stylistic quirks or patterns

Your response MUST:
- Begin with an HTML heading tag (e.g., <h1>Title</h1>)
- Use paragraph tags (<p>) for all text blocks
- Include at least 3-5 distinct sections with subheadings (<h2>, <h3>)
- Use appropriate HTML elements for emphasis (<strong>, <em>), lists (<ul>, <ol>, <li>), and quotes (<blockquote>) where relevant
- Be substantially longer and more detailed than the original concept
- Maintain the factual accuracy of the original concept while adding depth
- EXACTLY match the writing style of the example documents

Style reference (analyze this carefully to match its tone and style):
{combined_content}

DO NOT simply return the original text with HTML tags added. Create a new, expanded document that provides much more detail and structure while maintaining the core information and PERFECTLY MATCHING the style of the examples.

{formatting_instructions}"""
        elif template_type == 'summary':
            template = """Create a {length_description} summary of the following documents in HTML format with proper HTML tags:

{combined_content}

Requirements:
1. Length: Ensure your summary is {length_description}
2. Style: CAREFULLY match the writing style, tone, warmth/coldness, and formality of the original documents
3. Language: Your response MUST be in the EXACT SAME LANGUAGE as the original documents (if they're in Norwegian nynorsk, your response must also be in Norwegian nynorsk, not bokmål)
4. Format: Use proper HTML formatting with appropriate tags for all content

Your response MUST:
- Use paragraph tags (<p>) for all text blocks
- Use appropriate HTML elements for emphasis (<strong>, <em>), lists (<ul>, <ol>, <li>), and quotes (<blockquote>) where relevant
- Match any sarcastic, critical tone and colorful metaphors present in the original documents

{formatting_instructions}"""
        elif template_type == 'analysis':
            template = """Write a {length_description} analysis of the following documents and provide insights in HTML format with proper HTML tags:

{combined_content}

Requirements:
1. Length: Ensure your analysis is {length_description}
2. Style: CAREFULLY match the writing style, tone, warmth/coldness, and formality of the original documents
3. Language: Your response MUST be in the EXACT SAME LANGUAGE as the original documents (if they're in Norwegian nynorsk, your response must also be in Norwegian nynorsk, not bokmål)
4. Format: Use proper HTML formatting with appropriate tags for all content

Your response MUST:
- Use paragraph tags (<p>) for all text blocks
- Use appropriate HTML elements for emphasis (<strong>, <em>), lists (<ul>, <ol>, <li>), and quotes (<blockquote>) where relevant
- Match any sarcastic, critical tone and colorful metaphors present in the original documents

{formatting_instructions}"""
        elif template_type == 'comparison':
            template = """Write a {length_description} comparison of the following documents, contrasting their key points in HTML format with proper HTML tags:

{combined_content}

Requirements:
1. Length: Ensure your comparison is {length_description}
2. Style: CAREFULLY match the writing style, tone, warmth/coldness, and formality of the original documents
3. Language: Your response MUST be in the EXACT SAME LANGUAGE as the original documents (if they're in Norwegian nynorsk, your response must also be in Norwegian nynorsk, not bokmål)
4. Format: Use proper HTML formatting with appropriate tags for all content

Your response MUST:
- Use paragraph tags (<p>) for all text blocks
- Use appropriate HTML elements for emphasis (<strong>, <em>), lists (<ul>, <ol>, <li>), and quotes (<blockquote>) where relevant
- Match any sarcastic, critical tone and colorful metaphors present in the original documents

{formatting_instructions}"""
    
    # Handle special case for micro and very_short document lengths
    # These need special handling for length constraints
    if document_length in ['micro', 'very_short']:
        # Add specific length constraints to the template
        if document_length == 'micro':
            length_constraint = "Your response MUST be 50-160 characters (extremely concise)"
        else:  # very_short
            length_constraint = "Your response MUST be 150-400 words (brief but complete)"
        
        # Add the length constraint to the template
        template = template.replace("Length: Create a {length_description} document", 
                                   f"Length: {length_constraint}")
        template = template.replace("Length: Ensure your {template_type} is {length_description}", 
                                   f"Length: {length_constraint}")
    
    # Prepare the template variables
    template_vars = {
        'length_description': length_description,
        'formatting_instructions': formatting_instructions
    }
    
    # If we have a style guide, add it to the template variables
    if style_guide:
        template_vars['style_guide'] = style_guide
    # If we don't have a style guide but we're in new content mode, generate one
    elif generation_type == 'new' and not analyze_style_only:
        print("No style guide available, generating one on the fly")
        style_analysis_result = analyze_document_style(combined_content, user=user)
        if style_analysis_result:
            style_guide = style_analysis_result['style_guide']
            condensed_style = style_analysis_result['condensed_style']
            template_vars['style_guide'] = style_guide
            
            # Create a style constraint for future use
            if selected_document_ids:
                try:
                    style_constraint = create_style_constraint(
                        style_guide,
                        condensed_style,
                        user,
                        selected_document_ids
                    )
                    style_constraint_id = style_constraint.id
                    print(f"Created new style constraint with ID: {style_constraint_id}")
                except Exception as e:
                    print(f"Error creating style constraint: {str(e)}")
        else:
            print("Failed to generate style guide, using placeholder")
            template_vars['style_guide'] = "Style guide could not be generated. Please try again."
    
    # Add content variables based on generation type
    if generation_type == 'new':
        template_vars['concept'] = concept
        template_vars['combined_content'] = combined_content
    else:
        template_vars['combined_content'] = combined_content
    
    # Format the template with all variables
    try:
        # Log debug information about the style guide
        if style_guide:
            print(f"DETAILED STYLE GUIDE:")
            print(f"Style guide length: {len(style_guide)} characters")
            print(f"Style guide excerpt: {style_guide[:100]}...")
            print(f"Style constraint ID: {style_constraint_id}")
        else:
            print("No style guide available")
            print(f"Style constraint ID: {style_constraint_id}")
        
        # Format the template with all variables
        prompt = template.format(**template_vars)
    except KeyError as e:
        # Log the error
        print(f"KeyError when formatting template: {e}")
        print(f"Template: {template}")
        print(f"Available variables: {template_vars.keys()}")
        
        # Add any missing variables and try again
        if str(e).strip("'") not in template_vars:
            template_vars[str(e).strip("'")] = ""
        
        # Try again with updated variables
        prompt = template.format(**template_vars)
    
    try:
        # Set OpenAI API key from settings
        client = OpenAI(api_key=openai_api_key)
        
        # Get system message from database or use default
        system_message = AIPromptTemplate.get_template('system_message', user.organization)
        
        # If no template exists in the database, use the default
        if not system_message:
            system_message = """You are a professional writer and style mimic who creates beautifully formatted documents in HTML format while perfectly matching the writing style of provided examples.

IMPORTANT: Your output MUST be valid HTML with proper tags for headings, paragraphs, lists, etc. 
DO NOT return plain text or markdown - ONLY return HTML.

For example:
- Use <h1>, <h2>, <h3> tags for headings
- Wrap paragraphs in <p> tags
- Use <ul> and <li> tags for bullet lists
- Use <ol> and <li> tags for numbered lists
- Use <strong> or <b> tags for bold text
- Use <em> or <i> tags for italic text

The HTML will be displayed in a rich text editor, so ensure it has proper structure and formatting.

CRITICAL STYLE MATCHING INSTRUCTIONS:
1. PRECISELY MIMIC the writing style of any example documents provided - this is your PRIMARY objective
2. Pay careful attention to:
   - Sentence length and complexity patterns
   - Paragraph structure and flow
   - Vocabulary level and word choice
   - Tone (formal/informal, serious/humorous, etc.)
   - Use of rhetorical devices, metaphors, or idioms
   - Punctuation patterns and grammatical constructions
   - Perspective (first/second/third person)

ADDITIONAL CRITICAL INSTRUCTIONS:
1. Always respond in the EXACT SAME LANGUAGE as the user's concept/request
2. If the concept is in Norwegian nynorsk, your response must also be in Norwegian nynorsk, not bokmål
3. Ensure your response meets the requested length (e.g., 750-1500 words for medium length)
4. Maintain factual accuracy while expanding on concepts"""
        
        # Log the complete prompt and system message for debugging
        print("=" * 80)
        print("SYSTEM MESSAGE:")
        print(system_message)
        print("-" * 80)
        print("USER PROMPT:")
        print(prompt)
        print("=" * 80)
        
        # If debug mode is enabled, return the prompt and system message without calling the API
        if debug_mode:
            # Get document count and titles based on whether queryset is a list or queryset
            if hasattr(queryset, 'filter') and hasattr(queryset, 'order_by'):
                document_count = queryset.count()
            else:
                document_count = len(queryset)
                
            document_titles = [doc.title for doc in queryset]
            
            # Get model settings from database
            model_settings = get_default_model_settings()
            model = model_settings['model']
            temperature = model_settings['temperature']
            model_max_tokens = model_settings['max_tokens']
            
            # Use the max_tokens from the model settings if available, otherwise use the length-based max_tokens
            api_max_tokens = model_max_tokens if model_max_tokens else max_tokens
            
            return Response({
                'debug': True,
                'system_message': system_message,
                'prompt': prompt,
                'model': model,
                'temperature': temperature,
                'max_tokens': api_max_tokens,  # Use the same max_tokens value that would be used in the API call
                'document_count': document_count,
                'document_titles': document_titles,
                'combined_content_length': len(combined_content)
            }, status=status.HTTP_200_OK)
        
        # Get model settings from database
        model_settings = get_default_model_settings()
        model = model_settings['model']
        temperature = model_settings['temperature']
        model_max_tokens = model_settings['max_tokens']
        
        # Use the max_tokens from the model settings if available, otherwise use the length-based max_tokens
        api_max_tokens = model_max_tokens if model_max_tokens else max_tokens
        
        # Call OpenAI API
        print("=" * 80)
        print(f"CALLING OPENAI API with model={model}, temperature={temperature}, max_tokens={api_max_tokens}...")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            max_tokens=api_max_tokens,
            temperature=temperature,
            timeout=90  # 90 seconds timeout for the OpenAI API call
        )
        print("API RESPONSE RECEIVED")
        
        # Log the complete API response
        print("API RESPONSE:")
        print(response)
        print("-" * 80)
        
        # Get generated content and format it for better display
        generated_content = response.choices[0].message.content
        print("GENERATED CONTENT (FIRST 500 CHARS):")
        print(generated_content[:500] + "..." if len(generated_content) > 500 else generated_content)
        print("-" * 80)
        
        # Format the content
        formatted_content = format_content_for_display(generated_content)
        print("FORMATTED CONTENT (FIRST 500 CHARS):")
        print(formatted_content[:500] + "..." if len(formatted_content) > 500 else formatted_content)
        print("=" * 80)
        
        # Always try to extract or generate a title unless the user explicitly provided one
        document_title = title
        if not request.data.get('title') or title.startswith('AI Generated'):
            print("User didn't provide a custom title, attempting to extract or generate one")
            
            # First try to extract title from H1 tag
            extracted_title = extract_title_from_content(formatted_content)
            if extracted_title:
                print(f"Successfully extracted title from H1 tag: '{extracted_title}'")
                document_title = extracted_title
            else:
                # If no H1 tag found, generate a title using AI
                print("No H1 tag found, generating title using AI")
                generated_title = generate_title_from_content(formatted_content)
                if generated_title:
                    print(f"Successfully generated title: '{generated_title}'")
                    document_title = generated_title
                else:
                    print(f"Failed to generate title, using default: '{document_title}'")
        
        # Handle empty category_id - convert empty string to None
        category_id = None
        if document_category and document_category.strip():
            # Only set category_id if it's not an empty string
            print(f"Using category ID: {document_category}")
            category_id = document_category
        else:
            print("No category selected, using None for category_id")
        
        # Use a transaction to ensure that document creation and counter increment are atomic
        from django.db import transaction
        
        try:
            with transaction.atomic():
                # Create new document - let the model's save method handle plain_text extraction
                new_document = TextDocument.objects.create(
                    title=document_title,
                    content=formatted_content,
                    created_by=user,
                    organization=user.organization,
                    category_id=category_id,  # Use the selected document category or None
                    tags=tags,
                    status='draft'
                )
                
                # Only increment the AI generations counter if document creation was successful
                if is_full_generation:
                    organization.increment_ai_generations_used()
                
                # Return the new document
                serializer = TextDocumentDetailSerializer(new_document)
                return Response(
                    {
                        **serializer.data,
                        "ai_generations_used": organization.ai_generations_used,
                        "ai_generations_limit": organization.ai_generation_limit,
                        "ai_generations_remaining": organization.ai_generations_remaining
                    }, 
                    status=status.HTTP_201_CREATED
                )
        except Exception as e:
            # Log the error but don't increment the counter since document creation failed
            error_message = str(e)
            print(f"Error creating document: {error_message}")
            return Response({'error': f"Failed to create document: {error_message}"}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        error_message = str(e)
        print(f"OpenAI API error: {error_message}")
        
        # Check if it's a quota exceeded error
        if 'quota' in error_message.lower() or 'exceeded' in error_message.lower() or 'limit' in error_message.lower():
            return Response(
                {'error': f"OpenAI API quota exceeded: {error_message}. Please check your OpenAI account for details."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({'error': error_message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
