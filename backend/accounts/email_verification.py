import uuid
import logging
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import redirect

# Set up logging
logger = logging.getLogger(__name__)

User = get_user_model()

def generate_verification_token():
    """Generate a unique verification token."""
    return str(uuid.uuid4())

class EmailVerificationView(APIView):
    """
    API view to verify a user's email address.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, token):
        """
        Verify a user's email address using the provided token.
        """
        logger.info(f"Email verification requested for token: {token}")
        
        if not token:
            logger.error("Email verification failed: No token provided")
            return redirect(f"{settings.FRONTEND_URL}/login?verified=false")
        
        try:
            # Find the user with the given token
            logger.info(f"Looking up user with token: {token}")
            user = User.objects.get(email_verification_token=token)
            
            logger.info(f"User found: {user.username} (ID: {user.id})")
            
            # Activate the user
            user.is_active = True
            user.email_verification_token = None  # Clear the token
            user.save()
            
            logger.info(f"User {user.username} activated successfully")
            
            # Redirect to the frontend with a success message and username
            redirect_url = f"{settings.FRONTEND_URL}/login?verified=true&username={user.username}"
            logger.info(f"Redirecting to: {redirect_url}")
            return redirect(redirect_url)
            
        except User.DoesNotExist:
            logger.error(f"Email verification failed: No user found with token {token}")
            # Redirect to the frontend with an error message
            return redirect(f"{settings.FRONTEND_URL}/login?verified=false")
        except Exception as e:
            logger.exception(f"Unexpected error during email verification: {str(e)}")
            return redirect(f"{settings.FRONTEND_URL}/login?verified=false")
