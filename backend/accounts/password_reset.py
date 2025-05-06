from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from emails.utils import send_password_reset_email

User = get_user_model()

class PasswordResetRequestView(APIView):
    """
    API view to request a password reset.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Request a password reset for the user with the given email.
        """
        email = request.data.get('email')
        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the user with the given email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal that the user doesn't exist
            return Response(
                {"detail": "If a user with this email exists, a password reset link has been sent."},
                status=status.HTTP_200_OK
            )
        
        # Generate a password reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Create the reset URL with query parameters instead of path parameters
        reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
        
        # Send the password reset email
        try:
            send_password_reset_email(user, reset_url)
        except Exception as e:
            print(f"Error sending password reset email: {str(e)}")
            # Don't reveal the error to the user
        
        # Return a success response
        return Response(
            {"detail": "If a user with this email exists, a password reset link has been sent."},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    """
    API view to confirm a password reset.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """
        Reset the password for the user with the given UID and token.
        """
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not uid or not token or not new_password:
            return Response(
                {"detail": "UID, token, and new password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decode the UID
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"detail": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if the token is valid
        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "Invalid reset link or it has expired."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set the new password
        user.set_password(new_password)
        user.save()
        
        # Return a success response
        return Response(
            {"detail": "Password has been reset successfully."},
            status=status.HTTP_200_OK
        )
