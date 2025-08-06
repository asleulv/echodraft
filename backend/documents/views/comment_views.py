from rest_framework import viewsets, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from ..models import Comment, TextDocument
from ..serializers import CommentSerializer
from accounts.permissions import IsSameOrganization


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing document comments."""
    
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    
    def get_queryset(self):
        """Return comments for user's organization documents."""
        return Comment.objects.filter(
            document__organization=self.request.user.organization
        ).select_related('user', 'document').prefetch_related('replies')
    
    def perform_create(self, serializer):
        """Create a new comment."""
        document_id = self.request.data.get('document')
        document = get_object_or_404(
            TextDocument.objects.filter(organization=self.request.user.organization),
            id=document_id
        )
        serializer.save(user=self.request.user, document=document)
