from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.conf import settings
from emails.utils import send_welcome_email
from .email_verification import generate_verification_token

from .models import Organization
from .serializers import (
    OrganizationSerializer,
    UserSerializer,
    UserCreateSerializer,
    PasswordChangeSerializer,
    ProfileUpdateSerializer,
)
from .permissions import (
    IsOrganizationAdmin,
    IsSameOrganization,
    IsUserOrAdmin,
)

User = get_user_model()

class OrganizationViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing Organization instances."""
    
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizationAdmin]
    
    def get_queryset(self):
        """Return organizations for the current user."""
        user = self.request.user
        if user.is_superuser:
            return Organization.objects.all()
        if user.organization:
            return Organization.objects.filter(id=user.organization.id)
        return Organization.objects.none()
    
    @action(detail=True, methods=['get'])
    def users(self, request, pk=None):
        """Return users for the organization."""
        organization = self.get_object()
        users = User.objects.filter(organization=organization)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_user(self, request, pk=None):
        """Add a user to the organization."""
        organization = self.get_object()
        
        # Check if organization has reached user limit
        if organization.user_limit > 0 and organization.users.count() >= organization.user_limit:
            return Response(
                {"detail": "Organization has reached its user limit."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(organization=organization)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing User instances."""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    
    def get_queryset(self):
        """Return users for the current user's organization."""
        user = self.request.user
        if user.is_superuser:
            return User.objects.all()
        if user.organization and user.is_organization_admin:
            return User.objects.filter(organization=user.organization)
        return User.objects.filter(id=user.id)
    
    def get_permissions(self):
        """Return appropriate permissions for the action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsOrganizationAdmin]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Return the current user."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        """Change the user's password."""
        user = self.get_object()
        self.check_object_permissions(request, user)
        
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {"old_password": ["Wrong password."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"status": "password set"})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def update_profile(self, request, pk=None):
        """Update the user's profile."""
        user = self.get_object()
        self.check_object_permissions(request, user)
        
        serializer = ProfileUpdateSerializer(
            user, 
            data=request.data, 
            partial=True,
            context={'request': request}  # Pass request to serializer context
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    """View for registering a new user and organization."""
    
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserCreateSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new user and organization."""
        # Create organization first
        org_data = request.data.get('organization', {})
        
        # If organization is empty or not provided, use email
        if not org_data or (isinstance(org_data, dict) and not org_data.get('name')):
            email = request.data.get('email', '')
            org_data = {'name': email}  # Simply use the full email as org name
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
                
                # Create verification URL - point to the frontend verification page
                verification_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token}"
                
                # Send welcome email with verification link
                try:
                    send_welcome_email(user, verification_url)
                except Exception as e:
                    # Log the error but don't prevent registration
                    print(f"Error sending welcome email: {str(e)}")
                
                return Response(
                    {
                        'user': UserSerializer(user).data,
                        'organization': OrganizationSerializer(organization).data,
                        'message': 'Please check your email to verify your account.'
                    },
                    status=status.HTTP_201_CREATED
                )
            # If user creation fails, delete the organization
            organization.delete()
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(org_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
