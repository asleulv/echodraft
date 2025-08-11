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



