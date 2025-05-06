from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.utils.text import slugify
import uuid
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

class AIModelSettings(models.Model):
    """Settings for AI model parameters"""
    model_name = models.CharField(_("Model Name"), max_length=50, unique=True, 
                                 help_text=_("Name of the AI model (e.g., gpt-3.5-turbo)"))
    max_tokens = models.IntegerField(
        _("Max Tokens"),
        help_text=_("Maximum tokens the model can generate"))
    temperature = models.FloatField(
        _("Generation Temperature"),
        default=0.7,
        help_text=_("Controls randomness for document generation: 0.0 is deterministic, 1.0+ is very creative"))
    analysis_temperature = models.FloatField(
        _("Analysis Temperature"),
        default=0.7,
        help_text=_("Controls randomness for style analysis: 0.0 is deterministic, 1.0+ is very creative"))
    is_active = models.BooleanField(_("Is Active"), default=True)
    is_default = models.BooleanField(_("Is Default"), default=False,
                                    help_text=_("If checked, this model will be used as the default"))
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    
    class Meta:
        verbose_name = _("AI Model Setting")
        verbose_name_plural = _("AI Model Settings")
    
    def __str__(self):
        return f"{self.model_name} (Max tokens: {self.max_tokens}, Temp: {self.temperature})"
    
    def save(self, *args, **kwargs):
        # If this model is being set as default, unset any other defaults
        if self.is_default:
            AIModelSettings.objects.filter(is_default=True).update(is_default=False)
        
        # If no default exists and this is active, make it default
        elif not self.pk and self.is_active and not AIModelSettings.objects.filter(is_default=True).exists():
            self.is_default = True
            
        super().save(*args, **kwargs)


class DocumentLengthSettings(models.Model):
    """Settings for document length parameters"""
    length_name = models.CharField(_("Length Name"), max_length=20, unique=True,
                                  help_text=_("Name of length setting (e.g., short, medium)"))
    description = models.CharField(_("Description"), max_length=100,
                                  help_text=_("Human-readable description (e.g., '500-750 words')"))
    target_tokens = models.IntegerField(
        _("Target Tokens"),
        help_text=_("Target token count for this length"))
    organization = models.ForeignKey('accounts.Organization', 
                                    on_delete=models.CASCADE, 
                                    null=True, blank=True,
                                    related_name='document_length_settings',
                                    verbose_name=_("Organization"),
                                    help_text=_("If set, applies only to this organization"))
    is_active = models.BooleanField(_("Is Active"), default=True)
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    
    class Meta:
        verbose_name = _("Document Length Setting")
        verbose_name_plural = _("Document Length Settings")
        unique_together = [['length_name', 'organization']]
    
    def __str__(self):
        org_name = self.organization.name if self.organization else _("Global")
        return f"{self.length_name} ({self.description}) - {org_name}"

