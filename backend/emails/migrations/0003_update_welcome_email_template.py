from django.db import migrations

def update_welcome_email_template(apps, schema_editor):
    """
    Update the welcome email template to include a verification link.
    """
    EmailTemplate = apps.get_model('emails', 'EmailTemplate')
    
    try:
        # Get the existing welcome email template
        welcome_template = EmailTemplate.objects.get(template_type='welcome')
        
        # Update the HTML content to include the verification button
        welcome_template.html_content = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to echodraft</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #4a6cf7; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        .verification-notice { background-color: #fffde7; padding: 15px; border-left: 4px solid #ffd600; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to echodraft!</h1>
    </div>
    <div class="content">
        <p>Hello {{ user.first_name|default:user.username }},</p>
        
        <p>Thank you for joining echodraft! We're excited to have you on board.</p>
        
        {% if requires_verification %}
        <div class="verification-notice">
            <p><strong>Please verify your email address</strong> to activate your account by clicking the button below:</p>
            
            <p style="text-align: center;">
                <a href="{{ verification_url }}" class="button">Verify Email Address</a>
            </p>
            
            <p>If the button doesn't work, you can copy and paste this URL into your browser:</p>
            <p>{{ verification_url }}</p>
        </div>
        {% endif %}
        
        <p>With echodraft, you can:</p>
        <ul>
            <li>Create and manage text documents</li>
            <li>Generate content using AI</li>
            <li>Organize your documents in categories</li>
            <li>Export your documents in various formats</li>
        </ul>
        
        {% if not requires_verification %}
        <p>To get started, simply log in to your account:</p>
        
        <p style="text-align: center;">
            <a href="{{ login_url }}" class="button">Log In to Your Account</a>
        </p>
        {% endif %}
        
        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        
        <p>Best regards,<br>The echodraft Team</p>
    </div>
    <div class="footer">
        <p>&copy; 2025 echodraft. All rights reserved.</p>
    </div>
</body>
</html>
        """
        
        # Update the plain text content to include the verification link
        welcome_template.plain_content = """
Hello {{ user.first_name|default:user.username }},

Thank you for joining echodraft! We're excited to have you on board.

{% if requires_verification %}
PLEASE VERIFY YOUR EMAIL ADDRESS to activate your account by visiting this link:
{{ verification_url }}
{% endif %}

With echodraft, you can:
- Create and manage text documents
- Generate content using AI
- Organize your documents in categories
- Export your documents in various formats

{% if not requires_verification %}
To get started, simply log in to your account: {{ login_url }}
{% endif %}

If you have any questions or need assistance, feel free to contact our support team.

Best regards,
The echodraft Team

© 2025 echodraft. All rights reserved.
        """
        
        welcome_template.save()
        
    except EmailTemplate.DoesNotExist:
        # If the template doesn't exist, we don't need to update it
        # It will be created with the correct content in the initial data migration
        pass

def reverse_migration(apps, schema_editor):
    """
    No need to reverse this migration as it only updates content.
    """
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('emails', '0002_initial_data'),
    ]

    operations = [
        migrations.RunPython(update_welcome_email_template, reverse_migration),
    ]
