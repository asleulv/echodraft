from django.contrib import admin
from .models import SubscriptionPlan, SubscriptionEvent, AIGenerationUsage

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    """Admin interface for SubscriptionPlan model."""
    
    list_display = ('display_name', 'name', 'price', 'currency', 'interval', 'ai_generation_limit', 'is_active')
    list_filter = ('is_active', 'interval', 'currency')
    search_fields = ('name', 'display_name', 'description')
    ordering = ('price',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'display_name', 'description', 'is_active')
        }),
        ('Pricing', {
            'fields': ('price', 'currency', 'interval')
        }),
        ('Stripe', {
            'fields': ('stripe_price_id',)
        }),
        ('Limits', {
            'fields': ('ai_generation_limit',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(SubscriptionEvent)
class SubscriptionEventAdmin(admin.ModelAdmin):
    """Admin interface for SubscriptionEvent model."""
    
    list_display = ('event_type', 'organization', 'created_at', 'stripe_event_id')
    list_filter = ('event_type', 'created_at')
    search_fields = ('organization__name', 'stripe_event_id')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    fieldsets = (
        (None, {
            'fields': ('organization', 'event_type', 'stripe_event_id')
        }),
        ('Data', {
            'fields': ('data',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

@admin.register(AIGenerationUsage)
class AIGenerationUsageAdmin(admin.ModelAdmin):
    """Admin interface for AIGenerationUsage model."""
    
    list_display = ('organization', 'month', 'count', 'updated_at')
    list_filter = ('month', 'organization')
    search_fields = ('organization__name',)
    ordering = ('-month', 'organization__name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('organization', 'month', 'count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