class TextDocument(models.Model):
    """
    Model for storing text documents.
    """
    title = models.CharField(_("Title"), max_length=255)
    content = models.TextField(_("Content"), default="", help_text=_("Markdown content"))
    plain_text = models.TextField(_("Plain Text"), blank=True, help_text=_("Plain text version for search"))
    
    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_documents',
        verbose_name=_("Created By")
    )
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name=_("Organization")
    )
    category = models.ForeignKey(
        'categories.Category',
        on_delete=models.SET_NULL,
        related_name='documents',
        verbose_name=_("Category"),
        null=True,
        blank=True
    )
    tags = models.JSONField(_("Tags"), default=list, blank=True)
    
    # Version control
    version = models.PositiveIntegerField(_("Version"), default=1)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        related_name='versions',
        verbose_name=_("Parent Document"),
        null=True,
        blank=True,
        help_text=_("Previous version of this document")
    )
    is_latest = models.BooleanField(_("Is Latest Version"), default=True)
    
    # Timestamps
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    
    # Status
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('published', _('Published')),
        ('archived', _('Archived')),
        ('deleted', _('Deleted')),
    ]
    status = models.CharField(_("Status"), max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Slug for URLs
    slug = models.SlugField(_("Slug"), max_length=255, blank=True)
    
    class Meta:
        verbose_name = _("Text Document")
        verbose_name_plural = _("Text Documents")
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['category']),
            models.Index(fields=['created_by']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        # Generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.title)
            
            # Check for duplicates and make slug unique if needed
            original_slug = self.slug
            counter = 1
            while TextDocument.objects.filter(
                organization=self.organization, 
                slug=self.slug
            ).exclude(pk=self.pk).exists():
                # Add a random suffix to make the slug unique
                import random
                import string
                random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
                self.slug = f"{original_slug}-{random_suffix}"
                counter += 1
                if counter > 10:  # Safety check to prevent infinite loops
                    break
        
        # Extract plain text from content for search
        if self.content:
            self.plain_text = self._extract_plain_text(self.content)
        
        super().save(*args, **kwargs)
    
    def _extract_plain_text(self, content):
        """
        Extract plain text from content.
        Handles Markdown, HTML, and Slate.js JSON formats.
        """
        if not content:
            return ""
        
        # Check if content looks like HTML (starts with an HTML tag)
        import re
        if re.search(r'^\s*<[a-zA-Z]+[^>]*>', content):
            # Process HTML content
            # Remove all HTML tags but keep their content
            plain_text = re.sub(r'<[^>]*>', ' ', content)
            # Replace multiple spaces with a single space
            plain_text = re.sub(r'\s+', ' ', plain_text)
            return plain_text.strip()
            
        # Try to handle the case where content might still be in Slate.js JSON format
        # during the transition period
        if isinstance(content, (dict, list)) or (isinstance(content, str) and content.startswith('[')):
            try:
                # If it's a string that looks like JSON, try to parse it
                if isinstance(content, str) and (content.startswith('[') or content.startswith('{')):
                    import json
                    parsed_content = json.loads(content)
                else:
                    parsed_content = content
                
                # Use the old method for Slate.js content
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
                if isinstance(parsed_content, list):
                    for node in parsed_content:
                        text.append(extract_text_from_node(node))
                elif isinstance(parsed_content, dict):
                    text.append(extract_text_from_node(parsed_content))
                
                return ' '.join(text).strip()
            except:
                # If parsing fails, treat as Markdown
                pass
        
        # Process Markdown content
        # Remove common Markdown syntax
        plain_text = content
        
        # Remove headers (# Header)
        plain_text = re.sub(r'^#+\s+', '', plain_text, flags=re.MULTILINE)
        
        # Remove bold and italic markers
        plain_text = plain_text.replace('**', '').replace('__', '').replace('*', '').replace('_', '')
        
        # Remove link syntax but keep the text
        plain_text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', plain_text)
        
        # Remove code blocks but keep the content
        plain_text = re.sub(r'```[a-z]*\n([\s\S]*?)\n```', r'\1', plain_text)
        
        # Remove inline code but keep the content
        plain_text = re.sub(r'`([^`]+)`', r'\1', plain_text)
        
        # Remove blockquotes
        plain_text = re.sub(r'^>\s+', '', plain_text, flags=re.MULTILINE)
        
        # Remove list markers
        plain_text = re.sub(r'^[\*\-+]\s+', '', plain_text, flags=re.MULTILINE)
        plain_text = re.sub(r'^\d+\.\s+', '', plain_text, flags=re.MULTILINE)
        
        return plain_text.strip()
    
    def create_new_version(self):
        """
        Create a new version of this document.
        """
        # Set all previous versions to not be the latest
        if self.is_latest:
            # Create a new version
            old_pk = self.pk
            self.pk = None
            self.version += 1
            self.parent_id = old_pk
            self.save()
            
            # Update the old version
            TextDocument.objects.filter(pk=old_pk).update(is_latest=False)
            
            return self
        return None


class Comment(models.Model):
    """
    Model for document comments.
    """
    document = models.ForeignKey(
        TextDocument,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_("Document")
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_("User")
    )
    text = models.TextField(_("Comment Text"))
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    
    # For threaded comments
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='replies',
        verbose_name=_("Parent Comment"),
        null=True,
        blank=True
    )
    
    class Meta:
        verbose_name = _("Comment")
        verbose_name_plural = _("Comments")
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.user} on {self.document}"


