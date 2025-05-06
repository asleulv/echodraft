from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_contact_email(request):
    """
    Send a contact form submission as an email.
    """
    try:
        # Extract form data
        name = request.data.get('name', '')
        email = request.data.get('email', '')
        subject = request.data.get('subject', '')
        message = request.data.get('message', '')
        
        # Validate required fields
        if not all([name, email, subject, message]):
            return Response(
                {"error": "All fields are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Format email message
        email_subject = f"echodraft contact form: {subject}"
        email_message = f"""
Contact Form Submission

From: {name} <{email}>
Subject: {subject}

Message:
{message}
"""
        
        # Send email
        send_mail(
            subject=email_subject,
            message=email_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.CONTACT_EMAIL],
            fail_silently=False,
        )
        
        logger.info(f"Contact form email sent from {email}")
        
        return Response(
            {"success": "Your message has been sent successfully."},
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        logger.error(f"Error sending contact form email: {str(e)}")
        return Response(
            {"error": "An error occurred while sending your message. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
