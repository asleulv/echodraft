from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import json

from ..models import DocumentPDFExport
from ..services.content_converter import ContentConverter


@csrf_exempt
@require_http_methods(["GET"])
def shared_pdf_view(request, uuid):
    """Return a shared PDF document."""
    try:
        export = get_object_or_404(DocumentPDFExport, uuid=uuid)
        
        # Check if export has expired
        if export.expires_at and export.expires_at < timezone.now():
            raise Http404("This document has expired.")
        
        # Check PIN protection
        if export.pin_protected:
            provided_pin = request.GET.get('pin')
            if not provided_pin or provided_pin != export.pin_code:
                return HttpResponse("PIN required", status=401)
        
        document = export.document
        html_content = ContentConverter.slate_to_html(document.content)
        
        # Return PDF response (you'll need to implement PDF generation)
        # This is a simplified version - you'd use a library like weasyprint
        return HttpResponse(
            html_content, 
            content_type='application/pdf',
            headers={'Content-Disposition': f'attachment; filename="{document.title}.pdf"'}
        )
        
    except DocumentPDFExport.DoesNotExist:
        raise Http404("Document not found.")


@csrf_exempt 
@require_http_methods(["GET"])
def shared_html_view(request, uuid):
    """Return a shared HTML document."""
    try:
        export = get_object_or_404(DocumentPDFExport, uuid=uuid)
        
        # Check if export has expired
        if export.expires_at and export.expires_at < timezone.now():
            raise Http404("This document has expired.")
        
        # Check PIN protection
        if export.pin_protected:
            provided_pin = request.GET.get('pin')
            if not provided_pin or provided_pin != export.pin_code:
                return render(request, 'documents/pin_required.html', {
                    'uuid': uuid,
                    'document_title': export.document.title
                })
        
        document = export.document
        html_content = ContentConverter.slate_to_html(document.content)
        
        return render(request, 'documents/shared_document.html', {
            'document': document,
            'html_content': html_content,
            'export': export
        })
        
    except DocumentPDFExport.DoesNotExist:
        raise Http404("Document not found.")
