from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify

class Category(models.Model):
    """
    Model for organizing documents into categories.
    """
    name = models.CharField(_("Name"), max_length=255)
    description = models.TextField(_("Description"), blank=True)
    slug = models.SlugField(_("Slug"), max_length=255, blank=True)  # ✅ REMOVED unique=True
    
    # Organization ownership
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='categories',
        verbose_name=_("Organization")
    )
    
    # Hierarchical structure
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        related_name='children',
        verbose_name=_("Parent Category"),
        null=True,
        blank=True
    )
    
    # Metadata
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    
    # Color for UI display
    color = models.CharField(_("Color"), max_length=20, blank=True, help_text=_("Color code (e.g., #FF5733)"))
    
    # Icon for UI display
    icon = models.CharField(_("Icon"), max_length=50, blank=True, help_text=_("Icon name or class"))
    
    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")
        ordering = ['name']
        unique_together = [
            ['organization', 'name'],
            ['organization', 'slug']  # ✅ ADDED: Make slug unique per organization
        ]
        indexes = [
            models.Index(fields=['organization']),
            models.Index(fields=['parent']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Generate slug if not provided
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            
            # ✅ IMPROVED: Handle duplicate slugs within the same organization
            while Category.objects.filter(
                organization=self.organization, 
                slug=slug
            ).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
        super().save(*args, **kwargs)
    
    @property
    def full_path(self):
        """Return the full path of the category (including parent categories)."""
        if self.parent:
            return f"{self.parent.full_path} > {self.name}"
        return self.name
    
    @property
    def document_count(self):
        """Return the number of documents in this category (excluding deleted ones and only counting latest versions)."""
        return self.documents.exclude(status='deleted').filter(is_latest=True).count()
    
    @property
    def all_documents_count(self):
        """Return the number of documents in this category and all subcategories (excluding deleted ones and only counting latest versions)."""
        count = self.documents.exclude(status='deleted').filter(is_latest=True).count()
        for child in self.children.all():
            count += child.all_documents_count
        return count


class Tag(models.Model):
    """
    Model for managing tags.
    """
    name = models.CharField(_("Name"), max_length=100)
    slug = models.SlugField(_("Slug"), max_length=100, blank=True)
    
    # Organization ownership
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='tags',
        verbose_name=_("Organization")
    )
    
    # Metadata
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    
    # Color for UI display
    color = models.CharField(_("Color"), max_length=20, blank=True, help_text=_("Color code (e.g., #FF5733)"))
    
    class Meta:
        verbose_name = _("Tag")
        verbose_name_plural = _("Tags")
        ordering = ['name']
        unique_together = [['organization', 'name']]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def document_count(self):
        """Return the number of documents with this tag (excluding deleted ones and only counting latest versions)."""
        from documents.models import TextDocument
        return TextDocument.objects.filter(
            organization=self.organization, 
            tags__contains=[self.name],
            is_latest=True
        ).exclude(status='deleted').count()
