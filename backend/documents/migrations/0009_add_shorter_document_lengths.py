# Generated manually

from django.db import migrations

def add_shorter_document_lengths(apps, schema_editor):
    DocumentLengthSettings = apps.get_model('documents', 'DocumentLengthSettings')
    
    # Add new shorter document length options
    new_lengths = [
        {'length_name': 'micro', 'description': 'Micro (50-160 characters)', 'target_tokens': 50},
        {'length_name': 'very_short', 'description': 'Very Short (150-400 words)', 'target_tokens': 750},
    ]
    
    for length_data in new_lengths:
        # Check if it already exists (in case migration is run multiple times)
        if not DocumentLengthSettings.objects.filter(length_name=length_data['length_name']).exists():
            DocumentLengthSettings.objects.create(**length_data)

def remove_shorter_document_lengths(apps, schema_editor):
    DocumentLengthSettings = apps.get_model('documents', 'DocumentLengthSettings')
    DocumentLengthSettings.objects.filter(length_name__in=['micro', 'very_short']).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('documents', '0008_populate_ai_settings'),
    ]
    
    operations = [
        migrations.RunPython(add_shorter_document_lengths, remove_shorter_document_lengths),
    ]
