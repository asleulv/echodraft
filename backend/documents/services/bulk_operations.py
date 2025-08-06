from django.db import transaction
from django.db.models import Q
from ..models import TextDocument


class BulkOperationService:
    """Service for handling bulk operations on documents."""
    
    @staticmethod
    def bulk_update_category(document_ids, category_id, user):
        """Update category for multiple documents."""
        with transaction.atomic():
            updated_count = TextDocument.objects.filter(
                id__in=document_ids,
                organization=user.organization
            ).update(category_id=category_id)
            
        return updated_count
    
    @staticmethod
    def bulk_update_status(document_ids, status, user):
        """Update status for multiple documents."""
        with transaction.atomic():
            updated_count = TextDocument.objects.filter(
                id__in=document_ids,
                organization=user.organization
            ).update(status=status)
            
        return updated_count
    
    @staticmethod
    def bulk_delete(document_ids, user):
        """Soft delete multiple documents."""
        with transaction.atomic():
            updated_count = TextDocument.objects.filter(
                id__in=document_ids,
                organization=user.organization
            ).update(status='deleted')
            
        return updated_count
    
    @staticmethod
    def bulk_add_tags(document_ids, new_tags, user):
        """Add tags to multiple documents."""
        documents = TextDocument.objects.filter(
            id__in=document_ids,
            organization=user.organization
        )
        
        updated_count = 0
        with transaction.atomic():
            for document in documents:
                existing_tags = document.tags or []
                combined_tags = list(set(existing_tags + new_tags))
                document.tags = combined_tags
                document.save(update_fields=['tags'])
                updated_count += 1
                
        return updated_count
    
    @staticmethod
    def bulk_remove_tags(document_ids, tags_to_remove, user):
        """Remove tags from multiple documents."""
        documents = TextDocument.objects.filter(
            id__in=document_ids,
            organization=user.organization
        )
        
        updated_count = 0
        with transaction.atomic():
            for document in documents:
                if document.tags:
                    remaining_tags = [tag for tag in document.tags if tag not in tags_to_remove]
                    document.tags = remaining_tags
                    document.save(update_fields=['tags'])
                    updated_count += 1
                    
        return updated_count
