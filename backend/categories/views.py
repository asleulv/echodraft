from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, F

from .models import Category, Tag
from .serializers import (
    CategorySerializer,
    CategoryTreeSerializer,
    CategoryListSerializer,
    TagSerializer,
    TagListSerializer,
)
from accounts.permissions import IsSameOrganization

class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing Category instances."""
    
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Return categories for the current user's organization."""
        user = self.request.user
        
        # Base queryset - categories from user's organization
        queryset = Category.objects.filter(organization=user.organization)
        
        # Filter by parent if provided
        parent = self.request.query_params.get('parent', None)
        if parent:
            if parent == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent__slug=parent)
        
        # Annotate with document count (using a different name to avoid conflict with property)
        # Exclude deleted documents and only count latest versions
        queryset = queryset.annotate(
            documents_count=Count('documents', filter=~Q(documents__status='deleted') & Q(documents__is_latest=True))
        )
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer class based on the action."""
        if self.action == 'list':
            return CategoryListSerializer
        if self.action == 'tree':
            return CategoryTreeSerializer
        return CategorySerializer
    
    def perform_create(self, serializer):
        """Create a new category."""
        serializer.save(organization=self.request.user.organization)
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Return a tree structure of categories."""
        # Get only root categories (no parent)
        root_categories = self.get_queryset().filter(parent__isnull=True)
        
        # Annotate with document count (using a different name to avoid conflict with property)
        # Exclude deleted documents and only count latest versions
        root_categories = root_categories.annotate(
            documents_count=Count('documents', filter=~Q(documents__status='deleted') & Q(documents__is_latest=True))
        )
        
        serializer = CategoryTreeSerializer(root_categories, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def documents(self, request, slug=None):
        """Return documents in this category."""
        category = self.get_object()
        
        # Import here to avoid circular imports
        from documents.models import TextDocument
        from documents.serializers import TextDocumentListSerializer
        
        # Get documents in this category
        documents = TextDocument.objects.filter(
            organization=request.user.organization,
            category=category
        )
        
        # Apply filters
        status_filter = request.query_params.get('status', None)
        if status_filter:
            documents = documents.filter(status=status_filter)
        else:
            # By default, exclude deleted documents
            documents = documents.exclude(status='deleted')
        
        # Only latest versions by default
        latest_only = request.query_params.get('latest_only', 'true').lower() == 'true'
        if latest_only:
            documents = documents.filter(is_latest=True)
        
        serializer = TextDocumentListSerializer(documents, many=True)
        return Response(serializer.data)


class TagViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing Tag instances."""
    
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    lookup_field = 'slug'
    
    def get_queryset(self):
        """Return tags for the current user's organization."""
        user = self.request.user
        
        # Base queryset - tags from user's organization
        queryset = Tag.objects.filter(organization=user.organization)
        
        # Annotate with document count (excluding deleted documents and only counting latest versions)
        queryset = queryset.annotate(
            document_count=Count(
                'organization__documents',
                filter=Q(
                    organization__documents__tags__contains=[F('name')]
                ) & ~Q(organization__documents__status='deleted') & Q(organization__documents__is_latest=True)
            )
        )
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer class based on the action."""
        if self.action == 'list':
            return TagListSerializer
        return TagSerializer
    
    def perform_create(self, serializer):
        """Create a new tag."""
        serializer.save(organization=self.request.user.organization)
    
    @action(detail=True, methods=['get'])
    def documents(self, request, slug=None):
        """Return documents with this tag."""
        tag = self.get_object()
        
        # Import here to avoid circular imports
        from documents.models import TextDocument
        from documents.serializers import TextDocumentListSerializer
        
        # Get documents with this tag
        documents = TextDocument.objects.filter(
            organization=request.user.organization,
            tags__contains=[tag.name]
        )
        
        # Apply filters
        status_filter = request.query_params.get('status', None)
        if status_filter:
            documents = documents.filter(status=status_filter)
        else:
            # By default, exclude deleted documents
            documents = documents.exclude(status='deleted')
        
        # Only latest versions by default
        latest_only = request.query_params.get('latest_only', 'true').lower() == 'true'
        if latest_only:
            documents = documents.filter(is_latest=True)
        
        serializer = TextDocumentListSerializer(documents, many=True)
        return Response(serializer.data)
