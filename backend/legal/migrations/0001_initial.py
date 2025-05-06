from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='LegalDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('terms', 'Terms of Service'), ('privacy', 'Privacy Policy')], max_length=20, unique=True)),
                ('title', models.CharField(max_length=200)),
                ('content', models.TextField()),
                ('version', models.PositiveIntegerField(default=1)),
                ('effective_date', models.DateField(default=django.utils.timezone.now)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-effective_date'],
            },
        ),
    ]
