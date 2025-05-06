from django.core.management.base import BaseCommand
from django.utils.translation import gettext_lazy as _
from documents.models import AIPromptTemplate

class Command(BaseCommand):
    help = 'Creates a default style analysis template if it does not exist'

    def handle(self, *args, **options):
        # Check if a global style analysis template already exists
        if AIPromptTemplate.objects.filter(template_type='style_analysis', organization__isnull=True).exists():
            self.stdout.write(self.style.WARNING('A global style analysis template already exists. Skipping.'))
            return

        # Create the default style analysis template
        template_content = """Analyze the writing style of the following documents and create a comprehensive style guide that will be used to generate new content that perfectly matches this style.

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

        # Create the template
        template = AIPromptTemplate.objects.create(
            name='Default Style Analysis',
            description='Default template for analyzing document style to create a style guide',
            template_type='style_analysis',
            content=template_content,
            organization=None,  # Global template
            is_active=True
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully created default style analysis template (ID: {template.id})'))
