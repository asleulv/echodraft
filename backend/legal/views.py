from rest_framework import viewsets, mixins, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import LegalDocument
from .serializers import LegalDocumentSerializer

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_legal_document(request, doc_type):
    """
    Get the latest version of a legal document by type.
    """
    if doc_type not in dict(LegalDocument.TYPE_CHOICES).keys():
        return Response(
            {"detail": f"Invalid document type: {doc_type}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get the latest version of the document
        document = LegalDocument.objects.filter(type=doc_type).order_by('-effective_date', '-version').first()
        
        if not document:
            return Response(
                {"detail": f"No {dict(LegalDocument.TYPE_CHOICES)[doc_type]} document found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = LegalDocumentSerializer(document)
        return Response(serializer.data)
    
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class LegalDocumentViewSet(mixins.ListModelMixin,
                          mixins.RetrieveModelMixin,
                          viewsets.GenericViewSet):
    """
    API endpoint that allows legal documents to be viewed.
    """
    queryset = LegalDocument.objects.all().order_by('-effective_date', '-version')
    serializer_class = LegalDocumentSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by document type if provided
        doc_type = self.request.query_params.get('type', None)
        if doc_type is not None:
            queryset = queryset.filter(type=doc_type)
            
        # Get only the latest version of each document type
        if self.request.query_params.get('latest', 'false').lower() == 'true':
            # This is a simplified approach - for a more robust solution,
            # you might want to use a subquery or window function
            latest_docs = []
            seen_types = set()
            
            for doc in queryset:
                if doc.type not in seen_types:
                    latest_docs.append(doc.id)
                    seen_types.add(doc.type)
            
            queryset = queryset.filter(id__in=latest_docs)
            
        return queryset
