from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
import json
import os
import logging
import requests
from google.oauth2 import id_token
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings


from .models import Organization
from documents.utils.demo_content import create_demo_documents_for_new_org
from .serializers import (
    OrganizationSerializer,
    UserCreateSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer
)
from .email_verification import generate_verification_token
from emails.utils import send_welcome_email


# Set up logger for this module
logger = logging.getLogger(__name__)
User = get_user_model()


@csrf_exempt
@require_http_methods(["POST"])
def google_auth_callback(request):
    """Handle Google OAuth authentication."""
    logger.info("Google OAuth authentication request received")
    
    try:
        data = json.loads(request.body)
        token = data.get('token')
        
        if not token:
            logger.warning("Google OAuth request missing token")
            return JsonResponse({'error': 'Token is required'}, status=400)
        
        logger.debug(f"Received token: {token[:50]}...")
        
        # Verify the token with Google - WITH CLOCK SKEW TOLERANCE
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            os.getenv('GOOGLE_CLIENT_ID'),
            clock_skew_in_seconds=60  # Allow 1 minute of clock difference
        )
        
        logger.debug("Token verified successfully with Google")
        
        # Extract user info
        email = idinfo['email']
        name = idinfo['name']
        google_id = idinfo['sub']
        
        logger.info(f"Google OAuth for user: {email}")
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
            logger.debug(f"Found existing user: {user.email}")
            
            # Update Google ID if not set
            if not user.google_id:
                logger.debug("Updating user's Google ID")
                user.google_id = google_id
                user.save()

            if not user.is_active:
                logger.info(f"Activating existing user for Google OAuth: {user.email}")
                user.is_active = True
                user.save()
                
        except User.DoesNotExist:
            logger.info(f"Creating new user for Google OAuth: {email}")
            
            # Create organization directly
            try:
                organization = Organization.objects.create(name=email)
                logger.debug(f"Created organization: {organization.name}")
            except Exception as org_error:
                logger.error(f"Organization creation failed: {str(org_error)}")
                return JsonResponse({'error': 'Organization creation failed'}, status=400)
            
            # Create user directly (no serializer = no password required)
            try:
                user = User.objects.create(
                    email=email,
                    username=email,
                    first_name=name.split(' ')[0] if name else '',
                    last_name=' '.join(name.split(' ')[1:]) if len(name.split(' ')) > 1 else '',
                    organization=organization,
                    role='admin',
                    is_active=True,
                    google_id=google_id
                )
                user.set_unusable_password()  # Google users don't need passwords
                user.save()
                logger.info(f"Created new user via Google OAuth: {user.email}")

                try:
                    create_demo_documents_for_new_org(organization, user)
                    logger.debug(f"Created demo documents for Google OAuth organization: {organization.name}")
                    
                    # Grant free credits to new Google users
                    try:
                        organization.add_bonus_credits(5)  # 5 free credits
                        logger.info(f"Granted 5 free credits to new Google user organization: {organization.name}")
                    except Exception as credit_error:
                        logger.error(f"Error granting free credits to Google organization {organization.name}: {str(credit_error)}")
                        
                except Exception as e:
                    logger.error(f"Error creating demo documents for Google OAuth {organization.name}: {str(e)}")
                
            except Exception as user_error:
                logger.error(f"User creation failed: {str(user_error)}")
                organization.delete()  # Clean up if user creation fails
                return JsonResponse({'error': 'User creation failed'}, status=400)

        # Generate JWT tokens for API authentication
        logger.debug("Generating JWT tokens for user")
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        logger.info(f"Google OAuth authentication successful for: {user.email}")
        
        return JsonResponse({
            'success': True,
            'token': access_token,           # JWT access token for API calls
            'refresh_token': refresh_token,  # JWT refresh token for token renewal
            'user': {
                'id': user.id,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip(),
                'organization': user.organization.name if user.organization else None
            }
        })
        
    except ValueError as e:
        error_msg = str(e)
        logger.warning(f"Google OAuth token validation error: {error_msg}")
        
        # Handle clock skew errors with user-friendly messages
        if "Token used too early" in error_msg or "Token used too late" in error_msg:
            return JsonResponse({
                'error': 'Authentication timing issue. Please check your device time and try again.',
                'error_type': 'clock_skew'
            }, status=401)
        else:
            return JsonResponse({
                'error': 'Invalid authentication token',
                'error_type': 'invalid_token'
            }, status=401)
            
    except Exception as e:
        logger.error(f"Google OAuth authentication failed: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': 'Authentication failed. Please try again.',
            'error_type': 'server_error'
        }, status=500)


