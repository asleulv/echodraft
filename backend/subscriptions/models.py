from django.db import models
from django.utils.translation import gettext_lazy as _

class SubscriptionPlan(models.Model):
    """
    Subscription plan model for storing plan details.
    """
    name = models.CharField(_("Plan Name"), max_length=50)
    stripe_price_id = models.CharField(_("Stripe Price ID"), max_length=100, blank=True, null=True)
    display_name = models.CharField(_("Display Name"), max_length=100)
    description = models.TextField(_("Description"), blank=True)
    price = models.DecimalField(_("Price"), max_digits=10, decimal_places=2)
    currency = models.CharField(_("Currency"), max_length=3, default='USD')
    interval = models.CharField(
        _("Billing Interval"),
        max_length=20,
        choices=[
            ('month', 'Monthly'),
            ('year', 'Yearly'),
        ],
        default='month'
    )
    ai_generation_limit = models.IntegerField(_("AI Generation Limit"), default=0)
    is_active = models.BooleanField(_("Is Active"), default=True)
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    
    class Meta:
        verbose_name = _("Subscription Plan")
        verbose_name_plural = _("Subscription Plans")
        ordering = ['price']
    
    def __str__(self):
        return f"{self.display_name} ({self.price} {self.currency}/{self.interval})"


class SubscriptionEvent(models.Model):
    """
    Subscription event model for tracking subscription-related events.
    """
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='subscription_events',
        verbose_name=_("Organization")
    )
    event_type = models.CharField(
        _("Event Type"),
        max_length=50,
        choices=[
            ('subscription_created', 'Subscription Created'),
            ('subscription_updated', 'Subscription Updated'),
            ('subscription_cancelled', 'Subscription Cancelled'),
            ('subscription_cancelled_by_upgrade', 'Subscription Cancelled By Upgrade'),
            ('subscription_cancelled_by_downgrade', 'Subscription Cancelled By Downgrade'),
            ('subscription_cancellation_error', 'Subscription Cancellation Error'),
            ('payment_succeeded', 'Payment Succeeded'),
            ('payment_failed', 'Payment Failed'),
            ('trial_started', 'Trial Started'),
            ('trial_ended', 'Trial Ended'),
        ]
    )
    stripe_event_id = models.CharField(_("Stripe Event ID"), max_length=255, blank=True, null=True)
    data = models.JSONField(_("Event Data"), default=dict, blank=True)
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    
    class Meta:
        verbose_name = _("Subscription Event")
        verbose_name_plural = _("Subscription Events")
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.event_type} - {self.organization.name} - {self.created_at}"


class AIGenerationUsage(models.Model):
    """
    AI generation usage model for tracking AI generation usage per organization.
    """
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='ai_generation_usage',
        verbose_name=_("Organization")
    )
    month = models.DateField(_("Month"), help_text=_("First day of the month"))
    count = models.IntegerField(_("Generation Count"), default=0)
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    
    class Meta:
        verbose_name = _("AI Generation Usage")
        verbose_name_plural = _("AI Generation Usage")
        ordering = ['-month']
        unique_together = ('organization', 'month')
    
    def __str__(self):
        return f"{self.organization.name} - {self.month.strftime('%Y-%m')} - {self.count} generations"
