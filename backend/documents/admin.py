from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import TextDocument, Comment, DocumentPDFExport, AIPromptTemplate, AIModelSettings, DocumentLengthSettings, StyleConstraint

@admin.register(TextDocument)
class TextDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'organization', 'category', 'created_by', 'status', 'version', 'is_latest', 'updated_at')
    list_filter = ('status', 'is_latest', 'organization', 'category', 'created_at')
    search_fields = ('title', 'plain_text')
    readonly_fields = ('created_at', 'updated_at', 'version', 'slug', 'plain_text')
    fieldsets = (
        (None, {
            'fields': ('title', 'content', 'plain_text', 'slug')
        }),
        (_('Metadata'), {
            'fields': ('organization', 'created_by', 'category', 'tags')
        }),
        (_('Version Control'), {
            'fields': ('version', 'parent', 'is_latest')
        }),
        (_('Status'), {
            'fields': ('status',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('document', 'user', 'text_preview', 'created_at')
    list_filter = ('created_at', 'document', 'user')
    search_fields = ('text', 'document__title', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    
    def text_preview(self, obj):
        """Return a preview of the comment text."""
        if len(obj.text) > 50:
            return f"{obj.text[:50]}..."
        return obj.text
    text_preview.short_description = _("Comment")


@admin.register(DocumentPDFExport)
class DocumentPDFExportAdmin(admin.ModelAdmin):
    list_display = ('document', 'created_by', 'created_at', 'expiration_type', 'is_expired', 'pin_protected')
    list_filter = ('created_at', 'expiration_type', 'pin_protected')
    search_fields = ('document__title', 'created_by__username')
    readonly_fields = ('uuid', 'created_at', 'expires_at')
    fieldsets = (
        (None, {
            'fields': ('document', 'created_by', 'uuid')
        }),
        (_('Expiration'), {
            'fields': ('expiration_type', 'expires_at')
        }),
        (_('Security'), {
            'fields': ('pin_protected', 'pin_code')
        }),
    )


@admin.register(AIPromptTemplate)
class AIPromptTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'template_type', 'organization', 'is_active', 'updated_at')
    list_filter = ('template_type', 'is_active', 'organization')
    search_fields = ('name', 'description', 'content')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'template_type', 'is_active')
        }),
        (_('Organization'), {
            'fields': ('organization',),
            'description': _('If set, this template will only be used for this organization. Leave blank for global templates.')
        }),
        (_('Content'), {
            'fields': ('content',),
            'description': _('The template content. You can use variables like {concept}, {combined_content}, etc.')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(AIModelSettings)
class AIModelSettingsAdmin(admin.ModelAdmin):
    list_display = ('model_name', 'max_tokens', 'temperature', 'analysis_temperature', 'is_active', 'is_default', 'updated_at')
    list_filter = ('is_active', 'is_default', 'created_at')
    search_fields = ('model_name',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('model_name', 'max_tokens')
        }),
        (_('Temperature Settings'), {
            'fields': ('temperature', 'analysis_temperature'),
            'description': _('Control the creativity level separately for document generation and style analysis.')
        }),
        (_('Status'), {
            'fields': ('is_active', 'is_default')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(DocumentLengthSettings)
class DocumentLengthSettingsAdmin(admin.ModelAdmin):
    list_display = ('length_name', 'description', 'target_tokens', 'organization', 'is_active')
    list_filter = ('is_active', 'organization')
    search_fields = ('length_name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('length_name', 'description', 'target_tokens', 'is_active')
        }),
        (_('Organization'), {
            'fields': ('organization',),
            'description': _('If set, these settings will only apply to this organization. Leave blank for global settings.')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(StyleConstraint)
class StyleConstraintAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'created_by', 'is_active', 'updated_at')
    list_filter = ('is_active', 'organization', 'created_at')
    search_fields = ('name', 'description', 'constraints')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('reference_documents',)
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'is_active')
        }),
        (_('Style Constraints'), {
            'fields': ('constraints',),
            'description': _('JSON object containing condensed style instructions for document generation.')
        }),
        (_('Organization & References'), {
            'fields': ('organization', 'created_by', 'reference_documents'),
            'description': _('Organization and reference documents used to create this style constraint.')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )
