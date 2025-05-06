import json
from django.core.management.base import BaseCommand
from documents.models import TextDocument

class Command(BaseCommand):
    help = 'Populates the plain_text field for all documents'

    def handle(self, *args, **options):
        # Get all documents
        documents = TextDocument.objects.all()
        total = documents.count()
        updated = 0
        empty_content = 0
        already_has_plain_text = 0
        
        self.stdout.write(f"Found {total} documents to process")
        
        # Print some sample documents to see what we're working with
        sample_docs = documents[:3]
        for i, doc in enumerate(sample_docs):
            self.stdout.write(f"Sample document {i+1}:")
            self.stdout.write(f"  ID: {doc.id}")
            self.stdout.write(f"  Title: {doc.title}")
            self.stdout.write(f"  Has content: {bool(doc.content)}")
            self.stdout.write(f"  Has plain_text: {bool(doc.plain_text)}")
            if doc.content:
                self.stdout.write(f"  Content type: {type(doc.content)}")
                if isinstance(doc.content, dict) or isinstance(doc.content, list):
                    self.stdout.write(f"  Content sample: {str(doc.content)[:100]}...")
        
        for doc in documents:
            if not doc.content:
                empty_content += 1
                continue
                
            if doc.plain_text:
                already_has_plain_text += 1
                continue
                
            try:
                # Extract plain text from content
                plain_text = self._extract_plain_text(doc.content)
                
                self.stdout.write(f"Extracted plain text from document {doc.id}: {plain_text[:50]}...")
                
                # Update the document
                doc.plain_text = plain_text
                doc.save(update_fields=['plain_text'])
                
                updated += 1
                
                if updated % 10 == 0:
                    self.stdout.write(f"Updated {updated}/{total} documents")
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error updating document {doc.id}: {e}"))
        
        self.stdout.write(self.style.SUCCESS(f"Successfully updated {updated}/{total} documents"))
        self.stdout.write(f"Documents with empty content: {empty_content}")
        self.stdout.write(f"Documents that already had plain_text: {already_has_plain_text}")
    
    def _extract_plain_text(self, content):
        """
        Extract plain text from Slate.js JSON content.
        This is a more robust version that handles different Slate.js structures.
        """
        if not content:
            return ""
            
        text = []
        
        def extract_text_from_node(node):
            if isinstance(node, dict):
                # If it's a leaf node with text
                if 'text' in node:
                    return node['text']
                
                # If it's an element with children
                if 'children' in node:
                    return ' '.join(extract_text_from_node(child) for child in node['children'])
                
                return ''
            
            # If it's a list of nodes
            elif isinstance(node, list):
                return ' '.join(extract_text_from_node(child) for child in node)
            
            return ''
        
        # Handle both array and object formats
        if isinstance(content, list):
            for node in content:
                text.append(extract_text_from_node(node))
        elif isinstance(content, dict):
            text.append(extract_text_from_node(content))
        
        return ' '.join(text).strip()
