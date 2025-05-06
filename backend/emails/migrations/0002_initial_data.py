from django.db import migrations


def create_default_templates(apps, schema_editor):
    """
    Create default email templates.
    """
    EmailTemplate = apps.get_model('emails', 'EmailTemplate')
    
    # Welcome Email Template
    welcome_template = EmailTemplate(
        name="Default Welcome Email",
        template_type="welcome",
        subject="Welcome to echodraft, {{ user.first_name|default:user.username }}!",
        html_content="""
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
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to echodraft!</h1>
    </div>
    <div class="content">
        <p>Hello {{ user.first_name|default:user.username }},</p>
        
        <p>Thank you for joining echodraft! We're excited to have you on board.</p>
        
        <p>With echodraft, you can:</p>
        <ul>
            <li>Create and manage text documents</li>
            <li>Generate content using AI</li>
            <li>Organize your documents in categories</li>
            <li>Export your documents in various formats</li>
        </ul>
        
        <p>To get started, simply log in to your account:</p>
        
        <p style="text-align: center;">
            <a href="{{ login_url }}" class="button">Log In to Your Account</a>
        </p>
        
        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        
        <p>Best regards,<br>The echodraft Team</p>
    </div>
    <div class="footer">
        <p>&copy; 2025 echodraft. All rights reserved.</p>
    </div>
</body>
</html>
        """,
        plain_content="""
Hello {{ user.first_name|default:user.username }},

Thank you for joining echodraft! We're excited to have you on board.

With echodraft, you can:
- Create and manage text documents
- Generate content using AI
- Organize your documents in categories
- Export your documents in various formats

To get started, simply log in to your account: {{ login_url }}

If you have any questions or need assistance, feel free to contact our support team.

Best regards,
The echodraft Team

© 2025 echodraft. All rights reserved.
        """,
        is_active=True
    )
    welcome_template.save()
    
    # Subscription Confirmation Email Template
    subscription_template = EmailTemplate(
        name="Default Subscription Confirmation Email",
        template_type="subscription_confirmation",
        subject="Your echodraft {{ subscription.plan_display_name }} Subscription Confirmation",
        html_content="""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Subscription Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #4a6cf7; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        .details { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Subscription Confirmation</h1>
    </div>
    <div class="content">
        <p>Hello {{ user.first_name|default:user.username }},</p>
        
        <p>Thank you for subscribing to the <strong>{{ subscription.plan_display_name }}</strong> plan on echodraft!</p>
        
        <div class="details">
            <h3>Subscription Details:</h3>
            <p><strong>Plan:</strong> {{ subscription.plan_display_name }}</p>
            <p><strong>Price:</strong> {{ subscription.currency }} {{ subscription.price }}/month</p>
            <p><strong>Organization:</strong> {{ organization.name }}</p>
        </div>
        
        <p>Your subscription is now active, and you can enjoy all the benefits of the {{ subscription.plan_display_name }} plan.</p>
        
        <p>To access your dashboard and start using your subscription:</p>
        
        <p style="text-align: center;">
            <a href="{{ dashboard_url }}" class="button">Go to Dashboard</a>
        </p>
        
        <p>If you have any questions about your subscription or need assistance, please don't hesitate to contact our support team.</p>
        
        <p>Thank you for choosing echodraft!</p>
        
        <p>Best regards,<br>The echodraft Team</p>
    </div>
    <div class="footer">
        <p>&copy; 2025 echodraft. All rights reserved.</p>
    </div>
</body>
</html>
        """,
        plain_content="""
Hello {{ user.first_name|default:user.username }},

Thank you for subscribing to the {{ subscription.plan_display_name }} plan on echodraft!

Subscription Details:
- Plan: {{ subscription.plan_display_name }}
- Price: {{ subscription.currency }} {{ subscription.price }}/month
- Organization: {{ organization.name }}

Your subscription is now active, and you can enjoy all the benefits of the {{ subscription.plan_display_name }} plan.

To access your dashboard and start using your subscription, visit: {{ dashboard_url }}

If you have any questions about your subscription or need assistance, please don't hesitate to contact our support team.

Thank you for choosing echodraft!

Best regards,
The echodraft Team

© 2025 echodraft. All rights reserved.
        """,
        is_active=True
    )
    subscription_template.save()
    
    # Password Reset Email Template
    password_reset_template = EmailTemplate(
        name="Default Password Reset Email",
        template_type="password_reset",
        subject="Reset your echodraft password",
        html_content="""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #4a6cf7; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        .warning { color: #e74c3c; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Password Reset</h1>
    </div>
    <div class="content">
        <p>Hello {{ user.first_name|default:user.username }},</p>
        
        <p>We received a request to reset your password for your echodraft account. If you didn't make this request, you can safely ignore this email.</p>
        
        <p>To reset your password, click the button below:</p>
        
        <p style="text-align: center;">
            <a href="{{ reset_url }}" class="button">Reset Password</a>
        </p>
        
        <p class="warning">This link will expire in 24 hours for security reasons.</p>
        
        <p>If the button above doesn't work, you can copy and paste the following URL into your browser:</p>
        
        <p>{{ reset_url }}</p>
        
        <p>If you have any issues or need assistance, please contact our support team.</p>
        
        <p>Best regards,<br>The echodraft Team</p>
    </div>
    <div class="footer">
        <p>&copy; 2025 echodraft. All rights reserved.</p>
    </div>
</body>
</html>
        """,
        plain_content="""
Hello {{ user.first_name|default:user.username }},

We received a request to reset your password for your echodraft account. If you didn't make this request, you can safely ignore this email.

To reset your password, please visit the following link:

{{ reset_url }}

This link will expire in 24 hours for security reasons.

If you have any issues or need assistance, please contact our support team.

Best regards,
The echodraft Team

© 2025 echodraft. All rights reserved.
        """,
        is_active=True
    )
    password_reset_template.save()


def delete_default_templates(apps, schema_editor):
    """
    Delete default email templates.
    """
    EmailTemplate = apps.get_model('emails', 'EmailTemplate')
    EmailTemplate.objects.filter(template_type__in=['welcome', 'subscription_confirmation', 'password_reset']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('emails', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_templates, delete_default_templates),
    ]
