from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.shortcuts import render
from django.utils import timezone
from datetime import timedelta

# Now import all models including the new credit models
from .models import User, Organization, CreditPackage, CreditPurchase


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = [
        'name', 
        'total_credits_available',
        'ai_credits_balance', 
        'bonus_ai_generation_credits',
        'ai_credits_purchased_total',
        'created_at'
    ]
    list_filter = [
        'created_at',
        'updated_at'
    ]
    search_fields = ['name', 'stripe_customer_id']
    readonly_fields = [
        'ai_credits_purchased_total',
        'total_credits_available',
        'created_at', 
        'updated_at'
    ]
    actions = ['add_bonus_credits', 'reset_bonus_credits']
    fieldsets = (
        (None, {'fields': ('name',)}),
        (_('AI Credits'), {
            'fields': (
                'ai_credits_balance', 
                'bonus_ai_generation_credits',
                'ai_credits_purchased_total',
                'total_credits_available'
            )
        }),
        (_('Billing Information'), {'fields': ('billing_info',)}),
        (_('Stripe Information'), {'fields': ('stripe_customer_id',)}),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )
    
    # Add custom method to show total credits in admin
    def total_credits_available(self, obj):
        return obj.total_credits_available
    total_credits_available.short_description = 'Total Credits Available'
    
    def add_bonus_credits(self, request, queryset):
        """Admin action to add bonus AI generation credits."""
        if 'apply' in request.POST:
            # Get the number of credits from the form
            credits = int(request.POST.get('credits', 0))
            
            # Update each selected organization
            count = 0
            for org in queryset:
                org.add_bonus_credits(credits)
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
    
    def reset_bonus_credits(self, request, queryset):
        """Admin action to reset bonus credits to zero."""
        count = 0
        for org in queryset:
            org.bonus_ai_generation_credits = 0
            org.save(update_fields=['bonus_ai_generation_credits'])
            count += 1
        
        self.message_user(request, f"Reset bonus credits to zero for {count} organizations")
    reset_bonus_credits.short_description = "Reset bonus credits to zero"


@admin.register(CreditPackage)
class CreditPackageAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'credits', 'price', 'currency', 'is_active']
    list_filter = ['is_active', 'currency']
    search_fields = ['name', 'display_name']
    readonly_fields = ['created_at']
    fieldsets = (
        (None, {'fields': ('name', 'display_name', 'description')}),
        (_('Package Details'), {'fields': ('credits', 'price', 'currency')}),
        (_('Stripe Integration'), {'fields': ('stripe_price_id',)}),
        (_('Settings'), {'fields': ('is_active',)}),
        (_('Timestamps'), {'fields': ('created_at',)}),
    )


@admin.register(CreditPurchase)
class CreditPurchaseAdmin(admin.ModelAdmin):
    list_display = ['organization', 'package', 'credits_purchased', 'amount_paid', 'purchase_date']
    list_filter = ['purchase_date', 'package']
    search_fields = ['organization__name', 'stripe_payment_intent_id']
    readonly_fields = ['purchase_date']
    fieldsets = (
        (_('Purchase Details'), {
            'fields': ('organization', 'package', 'credits_purchased', 'amount_paid')
        }),
        (_('Payment Information'), {
            'fields': ('stripe_payment_intent_id',)
        }),
        (_('Timestamps'), {
            'fields': ('purchase_date',)
        }),
    )


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'organization', 'role', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'role', 'organization')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email', 'profile_picture')}),
        (_('Organization'), {'fields': ('organization', 'role')}),
        (_('Session Preferences'), {'fields': ('inactivity_timeout', 'stay_logged_in')}),
        (_('Email Verification'), {'fields': ('email_verification_token',)}),
        (_('Marketing'), {'fields': ('marketing_consent',)}),
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
