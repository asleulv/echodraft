from rest_framework import permissions

class IsOrganizationAdmin(permissions.BasePermission):
    """
    Custom permission to only allow organization admins to perform certain actions.
    """
    
    def has_permission(self, request, view):
        # Allow all authenticated users to list and retrieve
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Check if user is an organization admin
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or request.user.is_organization_admin)
        )
    
    def has_object_permission(self, request, view, obj):
        # Allow all authenticated users to retrieve
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Check if user is an organization admin and belongs to the same organization
        if hasattr(obj, 'organization'):
            return (
                request.user.is_superuser or
                (request.user.is_organization_admin and request.user.organization == obj.organization)
            )
        
        # If the object is an organization
        if hasattr(obj, 'users'):
            return (
                request.user.is_superuser or
                (request.user.is_organization_admin and request.user.organization == obj)
            )
        
        return False


class IsSameOrganization(permissions.BasePermission):
    """
    Custom permission to only allow users from the same organization.
    """
    
    def has_permission(self, request, view):
        # Allow all authenticated users
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Allow superusers
        if request.user.is_superuser:
            return True
        
        # Check if user belongs to the same organization
        if hasattr(obj, 'organization'):
            return request.user.organization == obj.organization
        
        # If the object is an organization
        if hasattr(obj, 'users'):
            return request.user.organization == obj
        
        # For PDF exports
        if hasattr(obj, 'document') and hasattr(obj.document, 'organization'):
            # For DELETE requests, also check if the user is the creator
            if request.method == 'DELETE':
                return (request.user.organization == obj.document.organization and 
                        (obj.created_by == request.user or request.user.is_organization_admin))
            return request.user.organization == obj.document.organization
        
        return False


class IsUserOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow users to edit their own profile or admins to edit any profile.
    """
    
    def has_permission(self, request, view):
        # Allow all authenticated users
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Allow superusers
        if request.user.is_superuser:
            return True
        
        # Allow organization admins for users in their organization
        if request.user.is_organization_admin and obj.organization == request.user.organization:
            return True
        
        # Allow users to edit their own profile
        return obj == request.user