class DocumentPDFExport(models.Model):
    """
    Model for storing PDF exports of documents with shareable links.
    """
    # Expiration choices
    EXPIRATION_CHOICES = [
        ('1h', _('1 Hour')),
        ('24h', _('24 Hours')),
        ('1w', _('1 Week')),
        ('1m', _('1 Month')),
        ('never', _('Never')),
    ]
    
    document = models.ForeignKey(
        TextDocument,
        on_delete=models.CASCADE,
        related_name='pdf_exports',
        verbose_name=_("Document")
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='pdf_exports',
        verbose_name=_("Created By")
    )
    uuid = models.UUIDField(_("UUID"), default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    expires_at = models.DateTimeField(_("Expires At"), null=True, blank=True)
    expiration_type = models.CharField(_("Expiration Type"), max_length=10, choices=EXPIRATION_CHOICES, default='1w')
    pin_protected = models.BooleanField(_("PIN Protected"), default=False)
    pin_code = models.CharField(_("PIN Code"), max_length=4, blank=True, null=True)
    
    class Meta:
        verbose_name = _("Document PDF Export")
        verbose_name_plural = _("Document PDF Exports")
        ordering = ['-created_at']
    
    def __str__(self):
        return f"PDF Export of {self.document.title}"
    
    def save(self, *args, **kwargs):
        # Set expiration date based on expiration_type
        if not self.expires_at or not self.pk:  # Only set on creation or if not explicitly set
            if self.expiration_type == '1h':
                self.expires_at = timezone.now() + timedelta(hours=1)
            elif self.expiration_type == '24h':
                self.expires_at = timezone.now() + timedelta(hours=24)
            elif self.expiration_type == '1w':
                self.expires_at = timezone.now() + timedelta(weeks=1)
            elif self.expiration_type == '1m':
                self.expires_at = timezone.now() + timedelta(days=30)
            elif self.expiration_type == 'never':
                self.expires_at = None
        
        # Generate a random 4-digit PIN if pin_protected is True and no PIN exists
        if self.pin_protected and not self.pin_code:
            import random
            self.pin_code = f"{random.randint(0, 9999):04d}"
        
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        """Check if the export link has expired."""
        return self.expires_at and timezone.now() > self.expires_at


class StyleConstraint(models.Model):
    """
    Model for storing condensed style constraints derived from style analysis.
    These are compact, direct writing instructions that can be used for document generation.
    """
    name = models.CharField(_("Name"), max_length=100)
    description = models.TextField(_("Description"), blank=True)
    
    # The actual style constraints as a JSON object
    constraints = models.JSONField(_("Style Constraints"), default=dict)
    
    # Organization (optional - for org-specific style constraints)
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='style_constraints',
        verbose_name=_("Organization"),
        null=True,
        blank=True,
        help_text=_("If set, this style constraint will only be used for this organization. Leave blank for global constraints.")
    )
    
    # Reference documents used to create this style constraint
    reference_documents = models.ManyToManyField(
        'TextDocument',
        related_name='referenced_in_style_constraints',
        verbose_name=_("Reference Documents"),
        blank=True
    )
    
    # Metadata
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        related_name='created_style_constraints',
        verbose_name=_("Created By"),
        null=True,
        blank=True
    )
    is_active = models.BooleanField(_("Is Active"), default=True)
    
    class Meta:
        verbose_name = _("Style Constraint")
        verbose_name_plural = _("Style Constraints")
        ordering = ['-created_at']
    
    def __str__(self):
        org_name = self.organization.name if self.organization else _("Global")
        return f"{self.name} ({org_name})"


class AIPromptTemplate(models.Model):
    """
    Model for storing AI prompt templates that can be customized in the admin interface.
    """
    name = models.CharField(_("Name"), max_length=100)
    description = models.TextField(_("Description"), blank=True)
    
    # Template types
    TYPE_CHOICES = [
        ('system_message', _('System Message')),
        ('new_content', _('New Content Generation')),
        ('summary', _('Summary Generation')),
        ('analysis', _('Analysis Generation')),
        ('comparison', _('Comparison Generation')),
        ('custom', _('Custom Document Generation')),
        ('formatting', _('Formatting Instructions')),
        ('style_analysis', _('Style Analysis')),
        ('style_condensation', _('Style Condensation')),
    ]
    template_type = models.CharField(_("Template Type"), max_length=20, choices=TYPE_CHOICES)
    
    # The actual template content
    content = models.TextField(_("Content"))
    
    # Organization (optional - for org-specific templates)
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='ai_templates',
        verbose_name=_("Organization"),
        null=True,
        blank=True,
        help_text=_("If set, this template will only be used for this organization. Leave blank for global templates.")
    )
    
    # Metadata
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    is_active = models.BooleanField(_("Is Active"), default=True)
    
    class Meta:
        verbose_name = _("AI Prompt Template")
        verbose_name_plural = _("AI Prompt Templates")
        unique_together = [['template_type', 'organization']]
        ordering = ['template_type', 'name']
    
    def __str__(self):
        org_name = self.organization.name if self.organization else _("Global")
        return f"{self.get_template_type_display()} - {self.name} ({org_name})"
    
    @classmethod
    def get_template(cls, template_type, organization=None):
        """
        Get the appropriate template for the given type and organization.
        First tries to find an organization-specific template, then falls back to a global one.
        """
        try:
            # First try to find an organization-specific template
            if organization:
                template = cls.objects.filter(
                    template_type=template_type,
                    organization=organization,
                    is_active=True
                ).first()
                
                if template:
                    return template.content
            
            # Fall back to a global template
            template = cls.objects.filter(
                template_type=template_type,
                organization__isnull=True,
                is_active=True
            ).first()
            
            if template:
                return template.content
                
            return None
        except Exception as e:
            print(f"Error retrieving AI template: {str(e)}")
            return None
