# Generated manually

from django.db import migrations

def create_initial_ai_settings(apps, schema_editor):
    AIModelSettings = apps.get_model('documents', 'AIModelSettings')
    
    # Create default model settings
    models = [
        {'model_name': 'gpt-3.5-turbo', 'max_tokens': 4096},
        {'model_name': 'gpt-4', 'max_tokens': 8192},
        {'model_name': 'gpt-4-turbo', 'max_tokens': 4096},
    ]
    
    for model_data in models:
        AIModelSettings.objects.create(**model_data)
    
    # Create default document length settings
    DocumentLengthSettings = apps.get_model('documents', 'DocumentLengthSettings')
    
    lengths = [
        {'length_name': 'short', 'description': 'Short (500-750 words)', 'target_tokens': 1500},
        {'length_name': 'medium', 'description': 'Medium (750-1500 words)', 'target_tokens': 3000},
        {'length_name': 'long', 'description': 'Long (1500-3000 words)', 'target_tokens': 4000},
        {'length_name': 'very_long', 'description': 'Very Long (3000+ words)', 'target_tokens': 4000},
    ]
    
    for length_data in lengths:
        DocumentLengthSettings.objects.create(**length_data)

def reverse_initial_ai_settings(apps, schema_editor):
    AIModelSettings = apps.get_model('documents', 'AIModelSettings')
    AIModelSettings.objects.all().delete()
    
    DocumentLengthSettings = apps.get_model('documents', 'DocumentLengthSettings')
    DocumentLengthSettings.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('documents', '0007_aimodelsettings_documentlengthsettings'),
    ]
    
    operations = [
        migrations.RunPython(create_initial_ai_settings, reverse_initial_ai_settings),
    ]
