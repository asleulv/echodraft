# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_user_anthropic_api_key_user_openai_api_key_and_more'),
        ('documents', '0006_aiprompttemplate'),
    ]

    operations = [
        migrations.CreateModel(
            name='AIModelSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('model_name', models.CharField(help_text='Name of the AI model (e.g., gpt-3.5-turbo)', max_length=50, unique=True, verbose_name='Model Name')),
                ('max_tokens', models.IntegerField(help_text='Maximum tokens the model can generate', verbose_name='Max Tokens')),
                ('is_active', models.BooleanField(default=True, verbose_name='Is Active')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
            ],
            options={
                'verbose_name': 'AI Model Setting',
                'verbose_name_plural': 'AI Model Settings',
            },
        ),
        migrations.CreateModel(
            name='DocumentLengthSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('length_name', models.CharField(help_text='Name of length setting (e.g., short, medium)', max_length=20, unique=True, verbose_name='Length Name')),
                ('description', models.CharField(help_text='Human-readable description (e.g., \'500-750 words\')', max_length=100, verbose_name='Description')),
                ('target_tokens', models.IntegerField(help_text='Target token count for this length', verbose_name='Target Tokens')),
                ('is_active', models.BooleanField(default=True, verbose_name='Is Active')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
                ('organization', models.ForeignKey(blank=True, help_text='If set, applies only to this organization', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='document_length_settings', to='accounts.organization', verbose_name='Organization')),
            ],
            options={
                'verbose_name': 'Document Length Setting',
                'verbose_name_plural': 'Document Length Settings',
                'unique_together': {('length_name', 'organization')},
            },
        ),
    ]
