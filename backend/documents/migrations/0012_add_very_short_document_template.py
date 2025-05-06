# Generated manually

from django.db import migrations

def add_very_short_document_template(apps, schema_editor):
    AIPromptTemplate = apps.get_model('documents', 'AIPromptTemplate')
    
    # Check if a very_short template already exists
    if not AIPromptTemplate.objects.filter(template_type='very_short_content').exists():
        # Create a new template for very short content
        AIPromptTemplate.objects.create(
            name='Very Short Content Template',
            description='Template for generating brief content (150-400 words)',
            template_type='very_short_content',
            content="""Create a BRIEF but COMPLETE document (150-400 words) based on the following concept:

{concept}

REQUIREMENTS:
1. Your response MUST be 150-400 words (brief but complete)
2. Use proper HTML formatting with appropriate tags
3. Use the EXACT SAME LANGUAGE as the original concept
4. Ensure your response has a clear beginning, middle, and end
5. Do not leave sentences incomplete or cut off

Your response MUST:
- Begin with an HTML heading tag (e.g., <h1>Title</h1>)
- Use paragraph tags (<p>) for all text blocks
- Use appropriate HTML elements for emphasis (<strong>, <em>) where relevant
- Be concise but COMPLETE - no unfinished sentences or thoughts

Style reference (analyze this carefully to match its tone and style):
{combined_content}

{formatting_instructions}""",
            is_active=True,
            organization=None
        )

def remove_very_short_document_template(apps, schema_editor):
    AIPromptTemplate = apps.get_model('documents', 'AIPromptTemplate')
    AIPromptTemplate.objects.filter(template_type='very_short_content').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('documents', '0011_increase_very_short_token_limit'),
    ]
    
    operations = [
        migrations.RunPython(add_very_short_document_template, remove_very_short_document_template),
    ]
