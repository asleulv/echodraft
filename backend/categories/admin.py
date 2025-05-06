from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Category, Tag

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'parent', 'document_count', 'created_at')
    list_filter = ('organization', 'parent', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'slug', 'document_count', 'all_documents_count')
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'slug', 'organization', 'parent')
        }),
        (_('Display Options'), {
            'fields': ('color', 'icon')
        }),
        (_('Statistics'), {
            'fields': ('document_count', 'all_documents_count')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'document_count', 'created_at')
    list_filter = ('organization', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'slug', 'document_count')
    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'organization')
        }),
        (_('Display Options'), {
            'fields': ('color',)
        }),
        (_('Statistics'), {
            'fields': ('document_count',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at',)
        }),
    )
    prepopulated_fields = {'slug': ('name',)}
