import os
from django.core.management.base import BaseCommand
from documents.models import AIPromptTemplate

class Command(BaseCommand):
    help = 'Creates default AI prompt templates in the database'

    def handle(self, *args, **options):
        # Check if templates already exist
        if AIPromptTemplate.objects.filter(organization__isnull=True).exists():
            self.stdout.write(self.style.WARNING('Default templates already exist. Use --force to overwrite.'))
            if not options.get('force'):
                return
            
        # System message template
        system_message = AIPromptTemplate.objects.update_or_create(
            template_type='system_message',
            organization=None,
            defaults={
                'name': 'Default System Message',
                'description': 'The system message sent to the AI model to set its behavior.',
                'content': """You are a helpful assistant that creates beautifully formatted documents in HTML format. Your output should be valid HTML with proper tags for headings, paragraphs, lists, etc. The HTML will be displayed in a rich text editor, so ensure it has proper structure and formatting. Always respond in the EXACT SAME LANGUAGE as the user's concept/request.""",
                'is_active': True
            }
        )[0]
        self.stdout.write(self.style.SUCCESS(f'Created/updated system message template: {system_message.name}'))
        
        # Formatting instructions template
        formatting = AIPromptTemplate.objects.update_or_create(
            template_type='formatting',
            organization=None,
            defaults={
                'name': 'Default Formatting Instructions',
                'description': 'Instructions for formatting the AI-generated content as HTML.',
                'content': """
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


""",
                'is_active': True
            }
        )[0]
        self.stdout.write(self.style.SUCCESS(f'Created/updated formatting template: {formatting.name}'))
        
        # New content template
        new_content = AIPromptTemplate.objects.update_or_create(
            template_type='new_content',
            organization=None,
            defaults={
                'name': 'Default New Content Template',
                'description': 'Template for generating new content based on a concept.',
                'content': """Write a {length_description} document about the following concept in HTML format with proper HTML tags:

{concept}

Use the style, tone, and emotional quality (warmth/coldness/formality) of the following example documents to guide your writing. Match their writing style precisely:

{combined_content}

IMPORTANT: Your response must be in the EXACT SAME LANGUAGE as the concept. Match the style, tone, and emotional qualities of the example documents while maintaining the language of the concept.

Make sure the document is well-structured, engaging, and matches the style of the example documents. The output must be valid HTML with proper tags for headings, paragraphs, lists, etc.

{formatting_instructions}""",
                'is_active': True
            }
        )[0]
        self.stdout.write(self.style.SUCCESS(f'Created/updated new content template: {new_content.name}'))
        
        # Summary template
        summary = AIPromptTemplate.objects.update_or_create(
            template_type='summary',
            organization=None,
            defaults={
                'name': 'Default Summary Template',
                'description': 'Template for generating summaries of existing documents.',
                'content': """Create a {length_description} summary of the following documents in HTML format with proper HTML tags:

{combined_content}

Use the style, tone, and emotional quality (warmth/coldness/formality) of the original documents in your summary. Match their writing style precisely.

IMPORTANT: Your response must be in the EXACT SAME LANGUAGE as the original documents. Maintain the language of the documents you are summarizing.

The output must be valid HTML with proper tags for headings, paragraphs, lists, etc.

{formatting_instructions}""",
                'is_active': True
            }
        )[0]
        self.stdout.write(self.style.SUCCESS(f'Created/updated summary template: {summary.name}'))
        
        # Analysis template
        analysis = AIPromptTemplate.objects.update_or_create(
            template_type='analysis',
            organization=None,
            defaults={
                'name': 'Default Analysis Template',
                'description': 'Template for generating analyses of existing documents.',
                'content': """Write a {length_description} analysis of the following documents and provide insights in HTML format with proper HTML tags:

{combined_content}

Use the style, tone, and emotional quality (warmth/coldness/formality) of the original documents in your analysis. Match their writing style precisely.

IMPORTANT: Your response must be in the EXACT SAME LANGUAGE as the original documents. Maintain the language of the documents you are analyzing.

The output must be valid HTML with proper tags for headings, paragraphs, lists, etc.

{formatting_instructions}""",
                'is_active': True
            }
        )[0]
        self.stdout.write(self.style.SUCCESS(f'Created/updated analysis template: {analysis.name}'))
        
        # Comparison template
        comparison = AIPromptTemplate.objects.update_or_create(
            template_type='comparison',
            organization=None,
            defaults={
                'name': 'Default Comparison Template',
                'description': 'Template for generating comparisons of existing documents.',
                'content': """Write a {length_description} comparison of the following documents, contrasting their key points in HTML format with proper HTML tags:

{combined_content}

Use the style, tone, and emotional quality (warmth/coldness/formality) of the original documents in your comparison. Match their writing style precisely.

IMPORTANT: Your response must be in the EXACT SAME LANGUAGE as the original documents. Maintain the language of the documents you are comparing.

The output must be valid HTML with proper tags for headings, paragraphs, lists, etc.

{formatting_instructions}""",
                'is_active': True
            }
        )[0]
        self.stdout.write(self.style.SUCCESS(f'Created/updated comparison template: {comparison.name}'))
        
        # Custom template
        custom = AIPromptTemplate.objects.update_or_create(
            template_type='custom',
            organization=None,
            defaults={
                'name': 'Default Custom Template',
                'description': 'Template for generating custom documents based on existing content.',
                'content': """Create a {length_description} document based on the following content in HTML format with proper HTML tags:

{combined_content}

Use the style, tone, and emotional quality (warmth/coldness/formality) of the original documents. Match their writing style precisely.

IMPORTANT: Your response must be in the EXACT SAME LANGUAGE as the original documents. Maintain the language of the source documents.

The output must be valid HTML with proper tags for headings, paragraphs, lists, etc.

{formatting_instructions}""",
                'is_active': True
            }
        )[0]
        self.stdout.write(self.style.SUCCESS(f'Created/updated custom template: {custom.name}'))
        
        self.stdout.write(self.style.SUCCESS('All default AI prompt templates have been created/updated.'))

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force overwrite of existing templates',
        )
