from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='EmailTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='Template Name')),
                ('template_type', models.CharField(choices=[('welcome', 'Welcome Email'), ('subscription_confirmation', 'Subscription Confirmation'), ('password_reset', 'Password Reset')], max_length=50, unique=True, verbose_name='Template Type')),
                ('subject', models.CharField(max_length=255, verbose_name='Email Subject')),
                ('html_content', models.TextField(help_text='HTML content of the email. Use {{ variable }} for template variables.', verbose_name='HTML Content')),
                ('plain_content', models.TextField(help_text='Plain text version of the email. Use {{ variable }} for template variables.', verbose_name='Plain Text Content')),
                ('is_active', models.BooleanField(default=True, verbose_name='Active')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
            ],
            options={
                'verbose_name': 'Email Template',
                'verbose_name_plural': 'Email Templates',
            },
        ),
    ]
