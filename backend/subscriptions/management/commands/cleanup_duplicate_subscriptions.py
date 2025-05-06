import stripe
from django.core.management.base import BaseCommand
from django.conf import settings
from accounts.models import Organization
from subscriptions.models import SubscriptionEvent

# Configure Stripe API key
stripe.api_key = settings.STRIPE_SECRET_KEY

class Command(BaseCommand):
    help = 'Cleans up duplicate subscriptions for organizations'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting duplicate subscription cleanup...'))
        
        # Get all organizations with a Stripe customer ID
        organizations = Organization.objects.filter(
            stripe_customer_id__isnull=False
        ).exclude(stripe_customer_id='')
        
        self.stdout.write(f'Found {organizations.count()} organizations with Stripe customer IDs')
        
        for org in organizations:
            self.stdout.write(f'Processing organization: {org.name} (ID: {org.id})')
            
            try:
                # Get all subscriptions for this customer
                subscriptions = stripe.Subscription.list(
                    customer=org.stripe_customer_id,
                    status='active',
                    limit=100
                )
                
                if len(subscriptions.data) <= 1:
                    self.stdout.write(f'  Organization has {len(subscriptions.data)} active subscriptions - no cleanup needed')
                    continue
                
                self.stdout.write(self.style.WARNING(f'  Found {len(subscriptions.data)} active subscriptions - cleaning up duplicates'))
                
                # Sort subscriptions by creation date (newest first)
                sorted_subs = sorted(subscriptions.data, key=lambda s: s.created, reverse=True)
                
                # Keep the newest subscription, cancel all others
                newest_sub = sorted_subs[0]
                self.stdout.write(f'  Keeping newest subscription: {newest_sub.id} (created: {newest_sub.created})')
                
                # Update the organization's subscription ID if needed
                if org.stripe_subscription_id != newest_sub.id:
                    old_sub_id = org.stripe_subscription_id
                    org.stripe_subscription_id = newest_sub.id
                    org.save(update_fields=['stripe_subscription_id'])
                    self.stdout.write(f'  Updated organization subscription ID from {old_sub_id} to {newest_sub.id}')
                
                # Cancel all other subscriptions
                for sub in sorted_subs[1:]:
                    self.stdout.write(f'  Canceling duplicate subscription: {sub.id} (created: {sub.created})')
                    
                    try:
                        # Immediately cancel the subscription
                        stripe.Subscription.delete(sub.id)
                        
                        # Create a subscription event for the cancellation
                        SubscriptionEvent.objects.create(
                            organization=org,
                            event_type='subscription_cancelled_by_upgrade',
                            data={
                                'subscription_id': sub.id,
                                'replaced_by': newest_sub.id,
                                'cleanup_script': True
                            }
                        )
                        
                        self.stdout.write(self.style.SUCCESS(f'  Successfully canceled subscription {sub.id}'))
                    except stripe.error.StripeError as e:
                        self.stdout.write(self.style.ERROR(f'  Error canceling subscription {sub.id}: {str(e)}'))
            
            except stripe.error.StripeError as e:
                self.stdout.write(self.style.ERROR(f'  Error processing organization {org.id}: {str(e)}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Unexpected error for organization {org.id}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS('Duplicate subscription cleanup completed'))
