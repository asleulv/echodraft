from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.http import Http404

from ..models import TextDocument
from ..serializers import (
    TextDocumentListSerializer,
    TextDocumentDetailSerializer,
    TextDocumentCreateSerializer,
    TextDocumentUpdateSerializer,
)
from ..utils.onboarding import user_has_only_demo_documents
from accounts.permissions import IsSameOrganization


class TextDocumentViewSet(viewsets.ModelViewSet):
    """Clean ViewSet for TextDocument with both slug and ID lookup support."""
    
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'plain_text', 'tags', 'category__name']
    ordering_fields = ['title', 'created_at', 'updated_at']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        """Return documents for user's organization with filtering."""
        user = self.request.user
        queryset = TextDocument.objects.filter(organization=user.organization)
        
        # Apply filters
        return self._apply_filters(queryset)
    
    def _apply_filters(self, queryset):
        """Apply all query parameter filters."""
        # Exclude deleted documents by default
        include_deleted = self.request.query_params.get('include_deleted', 'false').lower() == 'true'
        if not include_deleted:
            queryset = queryset.exclude(status='deleted')
        
        # Version filtering (this is key for your versioning system)
        latest_only = self.request.query_params.get('latest_only', 'true').lower() == 'true'
        if latest_only:
            queryset = queryset.filter(is_latest=True)
        
        # Category filter
        category = self.request.query_params.get('category')
        if category:
            if category.lower() == 'null':
                queryset = queryset.filter(category__isnull=True)
            else:
                try:
                    queryset = queryset.filter(category_id=int(category))
                except (ValueError, TypeError):
                    pass
        
        # Status filter
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Tags filter
        tags = self.request.query_params.get('tags')
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
            
            tag_q = Q()
            for tag in tag_list:
                # Search for the tag within the JSON array (as text)
                tag_q |= Q(tags__icontains=f'"{tag}"')
            
            if tag_q:
                queryset = queryset.filter(tag_q)
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return TextDocumentListSerializer
        elif self.action == 'create':
            return TextDocumentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TextDocumentUpdateSerializer
        return TextDocumentDetailSerializer
    
    def get_object(self):
        """
        Handle both slug and ID lookups with proper version filtering support.
        When multiple versions exist with same slug, respect the latest_only parameter.
        """
        queryset = self.get_queryset()  # Already includes version filtering
        lookup_value = self.kwargs['pk']
        
        if lookup_value.isdigit():
            # ID lookup - straightforward
            obj = get_object_or_404(queryset, id=int(lookup_value))
        else:
            # Slug lookup - need to handle multiple versions
            documents = queryset.filter(slug=lookup_value)
            
            if not documents.exists():
                raise Http404("Document not found")
            
            # Check if we want latest only (from query params)
            latest_only = self.request.query_params.get('latest_only', 'true').lower() == 'true'
            
            if latest_only:
                # Get the latest version
                obj = documents.filter(is_latest=True).first()
                if not obj:
                    raise Http404("No latest version found")
            else:
                # For latest_only=false, we need to pick one. Let's get the highest version
                obj = documents.order_by('-version').first()
        
        self.check_object_permissions(self.request, obj)
        return obj
    
    def list(self, request, *args, **kwargs):
        """Override list method to include demo document check"""
        # Let DRF handle filtering and pagination first
        response = super().list(request, *args, **kwargs)
        
        # Check if user only has demo documents
        has_only_demo_documents = user_has_only_demo_documents(request.user)
        
        # Modify the response to include your custom fields
        response.data = {
            'documents': response.data.get('results', response.data),
            'count': response.data.get('count', len(response.data.get('results', []))),
            'has_only_demo_documents': has_only_demo_documents,
            'show_getting_started': has_only_demo_documents
        }
    
        return response

    
    def destroy(self, request, *args, **kwargs):
        """Soft delete by changing status."""
        document = self.get_object()
        document.status = 'deleted'
        document.save()
        return Response({"detail": "Document moved to trash."})
    
    @action(detail=True, methods=['post'])
    def create_version(self, request, pk=None):
        """Create new version of document."""
        document = self.get_object()
        if not document.is_latest:
            return Response(
                {"detail": "Cannot create a new version from an old version."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        new_version = document.create_new_version()
        if request.data:
            serializer = TextDocumentUpdateSerializer(new_version, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(TextDocumentDetailSerializer(new_version).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(TextDocumentDetailSerializer(new_version).data)
    
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """Return all versions of a document."""
        document = self.get_object()
        
        # Get the root document
        root = document
        while root.parent:
            root = root.parent
        
        # Find all versions recursively
        all_versions = []
        
        def find_child_versions(parent_id):
            all_versions.append(parent_id)
            children = TextDocument.objects.filter(parent_id=parent_id)
            for child in children:
                find_child_versions(child.id)
        
        find_child_versions(root.id)
        
        # Get all versions
        versions = TextDocument.objects.filter(id__in=all_versions).order_by('version')
        serializer = TextDocumentListSerializer(versions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='bulk/delete')
    def bulk_delete(self, request):
        """Soft delete multiple documents by setting their status to 'deleted'."""
        document_ids = request.data.get('document_ids', [])
        
        if not document_ids:
            return Response(
                {"detail": "No document IDs provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use the same filtering logic as get_queryset for consistency
        documents = self.get_queryset().filter(id__in=document_ids)
        count = documents.count()
        documents.update(status='deleted')
        
        return Response({"detail": f"Moved {count} documents to trash."})
    
    @action(detail=False, methods=['post'], url_path='bulk/update-status')
    def bulk_update_status(self, request):
        """Update status for multiple documents."""
        document_ids = request.data.get('document_ids', [])
        status_value = request.data.get('status')
        
        if not document_ids:
            return Response(
                {"detail": "No document IDs provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not status_value or status_value not in ['draft', 'published', 'archived', 'deleted']:
            return Response(
                {"detail": "Invalid status value."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        documents = self.get_queryset().filter(
            id__in=document_ids,
            is_latest=True
        )
        
        documents.update(status=status_value)
        
        return Response({"detail": f"Updated status for {documents.count()} documents."})
    
    @action(detail=False, methods=['post'], url_path='bulk/update-category')
    def bulk_update_category(self, request):
        """Update category for multiple documents."""
        document_ids = request.data.get('document_ids', [])
        category_id = request.data.get('category')
        
        if not document_ids:
            return Response(
                {"detail": "No document IDs provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        documents = self.get_queryset().filter(
            id__in=document_ids,
            is_latest=True
        )
        
        documents.update(category_id=category_id)
        
        return Response({"detail": f"Updated category for {documents.count()} documents."})
    
    @action(detail=False, methods=['post'], url_path='bulk/add-tags')
    def bulk_add_tags(self, request):
        """Add tags to multiple documents."""
        document_ids = request.data.get('document_ids', [])
        tags = request.data.get('tags', [])
        
        if not document_ids:
            return Response(
                {"detail": "No document IDs provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not tags:
            return Response(
                {"detail": "No tags provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        documents = self.get_queryset().filter(
            id__in=document_ids,
            is_latest=True
        )
        
        for document in documents:
            current_tags = document.tags or []
            new_tags = list(set(current_tags + tags))  # Remove duplicates
            document.tags = new_tags
            document.save()
        
        return Response({"detail": f"Added tags to {documents.count()} documents."})

