from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import EmailTemplate

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'template_type', 'subject', 'is_active', 'updated_at')
    list_filter = ('template_type', 'is_active')
    search_fields = ('name', 'subject', 'html_content', 'plain_content')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'template_type', 'subject', 'is_active')
        }),
        (_('Content'), {
            'fields': ('html_content', 'plain_content'),
            'description': _('Use {{ variable }} syntax for template variables. Available variables depend on the template type.')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        # Make template_type readonly if this is an existing object
        if obj:
            return self.readonly_fields + ('template_type',)
        return self.readonly_fields
