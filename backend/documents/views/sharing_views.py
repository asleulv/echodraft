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
@require_http_methods(["GET", "POST"])  # Allow both GET and POST
def shared_html_view(request, uuid):
    """Return a shared HTML document."""
    try:
        export = get_object_or_404(DocumentPDFExport, uuid=uuid)
        
        # Check if export has expired
        if export.expires_at and export.expires_at < timezone.now():
            raise Http404("This document has expired.")
        
        # Check PIN protection
        if export.pin_protected:
            # Check if PIN was already verified in this session
            session_key = f'verified_pin_{uuid}'
            
            if request.method == 'POST':
                # Handle PIN form submission
                provided_pin = request.POST.get('pin')
                if provided_pin == export.pin_code:
                    # PIN is correct - store in session
                    request.session[session_key] = True
                    # Continue to show document below...
                else:
                    # PIN is wrong - show form with error
                    return render(request, 'documents/shared_pin_required.html', {
                        'uuid': uuid,
                        'document_title': export.document.title,
                        'error': 'Invalid PIN code. Please try again.'
                    })
            
            elif not request.session.get(session_key):
                # GET request and PIN not verified - show PIN form
                return render(request, 'documents/shared_pin_required.html', {
                    'uuid': uuid,
                    'document_title': export.document.title
                })
        
        # Show the document (either not PIN protected, or PIN was verified)
        document = export.document
        html_content = ContentConverter.slate_to_html(document.content)
        
        return render(request, 'documents/shared_document.html', {
            'document': document,
            'html_content': html_content,
            'export': export
        })
        
    except DocumentPDFExport.DoesNotExist:
        raise Http404("Document not found.")

