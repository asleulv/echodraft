from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.shortcuts import render
from django.utils import timezone
from datetime import timedelta

from .models import User, Organization

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'subscription_plan', 'ai_generations_used', 'base_ai_generation_limit', 'bonus_ai_generation_credits', 'total_ai_generation_limit', 'created_at')
    list_filter = ('subscription_plan', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at', 'base_ai_generation_limit', 'total_ai_generation_limit', 'ai_generations_remaining')
    actions = ['add_bonus_credits', 'reset_ai_generations', 'simulate_period_end']
    fieldsets = (
        (None, {'fields': ('name', 'subscription_plan')}),
        (_('AI Generation'), {'fields': ('ai_generations_used', 'base_ai_generation_limit', 'bonus_ai_generation_credits', 'total_ai_generation_limit', 'ai_generations_remaining', 'ai_generations_reset_date')}),
        (_('Billing Information'), {'fields': ('billing_info', 'subscription_status', 'subscription_period_end', 'cancel_at_period_end')}),
        (_('Stripe Information'), {'fields': ('stripe_customer_id', 'stripe_subscription_id')}),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )
    
    def add_bonus_credits(self, request, queryset):
        """Admin action to add bonus AI generation credits."""
        if 'apply' in request.POST:
            # Get the number of credits from the form
            credits = int(request.POST.get('credits', 0))
            
            # Update each selected organization
            count = 0
            for org in queryset:
                org.bonus_ai_generation_credits += credits
                org.save(update_fields=['bonus_ai_generation_credits'])
                count += 1
                
            self.message_user(request, f"Added {credits} bonus credits to {count} organizations")
            return None
            
        # Show a form to enter the number of credits
        return render(
            request,
            'admin/add_bonus_credits.html',
            context={
                'title': 'Add Bonus AI Generation Credits',
                'queryset': queryset,
                'opts': self.model._meta,
                'action_checkbox_name': admin.helpers.ACTION_CHECKBOX_NAME,
            }
        )
    add_bonus_credits.short_description = "Add bonus AI generation credits"
    
    def reset_ai_generations(self, request, queryset):
        """Admin action to reset AI generations used counter."""
        count = 0
        for org in queryset:
            org.ai_generations_used = 0
            org.save(update_fields=['ai_generations_used'])
            count += 1
        
        self.message_user(request, f"Reset AI generations used counter for {count} organizations")
    reset_ai_generations.short_description = "Reset AI generations used counter"
    
    def simulate_period_end(self, request, queryset):
        """Admin action to simulate the end of a billing period."""
        count = 0
        for org in queryset:
            # Force reset by setting the reset date to yesterday
            yesterday = timezone.now() - timedelta(days=1)
            org.ai_generations_reset_date = yesterday
            org.save(update_fields=['ai_generations_reset_date'])
            
            # Call the reset method
            org.reset_ai_generations_if_needed()
            count += 1
        
        self.message_user(request, f"Simulated period end for {count} organizations (reset counters and bonus credits)")
    simulate_period_end.short_description = "Simulate period end (reset counters and bonus credits)"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'organization', 'role', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'role', 'organization')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email', 'profile_picture')}),
        (_('Organization'), {'fields': ('organization', 'role')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'organization', 'role'),
        }),
    )
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)
