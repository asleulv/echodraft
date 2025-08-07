from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class Organization(models.Model):
    """
    Organization model for grouping users and managing AI credit packages.
    """
    name = models.CharField(_("Organization Name"), max_length=255)
    billing_info = models.JSONField(_("Billing Information"), default=dict, blank=True)
    stripe_customer_id = models.CharField(_("Stripe Customer ID"), max_length=255, blank=True, null=True)
    
    # AI Credit System
    ai_credits_balance = models.IntegerField(
        _("AI Credits Balance"), 
        default=0,
        help_text=_("Purchased credits that don't expire")
    )
    
    bonus_ai_generation_credits = models.IntegerField(
        _("Bonus AI Generation Credits"), 
        default=0,
        help_text=_("Free bonus credits given by admin (don't expire)")
    )
    
    ai_credits_purchased_total = models.IntegerField(
        _("Total AI Credits Purchased"), 
        default=0,
        help_text=_("Lifetime total of credits purchased for tracking")
    )
    
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
        
    class Meta:
        verbose_name = _("Organization")
        verbose_name_plural = _("Organizations")
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def total_credits_available(self):
        """Return total credits available (purchased + bonus)."""
        return self.ai_credits_balance + self.bonus_ai_generation_credits
    
    @property
    def has_credits(self):
        """Check if organization has any credits available."""
        return self.total_credits_available > 0
    
    def deduct_credit(self):
        """
        Deduct one credit, prioritizing bonus credits first.
        Returns True if successful, False if insufficient credits.
        """
        if self.bonus_ai_generation_credits > 0:
            self.bonus_ai_generation_credits -= 1
            self.save(update_fields=['bonus_ai_generation_credits'])
            return True
        elif self.ai_credits_balance > 0:
            self.ai_credits_balance -= 1
            self.save(update_fields=['ai_credits_balance'])
            return True
        else:
            return False
    
    def add_purchased_credits(self, credits):
        """Add purchased credits to the organization."""
        self.ai_credits_balance += credits
        self.ai_credits_purchased_total += credits
        self.save(update_fields=['ai_credits_balance', 'ai_credits_purchased_total'])
    
    def add_bonus_credits(self, credits):
        """Add bonus credits to the organization."""
        self.bonus_ai_generation_credits += credits
        self.save(update_fields=['bonus_ai_generation_credits'])


class CreditPackage(models.Model):
    """
    Credit package model for defining purchasable AI credit bundles.
    """
    name = models.CharField(_("Package Name"), max_length=50)
    display_name = models.CharField(_("Display Name"), max_length=100)
    description = models.TextField(_("Description"), blank=True)
    credits = models.IntegerField(_("Credits Included"))
    price = models.DecimalField(_("Price"), max_digits=10, decimal_places=2)
    currency = models.CharField(_("Currency"), max_length=3, default='USD')
    stripe_price_id = models.CharField(_("Stripe Price ID"), max_length=100, blank=True, null=True)
    is_active = models.BooleanField(_("Is Active"), default=True)
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    
    class Meta:
        verbose_name = _("Credit Package")
        verbose_name_plural = _("Credit Packages")
        ordering = ['price']
    
    def __str__(self):
        return f"{self.display_name} ({self.credits} credits - ${self.price})"


class CreditPurchase(models.Model):
    """
    Credit purchase history model.
    """
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='credit_purchases',
        verbose_name=_("Organization")
    )
    package = models.ForeignKey(
        CreditPackage,
        on_delete=models.CASCADE,
        related_name='purchases',
        verbose_name=_("Package")
    )
    credits_purchased = models.IntegerField(_("Credits Purchased"))
    amount_paid = models.DecimalField(_("Amount Paid"), max_digits=10, decimal_places=2)
    stripe_payment_intent_id = models.CharField(_("Stripe Payment Intent ID"), max_length=255, blank=True, null=True)
    purchase_date = models.DateTimeField(_("Purchase Date"), auto_now_add=True)
    
    class Meta:
        verbose_name = _("Credit Purchase")
        verbose_name_plural = _("Credit Purchases")
        ordering = ['-purchase_date']
    
    def __str__(self):
        return f"{self.organization.name} - {self.credits_purchased} credits - ${self.amount_paid}"


class User(AbstractUser):
    """
    Custom user model with additional fields.
    """
    # Override the email field to make it unique
    email = models.EmailField(_('email address'), unique=True)
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='users',
        verbose_name=_("Organization"),
        null=True,
        blank=True,
    )
    role = models.CharField(_("Role"), max_length=50, choices=[
        ('admin', 'Administrator'),
        ('editor', 'Editor'),
        ('viewer', 'Viewer'),
    ], default='viewer')
    profile_picture = models.ImageField(
        _("Profile Picture"),
        upload_to='profile_pictures/',
        null=True,
        blank=True
    )
    # Session preferences
    inactivity_timeout = models.IntegerField(
        _("Inactivity Timeout (seconds)"), 
        default=1800,  # 30 minutes default
        help_text=_("Time in seconds before automatic logout due to inactivity")
    )
    stay_logged_in = models.BooleanField(
        _("Stay Logged In"), 
        default=False,
        help_text=_("Whether to keep the user logged in across browser sessions")
    )
    # Email verification
    email_verification_token = models.CharField(
        _("Email Verification Token"),
        max_length=100,
        null=True,
        blank=True,
        help_text=_("Token used for email verification")
    )
    # Marketing consent
    marketing_consent = models.BooleanField(
        _("Marketing Email Consent"),
        default=False,
        help_text=_("Whether the user has consented to receiving marketing emails")
    )
    
    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
    
    def __str__(self):
        return self.email or self.username
    
    @property
    def is_organization_admin(self):
        """Check if the user is an admin of their organization."""
        return self.role == 'admin'
    
    @property
    def can_edit(self):
        """Check if the user has edit permissions."""
        return self.role in ['admin', 'editor']
