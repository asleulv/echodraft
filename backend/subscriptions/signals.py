from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from accounts.models import Organization
from .models import SubscriptionEvent, AIGenerationUsage

@receiver(post_save, sender=Organization)
def create_initial_ai_usage(sender, instance, created, **kwargs):
    """
    Create initial AI usage record for new organizations.
    """
    if created:
        # Get the first day of the current month
        today = timezone.now().date()
        first_day = today.replace(day=1)
        
        # Create AI usage record
        AIGenerationUsage.objects.create(
            organization=instance,
            month=first_day,
            count=0
        )

@receiver(post_save, sender=SubscriptionEvent)
def handle_subscription_event(sender, instance, created, **kwargs):
    """
    Handle subscription events.
    """
    if not created:
        return
    
    organization = instance.organization
    
    # Handle subscription created event
    if instance.event_type == 'subscription_created':
        # Update subscription status
        organization.subscription_status = 'active'
        
        # Set subscription period end date (30 days from now for monthly subscriptions)
        organization.subscription_period_end = timezone.now() + timedelta(days=30)
        
        # Save organization
        organization.save(update_fields=['subscription_status', 'subscription_period_end'])
    
    # Handle subscription cancelled event
    elif instance.event_type == 'subscription_cancelled':
        # Update subscription status
        organization.subscription_status = 'cancelled'
        
        # Save organization
        organization.save(update_fields=['subscription_status'])
    
    # Handle payment succeeded event
    elif instance.event_type == 'payment_succeeded':
        # Update subscription status
        organization.subscription_status = 'active'
        
        # Extend subscription period end date (30 days from current end date)
        if organization.subscription_period_end:
            organization.subscription_period_end = organization.subscription_period_end + timedelta(days=30)
        else:
            organization.subscription_period_end = timezone.now() + timedelta(days=30)
        
        # Save organization
        organization.save(update_fields=['subscription_status', 'subscription_period_end'])
    
    # Handle payment failed event
    elif instance.event_type == 'payment_failed':
        # Update subscription status
        organization.subscription_status = 'past_due'
        
        # Save organization
        organization.save(update_fields=['subscription_status'])
