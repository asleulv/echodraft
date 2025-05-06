from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.views.decorators.csrf import csrf_exempt
from .views import TextDocumentViewSet, CommentViewSet, format_document_with_ai, DocumentPDFExportViewSet, shared_pdf_view, shared_html_view, StyleConstraintViewSet
from .ai_views import generate_document_with_ai

# Create a router and register our viewsets with it
router = DefaultRouter(trailing_slash=False)
router.register(r'documents', TextDocumentViewSet, basename='document')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'pdf-exports', DocumentPDFExportViewSet, basename='pdf-export')
router.register(r'style-constraints', StyleConstraintViewSet, basename='style-constraint')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    path('format-with-ai/', format_document_with_ai, name='format-with-ai'),
    path('shared-pdf/<uuid:uuid>/', shared_pdf_view, name='shared-pdf'),
    path('shared-html/<uuid:uuid>/', shared_html_view, name='shared-html'),
    # AI document generation endpoint is now defined in the main urls.py file
]
