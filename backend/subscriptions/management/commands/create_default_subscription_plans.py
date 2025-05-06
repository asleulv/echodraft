from django.core.management.base import BaseCommand
from django.db import transaction
from subscriptions.models import SubscriptionPlan

class Command(BaseCommand):
    help = 'Create default subscription plans'
    
    @transaction.atomic
    def handle(self, *args, **options):
        # Define the default subscription plans
        plans = [
            {
                'name': 'explorer',
                'display_name': 'Explorer',
                'description': 'Free plan with limited AI generation (3 per month)',
                'price': 0.00,
                'currency': 'USD',
                'interval': 'month',
                'ai_generation_limit': 3,
                'is_active': True,
            },
            {
                'name': 'creator',
                'display_name': 'Creator',
                'description': 'Standard plan with 100 AI generations per month',
                'price': 9.00,
                'currency': 'USD',
                'interval': 'month',
                'ai_generation_limit': 100,
                'is_active': True,
            },
            {
                'name': 'master',
                'display_name': 'Master',
                'description': 'Premium plan with 500 AI generations per month',
                'price': 19.00,
                'currency': 'USD',
                'interval': 'month',
                'ai_generation_limit': 500,
                'is_active': True,
            },
        ]
        
        # Create or update each plan
        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.update_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created subscription plan: {plan.display_name}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Updated subscription plan: {plan.display_name}'))
        
        self.stdout.write(self.style.SUCCESS('Successfully created default subscription plans'))
