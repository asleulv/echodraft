from django.contrib import admin
from .models import LegalDocument

@admin.register(LegalDocument)
class LegalDocumentAdmin(admin.ModelAdmin):
    list_display = ('type', 'title', 'version', 'effective_date', 'updated_at')
    list_filter = ('type', 'effective_date')
    search_fields = ('title', 'content')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('type', 'title', 'version', 'effective_date')
        }),
        ('Content', {
            'fields': ('content',),
            'classes': ('wide',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
