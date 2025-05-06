from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.http import Http404, HttpResponse, JsonResponse
from django.utils import timezone
from django.template.loader import render_to_string
import openai
import anthropic
import json
from datetime import timedelta

from .models import TextDocument, Comment, DocumentPDFExport, StyleConstraint
from .serializers import (
    TextDocumentListSerializer,
    TextDocumentDetailSerializer,
    TextDocumentCreateSerializer,
    TextDocumentUpdateSerializer,
    CommentSerializer,
    DocumentPDFExportSerializer,
    StyleConstraintSerializer,
)
from accounts.permissions import IsSameOrganization

class TextDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing TextDocument instances."""
    
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'plain_text', 'tags']
    ordering_fields = ['title', 'created_at', 'updated_at']
    ordering = ['-updated_at']
    lookup_field = 'slug'
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to perform a soft delete."""
        document = self.get_object()
        document.status = 'deleted'
        document.save()
        return Response({"detail": "Document moved to trash."}, status=status.HTTP_200_OK)
    
    def get_object(self):
        """
        Override get_object to handle the case where multiple documents
        have the same slug but different versions.
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get the lookup value (slug)
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        slug = self.kwargs[lookup_url_kwarg]
        
        # Check if we're including non-latest versions
        latest_only = self.request.query_params.get('latest_only', 'true').lower() == 'true'
        
        if latest_only:
            # If latest_only is true, get the latest version with this slug
            obj = get_object_or_404(queryset, slug=slug, is_latest=True)
        else:
            # If latest_only is false, we might have multiple documents with the same slug
            # Get all documents with this slug and order by version (descending)
            matching_docs = queryset.filter(slug=slug).order_by('-version')
            
            if not matching_docs.exists():
                raise Http404("No document found with this slug")
            
            # Get the specific version if provided
            version = self.request.query_params.get('version')
            if version and version.isdigit():
                version_num = int(version)
                version_matches = matching_docs.filter(version=version_num)
                if version_matches.exists():
                    obj = version_matches.first()
                else:
                    raise Http404(f"No document found with version {version}")
            else:
                # Otherwise, get the most recent version
                obj = matching_docs.first()
        
        # Check permissions
        self.check_object_permissions(self.request, obj)
        return obj
    
    def get_queryset(self):
        """Return documents for the current user's organization."""
        user = self.request.user
        
        # Base queryset - documents from user's organization
        queryset = TextDocument.objects.filter(organization=user.organization)
        
        # By default, exclude documents with status 'deleted'
        include_deleted = self.request.query_params.get('include_deleted', 'false').lower() == 'true'
        if not include_deleted:
            queryset = queryset.exclude(status='deleted')
        
        # Filter by category if provided
        category = self.request.query_params.get('category', None)
        if category:
            print(f"Filtering documents by category: {category}, type: {type(category)}")
            if category.lower() == 'null':
                # Filter for documents with no category
                print("Filtering for documents with no category")
                queryset = queryset.filter(category__isnull=True)
            else:
                try:
                    # Try to convert to integer for ForeignKey lookup
                    category_id = int(category)
                    print(f"Converted category to integer: {category_id}")
                    queryset = queryset.filter(category_id=category_id)
                except (ValueError, TypeError):
                    print(f"Failed to convert category to integer: {category}")
                    # If conversion fails, try as-is (though this likely won't work for ForeignKey)
                    queryset = queryset.filter(category=category)
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by tags if provided
        tags = self.request.query_params.get('tags', None)
        if tags:
            tag_list = tags.split(',')
            # Use a more efficient approach with a single query
            # This will find documents that contain ALL the specified tags
            queryset = queryset.filter(tags__contains=tag_list)
        
        # Filter by latest version only by default
        latest_only = self.request.query_params.get('latest_only', 'true').lower() == 'true'
        if latest_only:
            queryset = queryset.filter(is_latest=True)
        
        # Filter by search term if provided
        search = self.request.query_params.get('search', None)
        title_content_search = self.request.query_params.get('title_content_search', None)
        
        print(f"Search parameters - search: {search}, title_content_search: {title_content_search}")
        
        # Handle standard search parameter (may cause issues with tags on some DB backends)
        if search:
            print(f"Using standard search parameter: {search}")
            try:
                queryset = queryset.filter(
                    Q(title__icontains=search) | 
                    Q(plain_text__icontains=search) |
                    Q(tags__contains=[search])
                )
            except Exception as e:
                print(f"Error with standard search: {e}")
                # Fallback to title and content only if tags search fails
                queryset = queryset.filter(
                    Q(title__icontains=search) | 
                    Q(plain_text__icontains=search)
                )
        
        # Handle custom search parameter for title and content only (more compatible)
        elif title_content_search:
            print(f"Using custom title_content_search parameter: {title_content_search}")
            
            # Check if plain_text field is populated in any documents
            has_plain_text = TextDocument.objects.filter(plain_text__isnull=False).exists()
            print(f"Database has documents with plain_text: {has_plain_text}")
            
            # Sample a document to check plain_text content
            sample_doc = TextDocument.objects.first()
            if sample_doc:
                print(f"Sample document title: {sample_doc.title}")
                print(f"Sample document plain_text: {sample_doc.plain_text[:100] if sample_doc.plain_text else 'None'}")
            
            # Apply the filter
            queryset = queryset.filter(
                Q(title__icontains=title_content_search) | 
                Q(plain_text__icontains=title_content_search)
            )
            
            # Check the results
            result_count = queryset.count()
            print(f"Query after title_content_search filter returned {result_count} results")
            
            # If no results, try just title search to see if that works
            if result_count == 0:
                title_only_count = TextDocument.objects.filter(
                    organization=user.organization,
                    title__icontains=title_content_search
                ).count()
                print(f"Title-only search returned {title_only_count} results")
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer class based on the action."""
        if self.action == 'list':
            return TextDocumentListSerializer
        elif self.action == 'create':
            return TextDocumentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TextDocumentUpdateSerializer
        return TextDocumentDetailSerializer
    
    

    @action(detail=True, methods=['get'])
    def versions(self, request, slug=None):
        """Return all versions of a document."""
        document = self.get_object()
        
        # Get the root document (version 1)
        root = document
        while root.parent:
            root = root.parent
        
        # Get all versions by finding documents with the same root
        # This approach works regardless of how many versions exist
        all_versions = []
        
        # Add the root document
        all_versions.append(root.id)
        
        # Find all documents that have this root as their ancestor
        # by recursively traversing the version tree
        def find_child_versions(parent_id):
            children = TextDocument.objects.filter(parent_id=parent_id)
            for child in children:
                all_versions.append(child.id)
                find_child_versions(child.id)
        
        # Start the recursive search from the root
        find_child_versions(root.id)
        
        # Get all versions
        versions = TextDocument.objects.filter(id__in=all_versions).order_by('version')
        
        serializer = TextDocumentListSerializer(versions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, slug=None):
        """Add a comment to the document."""
        document = self.get_object()
        
        # Create comment data
        comment_data = {
            'document': document.id,
            'user': request.user.id,
            'text': request.data.get('text', ''),
            'parent': request.data.get('parent', None)
        }
        
        serializer = CommentSerializer(data=comment_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def create_version(self, request, slug=None):
        """Create a new version of the document."""
        document = self.get_object()
        
        # Check if document is the latest version
        if not document.is_latest:
            return Response(
                {"detail": "Cannot create a new version from an old version."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new version
        new_version = document.create_new_version()
        
        # Update with request data if provided
        if request.data:
            serializer = TextDocumentUpdateSerializer(new_version, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(TextDocumentDetailSerializer(new_version).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(TextDocumentDetailSerializer(new_version).data)
    
    @action(detail=True, methods=['get'])
    def export_pdf(self, request, slug=None):
        """Return document data for PDF generation on the client side."""
        document = self.get_object()
        
        # Return document data for client-side PDF generation
        return Response({
            'document': TextDocumentDetailSerializer(document, context={'request': request}).data,
            'html_content': self._slate_to_html(document.content)
        })
    
    @action(detail=True, methods=['post'])
    def create_pdf_share(self, request, slug=None):
        """Create a shareable PDF link."""
        document = self.get_object()
        
        # Get expiration type from request or use default (1 week)
        expiration_type = request.data.get('expiration_type', '1w')
        if expiration_type not in ['1h', '24h', '1w', '1m', 'never']:
            expiration_type = '1w'
        
        # Check if PIN protection is requested
        pin_protected = request.data.get('pin_protected', False)
        
        # Create PDF export record
        pdf_export = DocumentPDFExport.objects.create(
            document=document,
            created_by=request.user,
            expiration_type=expiration_type,
            pin_protected=pin_protected
        )
        
        # Return the export details
        serializer = DocumentPDFExportSerializer(pdf_export, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    def _slate_to_html(self, content):
        """Convert content to HTML."""
        if not content:
            return ""
        
        # Try to determine if content is Markdown or Slate.js JSON
        # This helps with the transition period
        if isinstance(content, (dict, list)) or (isinstance(content, str) and (content.startswith('[') or content.startswith('{'))):
            try:
                # If it's a string that looks like JSON, try to parse it
                if isinstance(content, str) and (content.startswith('[') or content.startswith('{')):
                    import json
                    parsed_content = json.loads(content)
                else:
                    parsed_content = content
                
                # Use the old method for Slate.js content
                html = []
                
                def process_node(node):
                    if isinstance(node, dict):
                        # If it's a leaf node with text
                        if 'text' in node:
                            text = node['text']
                            # Apply text formatting
                            if node.get('bold'):
                                text = f"<strong>{text}</strong>"
                            if node.get('italic'):
                                text = f"<em>{text}</em>"
                            if node.get('underline'):
                                text = f"<u>{text}</u>"
                            return text
                        
                        # If it's an element with children
                        if 'children' in node:
                            children_html = ''.join(process_node(child) for child in node['children'])
                            node_type = node.get('type', 'paragraph')
                            
                            # Apply element formatting based on type
                            if node_type == 'paragraph':
                                return f"<p>{children_html}</p>"
                            elif node_type == 'heading-one':
                                return f"<h1>{children_html}</h1>"
                            elif node_type == 'heading-two':
                                return f"<h2>{children_html}</h2>"
                            elif node_type == 'block-quote':
                                return f"<blockquote>{children_html}</blockquote>"
                            elif node_type == 'bulleted-list':
                                return f"<ul>{children_html}</ul>"
                            elif node_type == 'numbered-list':
                                return f"<ol>{children_html}</ol>"
                            elif node_type == 'list-item':
                                return f"<li>{children_html}</li>"
                            else:
                                return children_html
                        
                        return ''
                    
                    # If it's a list of nodes
                    elif isinstance(node, list):
                        return ''.join(process_node(child) for child in node)
                    
                    return ''
                
                # Process the content
                if isinstance(parsed_content, list):
                    for node in parsed_content:
                        html.append(process_node(node))
                elif isinstance(parsed_content, dict):
                    html.append(process_node(parsed_content))
                
                return ''.join(html)
            except:
                # If parsing fails, treat as Markdown
                pass
        
        # For Markdown content, use a Markdown to HTML converter
        try:
            import markdown
            # Use the Python-Markdown library to convert Markdown to HTML
            # Enable common extensions for tables, code highlighting, etc.
            html = markdown.markdown(
                content,
                extensions=[
                    'tables',
                    'fenced_code',
                    'codehilite',
                    'nl2br',  # Convert newlines to <br>
                    'sane_lists',  # Better list handling
                ]
            )
            return html
        except ImportError:
            # If markdown library is not available, use a simple regex-based approach
            import re
            
            # Convert headers
            html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', content, flags=re.MULTILINE)
            html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
            html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
            
            # Convert bold and italic
            html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
            html = re.sub(r'__(.+?)__', r'<strong>\1</strong>', html)
            html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
            html = re.sub(r'_(.+?)_', r'<em>\1</em>', html)
            
            # Convert links
            html = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2">\1</a>', html)
            
            # Convert code blocks
            html = re.sub(r'```(.+?)```', r'<pre><code>\1</code></pre>', html, flags=re.DOTALL)
            
            # Convert inline code
            html = re.sub(r'`(.+?)`', r'<code>\1</code>', html)
            
            # Convert blockquotes
            html = re.sub(r'^> (.+)$', r'<blockquote>\1</blockquote>', html, flags=re.MULTILINE)
            
            # Convert unordered lists
            list_items = re.findall(r'^[\*\-+]\s+(.+)$', html, flags=re.MULTILINE)
            if list_items:
                ul_html = '<ul>'
                for item in list_items:
                    ul_html += f'<li>{item}</li>'
                ul_html += '</ul>'
                html = re.sub(r'^[\*\-+]\s+(.+)$', '', html, flags=re.MULTILINE)
                html += ul_html
            
            # Convert ordered lists
            list_items = re.findall(r'^\d+\.\s+(.+)$', html, flags=re.MULTILINE)
            if list_items:
                ol_html = '<ol>'
                for item in list_items:
                    ol_html += f'<li>{item}</li>'
                ol_html += '</ol>'
                html = re.sub(r'^\d+\.\s+(.+)$', '', html, flags=re.MULTILINE)
                html += ol_html
            
            # Convert paragraphs (any remaining lines)
            paragraphs = [p for p in html.split('\n\n') if p.strip()]
            html = ''.join([f'<p>{p}</p>' for p in paragraphs])
            
            return html
    
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
        
        # Get documents from the user's organization
        documents = TextDocument.objects.filter(
            id__in=document_ids,
            organization=request.user.organization,
            is_latest=True
        )
        
        # Update category for all documents
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
        
        # Get documents from the user's organization
        documents = TextDocument.objects.filter(
            id__in=document_ids,
            organization=request.user.organization,
            is_latest=True
        )
        
        # Add tags to each document
        for document in documents:
            current_tags = document.tags or []
            new_tags = list(set(current_tags + tags))  # Remove duplicates
            document.tags = new_tags
            document.save()
        
        return Response({"detail": f"Added tags to {documents.count()} documents."})
    
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
        
        if not status_value or status_value not in ['draft', 'published', 'archived']:
            return Response(
                {"detail": "Invalid status value."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get documents from the user's organization
        documents = TextDocument.objects.filter(
            id__in=document_ids,
            organization=request.user.organization,
            is_latest=True
        )
        
        # Update status for all documents
        documents.update(status=status_value)
        
        return Response({"detail": f"Updated status for {documents.count()} documents."})
    
    @action(detail=False, methods=['post'], url_path='bulk/delete')
    def bulk_delete(self, request):
        """Soft delete multiple documents by setting their status to 'deleted'."""
        document_ids = request.data.get('document_ids', [])
        
        if not document_ids:
            return Response(
                {"detail": "No document IDs provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get documents from the user's organization
        documents = TextDocument.objects.filter(
            id__in=document_ids,
            organization=request.user.organization
        )
        
        # Count before update
        count = documents.count()
        
        # Soft delete documents by updating their status
        documents.update(status='deleted')
        
        return Response({"detail": f"Moved {count} documents to trash."})
    
    @action(detail=False, methods=['post'], url_path='bulk/delete-permanently')
    def bulk_delete_permanently(self, request):
        """Permanently delete multiple documents."""
        document_ids = request.data.get('document_ids', [])
        
        if not document_ids:
            return Response(
                {"detail": "No document IDs provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get documents from the user's organization
        documents = TextDocument.objects.filter(
            id__in=document_ids,
            organization=request.user.organization
        )
        
        # Count before deletion
        count = documents.count()
        
        # Permanently delete documents
        documents.delete()
        
        return Response({"detail": f"Permanently deleted {count} documents."})


class DocumentPDFExportViewSet(viewsets.ModelViewSet):
    """ViewSet for managing PDF exports."""
    
    serializer_class = DocumentPDFExportSerializer
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    
    def get_queryset(self):
        """Return PDF exports for the current user's organization."""
        user = self.request.user
        return DocumentPDFExport.objects.filter(
            document__organization=user.organization
        )
    
    def perform_create(self, serializer):
        """Create a new PDF export."""
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to properly handle PDF export deletion."""
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response({"detail": "PDF export deleted successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Failed to delete PDF export: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])  # Allow unauthenticated access
def shared_pdf_view(request, uuid):
    """View for accessing a shared PDF by UUID."""
    try:
        # Get the PDF export by UUID
        pdf_export = get_object_or_404(DocumentPDFExport, uuid=uuid)
        
        # Check if the export has expired
        if pdf_export.is_expired:
            return Response(
                {"detail": "This shared PDF link has expired."},
                status=status.HTTP_410_GONE
            )
        
        # Handle PIN protection
        if pdf_export.pin_protected:
            # For GET requests, just return that PIN is required
            if request.method == 'GET':
                return Response({
                    'pin_protected': True,
                    'document_title': pdf_export.document.title,
                    'created_by_name': f"{pdf_export.created_by.first_name} {pdf_export.created_by.last_name}".strip() or pdf_export.created_by.username,
                })
            
            # For POST requests, verify the PIN
            pin_code = request.data.get('pin_code')
            if not pin_code or pin_code != pdf_export.pin_code:
                return Response(
                    {"detail": "Invalid PIN code."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get the document
        document = pdf_export.document
        
        # Return document data for client-side PDF generation
        return Response({
            'document': TextDocumentDetailSerializer(document, context={'request': request}).data,
            'html_content': TextDocumentViewSet._slate_to_html(None, document.content),
            'is_shared': True,
            'pin_protected': pdf_export.pin_protected,
            'expiration_type': pdf_export.expiration_type,
            'expires_at': pdf_export.expires_at
        })
    except Exception as e:
        return Response(
            {"detail": f"Error accessing shared PDF: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])  # Allow unauthenticated access
def shared_html_view(request, uuid):
    """View for accessing a shared HTML document by UUID."""
    try:
        # Get the PDF export by UUID (we're still using the same model for now)
        pdf_export = get_object_or_404(DocumentPDFExport, uuid=uuid)
        
        # Check if the export has expired
        if pdf_export.is_expired:
            return Response(
                {"detail": "This shared document link has expired."},
                status=status.HTTP_410_GONE
            )
        
        # Handle PIN protection
        if pdf_export.pin_protected:
            # For GET requests, just return that PIN is required
            if request.method == 'GET':
                return Response({
                    'pin_protected': True,
                    'document_title': pdf_export.document.title,
                    'created_by_name': f"{pdf_export.created_by.first_name} {pdf_export.created_by.last_name}".strip() or pdf_export.created_by.username,
                })
            
            # For POST requests, verify the PIN
            pin_code = request.data.get('pin_code')
            if not pin_code or pin_code != pdf_export.pin_code:
                return Response(
                    {"detail": "Invalid PIN code."},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get the document
        document = pdf_export.document
        
        # Return document data for client-side HTML generation
        return Response({
            'document': TextDocumentDetailSerializer(document, context={'request': request}).data,
            'html_content': TextDocumentViewSet._slate_to_html(None, document.content),
            'is_shared': True,
            'pin_protected': pdf_export.pin_protected,
            'expiration_type': pdf_export.expiration_type,
            'expires_at': pdf_export.expires_at
        })
    except Exception as e:
        return Response(
            {"detail": f"Error accessing shared document: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def format_document_with_ai(request):
    """Format document content using AI."""
    content = request.data.get('content')
    if not content:
        return Response({'error': 'No content provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    service = user.preferred_ai_service
    
    print(f"Using AI service: {service}")
    print(f"User has OpenAI API key: {bool(user.openai_api_key)}")
    print(f"User has Anthropic API key: {bool(user.anthropic_api_key)}")
    
    # Parse the content to understand the current structure
    try:
        # Handle the case where content might be a string representation of JSON
        if isinstance(content, str):
            try:
                parsed_content = json.loads(content)
                print(f"Successfully parsed content as JSON with {len(parsed_content)} nodes")
            except json.JSONDecodeError:
                print("Content is not valid JSON, treating as plain text")
                parsed_content = None
        else:
            # If content is already a dict/list, use it directly
            parsed_content = content
            print(f"Content is already a Python object with type: {type(content)}")
    except Exception as e:
        print(f"Error parsing content: {str(e)}")
        parsed_content = None
    
    # Create a detailed system prompt that explains Slate.js formatting
    slate_system_prompt = """
    You are a document formatting assistant for a rich text editor that uses Slate.js.
    
    Your task is to improve the formatting and structure of the document while preserving its content.
    
    IMPORTANT: Your response must be ONLY valid JSON that follows the Slate.js structure exactly. Do not include any explanations, markdown formatting, or code blocks. Just return the raw JSON array.
    
    In Slate.js, content is structured as an array of nodes, where each node has a type and children.
    
    Here are the node types you should use:
    1. "paragraph" - Regular paragraph text
    2. "heading-one" - Main heading (H1)
    3. "heading-two" - Subheading (H2)
    4. "block-quote" - Quoted text
    5. "bulleted-list" - Container for bulleted list items
    6. "numbered-list" - Container for numbered list items
    7. "list-item" - Individual list item (must be inside a list container)
    
    For text formatting, you can use these marks:
    - "bold": true - For bold text
    - "italic": true - For italic text
    - "underline": true - For underlined text
    
    IMPORTANT RULES:
    1. DO NOT use Markdown syntax like # for headings or * for lists
    2. Make sure all JSON strings are properly escaped with double quotes
    3. Ensure all JSON objects have matching braces and commas
    4. Your entire response must be a valid JSON array
    5. Do not include any text before or after the JSON array
    
    Example of properly formatted Slate.js content:
    
    [
      {
        "type": "heading-one",
        "children": [{"text": "Main Heading"}]
      },
      {
        "type": "paragraph",
        "children": [{"text": "This is a paragraph with "}, {"text": "bold", "bold": true}, {"text": " and "}, {"text": "italic", "italic": true}, {"text": " text."}]
      },
      {
        "type": "bulleted-list",
        "children": [
          {
            "type": "list-item",
            "children": [{"text": "First bullet point"}]
          },
          {
            "type": "list-item",
            "children": [{"text": "Second bullet point"}]
          }
        ]
      }
    ]
    """
    
    if service == 'openai' and user.openai_api_key:
        try:
            # Pin to older version of OpenAI API
            # Install with: pip install openai==0.28
            print("Setting OpenAI API key")
            openai.api_key = user.openai_api_key
            
            # Use the older API style
            print("Calling OpenAI API")
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",  # Use a more widely available model
                messages=[
                    {"role": "system", "content": slate_system_prompt},
                    {"role": "user", "content": content}
                ]
            )
            print("OpenAI API response received")
            formatted_content = response.choices[0].message.content
            
            # Try to parse the response to ensure it's valid JSON
            try:
                # First, try to parse as-is
                parsed_json = json.loads(formatted_content)
                print("Response is valid JSON")
                
                # Validate that it's an array (Slate.js document structure)
                if not isinstance(parsed_json, list):
                    print("JSON is not an array, wrapping it")
                    parsed_json = [parsed_json]
                
                # Re-serialize to ensure clean JSON
                formatted_content = json.dumps(parsed_json)
            except json.JSONDecodeError as e:
                print(f"Response is not valid JSON: {e}")
                
                # Try to extract JSON from code blocks
                if "```json" in formatted_content:
                    print("Extracting JSON from code block")
                    try:
                        json_text = formatted_content.split("```json")[1].split("```")[0].strip()
                        parsed_json = json.loads(json_text)
                        if not isinstance(parsed_json, list):
                            parsed_json = [parsed_json]
                        formatted_content = json.dumps(parsed_json)
                        print("Successfully extracted and validated JSON from code block")
                    except (json.JSONDecodeError, IndexError) as extract_error:
                        print(f"Failed to extract valid JSON from code block: {extract_error}")
                        # Fall back to a simple paragraph structure
                        formatted_content = json.dumps([
                            {
                                "type": "paragraph",
                                "children": [{"text": "The AI formatting failed. Please try again or format manually."}]
                            }
                        ])
                elif "```" in formatted_content:
                    print("Extracting from generic code block")
                    try:
                        code_text = formatted_content.split("```")[1].split("```")[0].strip()
                        parsed_json = json.loads(code_text)
                        if not isinstance(parsed_json, list):
                            parsed_json = [parsed_json]
                        formatted_content = json.dumps(parsed_json)
                        print("Successfully extracted and validated JSON from generic code block")
                    except (json.JSONDecodeError, IndexError) as extract_error:
                        print(f"Failed to extract valid JSON from generic code block: {extract_error}")
                        # Fall back to a simple paragraph structure
                        formatted_content = json.dumps([
                            {
                                "type": "paragraph",
                                "children": [{"text": "The AI formatting failed. Please try again or format manually."}]
                            }
                        ])
                else:
                    print("No code blocks found, using fallback structure")
                    # If all else fails, create a simple paragraph structure with the original content
                    formatted_content = json.dumps([
                        {
                            "type": "paragraph",
                            "children": [{"text": "The AI formatting failed. Please try again or format manually."}]
                        }
                    ])
            
            return Response({'formatted_content': formatted_content})
        except Exception as e:
            print(f"OpenAI API error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif service == 'anthropic' and user.anthropic_api_key:
        try:
            print("Setting up Anthropic client")
            client = anthropic.Anthropic(api_key=user.anthropic_api_key)
            
            print("Calling Anthropic API")
            response = client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=4000,
                system=slate_system_prompt,
                messages=[
                    {"role": "user", "content": content}
                ]
            )
            print("Anthropic API response received")
            formatted_content = response.content[0].text
            
            # Try to parse the response to ensure it's valid JSON
            try:
                # First, try to parse as-is
                parsed_json = json.loads(formatted_content)
                print("Response is valid JSON")
                
                # Validate that it's an array (Slate.js document structure)
                if not isinstance(parsed_json, list):
                    print("JSON is not an array, wrapping it")
                    parsed_json = [parsed_json]
                
                # Re-serialize to ensure clean JSON
                formatted_content = json.dumps(parsed_json)
            except json.JSONDecodeError as e:
                print(f"Response is not valid JSON: {e}")
                
                # Try to extract JSON from code blocks
                if "```json" in formatted_content:
                    print("Extracting JSON from code block")
                    try:
                        json_text = formatted_content.split("```json")[1].split("```")[0].strip()
                        parsed_json = json.loads(json_text)
                        if not isinstance(parsed_json, list):
                            parsed_json = [parsed_json]
                        formatted_content = json.dumps(parsed_json)
                        print("Successfully extracted and validated JSON from code block")
                    except (json.JSONDecodeError, IndexError) as extract_error:
                        print(f"Failed to extract valid JSON from code block: {extract_error}")
                        # Fall back to a simple paragraph structure
                        formatted_content = json.dumps([
                            {
                                "type": "paragraph",
                                "children": [{"text": "The AI formatting failed. Please try again or format manually."}]
                            }
                        ])
                elif "```" in formatted_content:
                    print("Extracting from generic code block")
                    try:
                        code_text = formatted_content.split("```")[1].split("```")[0].strip()
                        parsed_json = json.loads(code_text)
                        if not isinstance(parsed_json, list):
                            parsed_json = [parsed_json]
                        formatted_content = json.dumps(parsed_json)
                        print("Successfully extracted and validated JSON from generic code block")
                    except (json.JSONDecodeError, IndexError) as extract_error:
                        print(f"Failed to extract valid JSON from generic code block: {extract_error}")
                        # Fall back to a simple paragraph structure
                        formatted_content = json.dumps([
                            {
                                "type": "paragraph",
                                "children": [{"text": "The AI formatting failed. Please try again or format manually."}]
                            }
                        ])
                else:
                    print("No code blocks found, using fallback structure")
                    # If all else fails, create a simple paragraph structure with the original content
                    formatted_content = json.dumps([
                        {
                            "type": "paragraph",
                            "children": [{"text": "The AI formatting failed. Please try again or format manually."}]
                        }
                    ])
            
            return Response({'formatted_content': formatted_content})
        except Exception as e:
            print(f"Anthropic API error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    else:
        return Response({'error': 'No API key configured for the selected AI service'}, status=status.HTTP_400_BAD_REQUEST)


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing Comment instances."""
    
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    
    def get_queryset(self):
        """Return comments for the current user's organization."""
        user = self.request.user
        return Comment.objects.filter(document__organization=user.organization)
    
    def perform_create(self, serializer):
        """Create a new comment."""
        serializer.save(user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        """Update a comment."""
        comment = self.get_object()
        
        # Only the comment author can update it
        if comment.user != request.user:
            return Response(
                {"detail": "You do not have permission to edit this comment."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a comment."""
        comment = self.get_object()
        
        # Only the comment author or an admin can delete it
        if comment.user != request.user and not request.user.is_organization_admin:
            return Response(
                {"detail": "You do not have permission to delete this comment."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)


class StyleConstraintViewSet(viewsets.ModelViewSet):
    """ViewSet for viewing and editing StyleConstraint instances."""
    
    serializer_class = StyleConstraintSerializer
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    
    def get_queryset(self):
        """Return style constraints for the current user's organization."""
        user = self.request.user
        
        # Get organization-specific and global style constraints
        return StyleConstraint.objects.filter(
            Q(organization=user.organization) | Q(organization__isnull=True),
            is_active=True
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create a new style constraint."""
        serializer.save(created_by=self.request.user, organization=self.request.user.organization)
    
    @action(detail=True, methods=['get'])
    def reference_documents(self, request, pk=None):
        """Return the reference documents for a style constraint."""
        style_constraint = self.get_object()
        
        # Get the reference documents
        reference_docs = style_constraint.reference_documents.all()
        
        # Serialize the documents
        serializer = TextDocumentListSerializer(reference_docs, many=True)
        return Response(serializer.data)
