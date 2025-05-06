import stripe
from django.core.management.base import BaseCommand
from django.conf import settings
from subscriptions.models import SubscriptionPlan

class Command(BaseCommand):
    help = 'Update subscription plans with their Stripe price IDs'

    def handle(self, *args, **options):
        # Configure Stripe API key
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        # Get all active subscription plans
        plans = SubscriptionPlan.objects.filter(is_active=True)
        
        self.stdout.write(self.style.SUCCESS(f'Found {len(plans)} active subscription plans'))
        
        # For each plan, find or create the Stripe price
        for plan in plans:
            self.stdout.write(f'Processing plan: {plan.name}')
            
            # Skip if the plan already has a price ID
            if plan.stripe_price_id:
                self.stdout.write(f'  Plan {plan.name} already has price ID: {plan.stripe_price_id}')
                continue
            
            # Find existing prices for this plan
            prices = stripe.Price.list(
                lookup_keys=[f"plan_{plan.name}"],
                expand=['data.product']
            )
            
            if prices.data:
                # Use the first price found
                price = prices.data[0]
                plan.stripe_price_id = price.id
                plan.save(update_fields=['stripe_price_id'])
                self.stdout.write(self.style.SUCCESS(f'  Updated plan {plan.name} with existing price ID: {price.id}'))
            else:
                # Create a new product and price
                self.stdout.write(f'  No existing price found for plan {plan.name}, creating new one')
                
                # Create a product for this plan
                product = stripe.Product.create(
                    name=plan.display_name,
                    description=plan.description,
                    metadata={
                        'plan_id': plan.id,
                        'plan_name': plan.name
                    }
                )
                
                # Create a price for this product
                price = stripe.Price.create(
                    product=product.id,
                    unit_amount=int(plan.price * 100),  # Convert to cents
                    currency=plan.currency.lower(),
                    recurring={
                        'interval': plan.interval,
                    },
                    lookup_key=f"plan_{plan.name}",
                    metadata={
                        'plan_id': plan.id,
                        'plan_name': plan.name
                    }
                )
                
                # Update the plan with the price ID
                plan.stripe_price_id = price.id
                plan.save(update_fields=['stripe_price_id'])
                self.stdout.write(self.style.SUCCESS(f'  Created new price for plan {plan.name}: {price.id}'))
        
        self.stdout.write(self.style.SUCCESS('Successfully updated subscription plans with Stripe price IDs'))
