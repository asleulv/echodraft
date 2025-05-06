# Generated manually

from django.db import migrations

def increase_very_short_token_limit(apps, schema_editor):
    DocumentLengthSettings = apps.get_model('documents', 'DocumentLengthSettings')
    
    # Update the very_short document length setting to have a higher token limit
    try:
        very_short_setting = DocumentLengthSettings.objects.get(length_name='very_short')
        very_short_setting.target_tokens = 1200  # Increase from 750 to 1200 tokens
        very_short_setting.save()
        print(f"Updated 'very_short' document length setting: target_tokens={very_short_setting.target_tokens}")
    except DocumentLengthSettings.DoesNotExist:
        print("'very_short' document length setting not found")

def revert_very_short_token_limit(apps, schema_editor):
    DocumentLengthSettings = apps.get_model('documents', 'DocumentLengthSettings')
    
    # Revert the very_short document length setting to its original token limit
    try:
        very_short_setting = DocumentLengthSettings.objects.get(length_name='very_short')
        very_short_setting.target_tokens = 750  # Revert to original value
        very_short_setting.save()
    except DocumentLengthSettings.DoesNotExist:
        pass

class Migration(migrations.Migration):
    dependencies = [
        ('documents', '0010_add_micro_document_template'),
    ]
    
    operations = [
        migrations.RunPython(increase_very_short_token_limit, revert_very_short_token_limit),
    ]