class RegisterView(generics.CreateAPIView):
    """View for registering a new user and organization."""
    
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = UserCreateSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new user and organization."""
        logger.info("User registration request received")
        logger.info(f"Request data keys: {list(request.data.keys())}")
        logger.info(f"Captcha token received: {request.data.get('captchaToken')}")
        
        # Verify reCAPTCHA token
        captcha_token = request.data.get('captchaToken')
        if not captcha_token:
            return Response(
                {'error': 'Captcha token is missing.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        data = {
            'secret': settings.RECAPTCHA_SECRET_KEY,  # Put your secret key in your env and settings
            'response': captcha_token,
        }
        google_resp = requests.post('https://www.google.com/recaptcha/api/siteverify', data=data)
        result = google_resp.json()
        if not result.get('success'):
            logger.warning(f"reCAPTCHA validation failed: {result}")
            return Response(
                {'error': 'Invalid reCAPTCHA. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create organization first
        org_data = request.data.get('organization', {})
        
        # If organization is empty or not provided, use email
        if not org_data or (isinstance(org_data, dict) and not org_data.get('name')):
            email = request.data.get('email', '')
            org_data = {'name': email}  # Use the full email as org name
        elif isinstance(org_data, str) and not org_data.strip():
            # If organization is an empty string
            email = request.data.get('email', '')
            org_data = {'name': email}
        elif isinstance(org_data, str):
            # If organization is just a name string
            org_data = {'name': org_data}
        
        org_serializer = OrganizationSerializer(data=org_data)
        if org_serializer.is_valid():
            organization = org_serializer.save()
            logger.debug(f"Created organization: {organization.name}")
            
            # Then create user with organization and admin role
            user_data = request.data.copy()
            user_data['organization'] = organization.id
            user_data['role'] = 'admin'
            
            serializer = self.get_serializer(data=user_data)
            if serializer.is_valid():
                # Create the user but don't save yet
                user = serializer.save(is_active=False)
                
                # Generate and set verification token
                verification_token = generate_verification_token()
                user.email_verification_token = verification_token
                user.save()
                
                logger.info(f"Created new user registration: {user.email}")

                try:
                    create_demo_documents_for_new_org(organization, user)
                    logger.debug(f"Created demo documents for organization: {organization.name}")
                    
                    # Grant free credits to new email users
                    try:
                        organization.add_bonus_credits(5)  # 5 free credits
                        logger.info(f"Granted 5 free credits to new email user organization: {organization.name}")
                    except Exception as credit_error:
                        logger.error(f"Error granting free credits to email organization {organization.name}: {str(credit_error)}")
                        
                except Exception as e:
                    logger.error(f"Error creating demo documents for {organization.name}: {str(e)}")
                
                # Create verification URL
                verification_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token}"
                
                # Send welcome email with verification link
                try:
                    send_welcome_email(user, verification_url)
                    logger.debug(f"Welcome email sent to: {user.email}")
                except Exception as e:
                    logger.error(f"Error sending welcome email to {user.email}: {str(e)}")
                
                return Response(
                    {
                        'user': UserSerializer(user).data,
                        'organization': OrganizationSerializer(organization).data,
                        'message': 'Please check your email to verify your account.'
                    },
                    status=status.HTTP_201_CREATED
                )
            
            # If user creation fails, delete the organization
            logger.warning("User creation failed, cleaning up organization")
            organization.delete()
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        logger.warning("Organization creation failed during registration")
        return Response(org_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token view that uses our custom serializer with better error messages.
    """
    serializer_class = CustomTokenObtainPairSerializer
