from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings

from ..models import DocumentPDFExport, TextDocument
from ..serializers import DocumentPDFExportSerializer, TextDocumentDetailSerializer
from ..services.content_converter import ContentConverter
from accounts.permissions import IsSameOrganization


class DocumentPDFExportViewSet(viewsets.ModelViewSet):
    """ViewSet for managing PDF exports with proper separation of concerns."""
    
    serializer_class = DocumentPDFExportSerializer
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    
    def get_queryset(self):
        """Return PDF exports for user's organization."""
        return DocumentPDFExport.objects.filter(
            document__organization=self.request.user.organization
        )
    
    def perform_create(self, serializer):
        """Create a new PDF export."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['post'], url_path='create-from-document')
    def create_from_document(self, request):
        """
        Create a PDF export directly from a document ID/slug.
        This is the proper way to handle document exports.
        """
        document_identifier = request.data.get('document_id') or request.data.get('document_slug')
        
        if not document_identifier:
            return Response(
                {"detail": "Either document_id or document_slug is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the document using the same logic as TextDocumentViewSet
        documents_queryset = TextDocument.objects.filter(
            organization=request.user.organization
        ).exclude(status='deleted')
        
        if str(document_identifier).isdigit():
            # ID lookup
            try:
                document = get_object_or_404(documents_queryset, id=int(document_identifier))
            except ValueError:
                return Response(
                    {"detail": "Invalid document ID."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Slug lookup
            documents = documents_queryset.filter(slug=document_identifier)
            if not documents.exists():
                return Response(
                    {"detail": "Document not found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get the latest version by default
            document = documents.filter(is_latest=True).first()
            if not document:
                document = documents.order_by('-version').first()
        
        # Create the PDF export record
        pdf_export = DocumentPDFExport.objects.create(
            document=document,
            created_by=request.user,
            expiration_type=request.data.get('expiration_type', 'never'),
            pin_protected=request.data.get('pin_protected', False)
        )
        
        # Generate the correct backend share URL
        if hasattr(settings, 'get_backend_base_url'):
            base_url = settings.get_backend_base_url(request)
        elif hasattr(settings, 'BACKEND_BASE_URL'):
            base_url = settings.BACKEND_BASE_URL
        else:
            # Fallback to request-based URL generation
            scheme = 'https' if request.is_secure() else 'http'
            host = request.get_host()
            base_url = f"{scheme}://{host}"
        
        # Set the correct share URL pointing to backend
        share_url = f"{base_url}/api/v1/shared-html/{pdf_export.uuid}/"
        pdf_export.share_url = share_url
        pdf_export.save()
        
        # Return the export data immediately
        return Response({
            'export_id': pdf_export.id,
            'document': TextDocumentDetailSerializer(document, context={'request': request}).data,
            'html_content': ContentConverter.slate_to_html(document.content),
            'export_details': DocumentPDFExportSerializer(pdf_export, context={'request': request}).data
        })
    
    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        """Return document data for PDF generation from existing export."""
        export = self.get_object()
        document = export.document
        
        return Response({
            'document': TextDocumentDetailSerializer(document, context={'request': request}).data,
            'html_content': ContentConverter.slate_to_html(document.content)
        })
