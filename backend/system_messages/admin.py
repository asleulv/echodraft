from django.contrib import admin
from .models import SystemMessage


@admin.register(SystemMessage)
class SystemMessageAdmin(admin.ModelAdmin):
    list_display = ('location', 'title', 'message_type', 'is_active', 'disable_functionality', 'start_date', 'end_date', 'created_at')
    list_filter = ('location', 'message_type', 'is_active', 'disable_functionality')
    search_fields = ('title', 'message')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('location', 'message_type', 'is_active', 'disable_functionality')
        }),
        ('Message Content', {
            'fields': ('title', 'message')
        }),
        ('Time Settings', {
            'fields': ('start_date', 'end_date'),
            'classes': ('collapse',),
            'description': 'Optional: Set a time range for when this message should be displayed.'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
