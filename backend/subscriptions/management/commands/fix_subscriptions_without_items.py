import stripe
from django.core.management.base import BaseCommand
from django.conf import settings
from accounts.models import Organization
from subscriptions.models import SubscriptionPlan, SubscriptionEvent

# Configure Stripe API key
stripe.api_key = settings.STRIPE_SECRET_KEY

class Command(BaseCommand):
    help = 'Fix Stripe subscriptions that have no items'

    def handle(self, *args, **options):
        # Get all organizations with active subscriptions
        organizations = Organization.objects.exclude(
            stripe_subscription_id__isnull=True
        ).exclude(
            stripe_subscription_id__exact=''
        )
        
        self.stdout.write(f"Found {organizations.count()} organizations with subscription IDs")
        
        fixed_count = 0
        error_count = 0
        
        for org in organizations:
            try:
                # Skip organizations on the free plan
                if org.subscription_plan == 'explorer':
                    continue
                
                self.stdout.write(f"Checking subscription {org.stripe_subscription_id} for organization {org.id} ({org.name})")
                
                # Retrieve the subscription from Stripe
                try:
                    subscription = stripe.Subscription.retrieve(
                        org.stripe_subscription_id,
                        expand=['items.data']
                    )
                    
                    # Check if the subscription has items
                    has_items = False
                    
                    # Try different ways to access items data
                    if hasattr(subscription, 'items'):
                        if hasattr(subscription.items, 'data'):
                            has_items = len(subscription.items.data) > 0
                        elif isinstance(subscription.items, dict) and 'data' in subscription.items:
                            has_items = len(subscription.items['data']) > 0
                    
                    # If we still can't find items, try a direct API call to list subscription items
                    if not has_items:
                        try:
                            items = stripe.SubscriptionItem.list(subscription=org.stripe_subscription_id)
                            has_items = len(items.data) > 0
                            
                            if has_items:
                                self.stdout.write(self.style.WARNING(
                                    f"Subscription {org.stripe_subscription_id} has items when checked directly, but not in the subscription object."
                                ))
                                
                                # Store the item IDs for debugging
                                item_ids = [item.id for item in items.data]
                                self.stdout.write(f"Item IDs: {', '.join(item_ids)}")
                        except stripe.error.StripeError as e:
                            self.stdout.write(self.style.ERROR(
                                f"Error listing subscription items: {str(e)}"
                            ))
                    
                    if not has_items:
                        self.stdout.write(self.style.WARNING(
                            f"Subscription {org.stripe_subscription_id} has no items. Attempting to fix..."
                        ))
                        
                        # Get the subscription plan
                        try:
                            plan = SubscriptionPlan.objects.get(name=org.subscription_plan)
                            
                            # Check if the plan has a Stripe price ID
                            if not plan.stripe_price_id:
                                self.stdout.write(self.style.ERROR(
                                    f"Plan {plan.name} has no Stripe price ID. Skipping..."
                                ))
                                error_count += 1
                                continue
                            
                            # Add the price to the subscription
                            updated_subscription = stripe.Subscription.modify(
                                org.stripe_subscription_id,
                                items=[{
                                    'price': plan.stripe_price_id,
                                    'quantity': 1,
                                }],
                                metadata={
                                    'organization_id': str(org.id),
                                    'plan_id': str(plan.id),
                                    'plan_name': plan.name
                                }
                            )
                            
                            # Create a subscription event
                            SubscriptionEvent.objects.create(
                                organization=org,
                                event_type='subscription_updated',
                                stripe_event_id=f"fix_command_{org.stripe_subscription_id}",
                                data={
                                    'subscription_id': org.stripe_subscription_id,
                                    'status': updated_subscription.status,
                                    'current_period_end': updated_subscription.current_period_end,
                                    'plan_name': plan.name,
                                    'price_id': plan.stripe_price_id,
                                    'fixed_by': 'fix_subscriptions_without_items command'
                                }
                            )
                            
                            self.stdout.write(self.style.SUCCESS(
                                f"Successfully fixed subscription {org.stripe_subscription_id}"
                            ))
                            fixed_count += 1
                            
                        except SubscriptionPlan.DoesNotExist:
                            self.stdout.write(self.style.ERROR(
                                f"Plan {org.subscription_plan} not found. Skipping..."
                            ))
                            error_count += 1
                            continue
                        except stripe.error.StripeError as e:
                            self.stdout.write(self.style.ERROR(
                                f"Stripe error fixing subscription {org.stripe_subscription_id}: {str(e)}"
                            ))
                            error_count += 1
                            continue
                    else:
                        self.stdout.write(self.style.SUCCESS(
                            f"Subscription {org.stripe_subscription_id} has items. No fix needed."
                        ))
                        
                except stripe.error.InvalidRequestError as e:
                    self.stdout.write(self.style.ERROR(
                        f"Subscription {org.stripe_subscription_id} not found in Stripe: {str(e)}"
                    ))
                    error_count += 1
                    continue
                except stripe.error.StripeError as e:
                    self.stdout.write(self.style.ERROR(
                        f"Stripe error retrieving subscription {org.stripe_subscription_id}: {str(e)}"
                    ))
                    error_count += 1
                    continue
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"Unexpected error processing organization {org.id}: {str(e)}"
                ))
                error_count += 1
                continue
        
        self.stdout.write(self.style.SUCCESS(
            f"Command completed. Fixed {fixed_count} subscriptions. Encountered {error_count} errors."
        ))
