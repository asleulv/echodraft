# Generated manually

from django.db import migrations

def add_micro_document_template(apps, schema_editor):
    AIPromptTemplate = apps.get_model('documents', 'AIPromptTemplate')
    
    # Check if a micro template already exists
    if not AIPromptTemplate.objects.filter(template_type='micro_content').exists():
        # Create a new template for micro content
        AIPromptTemplate.objects.create(
            name='Micro Content Template',
            description='Template for generating very short content like SMS or tweets',
            template_type='micro_content',
            content="""Create a VERY SHORT message (maximum 160 characters) based on the following concept:

{concept}

STRICT REQUIREMENTS:
1. Your response MUST be 160 characters or less (SMS length)
2. Include ONLY the message text, no HTML formatting
3. Use the EXACT SAME LANGUAGE as the original concept
4. Capture the essence of the concept in a concise way

Example of appropriate length:
"Meeting postponed to Thursday 3pm. Bring the quarterly report and sales figures. Coffee provided. Reply to confirm attendance."

DO NOT exceed 160 characters under any circumstances.""",
            is_active=True,
            organization=None
        )

def remove_micro_document_template(apps, schema_editor):
    AIPromptTemplate = apps.get_model('documents', 'AIPromptTemplate')
    AIPromptTemplate.objects.filter(template_type='micro_content').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('documents', '0009_add_shorter_document_lengths'),
    ]
    
    operations = [
        migrations.RunPython(add_micro_document_template, remove_micro_document_template),
    ]
