from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

from ..models import StyleConstraint, TextDocument
from ..serializers import StyleConstraintSerializer
from accounts.permissions import IsSameOrganization


class StyleConstraintViewSet(viewsets.ModelViewSet):
    """ViewSet for managing style constraints."""
    
    serializer_class = StyleConstraintSerializer
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    
    def get_queryset(self):
        """Return style constraints for user's organization."""
        return StyleConstraint.objects.filter(
            Q(organization=self.request.user.organization) | Q(organization__isnull=True)
        ).filter(is_active=True)
    
    def perform_create(self, serializer):
        """Create a new style constraint."""
        serializer.save(
            created_by=self.request.user,
            organization=self.request.user.organization
        )
    
    @action(detail=True, methods=['post'])
    def apply_to_documents(self, request, pk=None):
        """Apply style constraint to selected documents."""
        constraint = self.get_object()
        document_ids = request.data.get('document_ids', [])
        
        if not document_ids:
            return Response(
                {"detail": "No documents specified."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        documents = TextDocument.objects.filter(
            id__in=document_ids,
            organization=request.user.organization
        )
        
        applied_count = 0
        for document in documents:
            # Apply constraint logic here
            # This would depend on your specific implementation
            applied_count += 1
        
        return Response({
            "detail": f"Style constraint applied to {applied_count} documents."
        })
