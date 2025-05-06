from django.core.mail import send_mail
from django.conf import settings
from django.template import Template, Context
from .models import EmailTemplate

def get_template(template_type):
    """
    Get the active email template of the specified type.
    
    Args:
        template_type: The type of template to retrieve ('welcome', 'subscription_confirmation', 'password_reset')
    
    Returns:
        EmailTemplate object or None if no active template of the specified type exists
    """
    try:
        return EmailTemplate.objects.get(template_type=template_type, is_active=True)
    except EmailTemplate.DoesNotExist:
        return None

def send_templated_email(template_type, context_data, recipient_email):
    """
    Send an email using a template from the database.
    
    Args:
        template_type: The type of template to use ('welcome', 'subscription_confirmation', 'password_reset')
        context_data: Dictionary containing the template variables
        recipient_email: Email address of the recipient
    
    Returns:
        Boolean indicating whether the email was sent successfully
    """
    template = get_template(template_type)
    
    if not template:
        # Log that the template doesn't exist
        print(f"Email template '{template_type}' not found or not active")
        return False
    
    # Render the subject and content with the provided context
    subject_template = Template(template.subject)
    html_template = Template(template.html_content)
    plain_template = Template(template.plain_content)
    
    context = Context(context_data)
    
    subject = subject_template.render(context)
    html_message = html_template.render(context)
    plain_message = plain_template.render(context)
    
    # Send the email
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        # Log the error
        print(f"Error sending email: {str(e)}")
        return False

def send_welcome_email(user, verification_url=None):
    """
    Send a welcome email to a newly registered user.
    
    Args:
        user: The User object for the newly registered user
        verification_url: URL for email verification (optional)
    
    Returns:
        Boolean indicating whether the email was sent successfully
    """
    context_data = {
        'user': {
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'organization': {
            'name': user.organization.name if user.organization else '',
        },
        'site_name': 'echodraft',
        'login_url': settings.FRONTEND_URL + '/login',
        'verification_url': verification_url,
        'requires_verification': verification_url is not None,
    }
    
    return send_templated_email('welcome', context_data, user.email)

def send_subscription_confirmation_email(user, plan_name, plan_display_name, price, currency='USD'):
    """
    Send a confirmation email when a user purchases a subscription.
    
    Args:
        user: The User object for the subscriber
        plan_name: The name of the subscription plan (e.g., 'creator')
        plan_display_name: The display name of the subscription plan (e.g., 'Creator')
        price: The price of the subscription
        currency: The currency of the subscription (default: 'USD')
    
    Returns:
        Boolean indicating whether the email was sent successfully
    """
    context_data = {
        'user': {
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'organization': {
            'name': user.organization.name if user.organization else '',
        },
        'subscription': {
            'plan_name': plan_name,
            'plan_display_name': plan_display_name,
            'price': price,
            'currency': currency,
        },
        'site_name': 'echodraft',
        'dashboard_url': settings.FRONTEND_URL + '/dashboard',
    }
    
    return send_templated_email('subscription_confirmation', context_data, user.email)

def send_password_reset_email(user, reset_url):
    """
    Send a password reset email to a user.
    
    Args:
        user: The User object for the user requesting password reset
        reset_url: The URL for resetting the password
    
    Returns:
        Boolean indicating whether the email was sent successfully
    """
    context_data = {
        'user': {
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'reset_url': reset_url,
        'site_name': 'echodraft',
    }
    
    return send_templated_email('password_reset', context_data, user.email)
