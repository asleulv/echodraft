from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import Organization

class Command(BaseCommand):
    help = 'Update subscription plans for organizations with invalid plans'
    
    @transaction.atomic
    def handle(self, *args, **options):
        # Get all organizations with invalid subscription plans
        valid_plans = ['explorer', 'creator', 'master']
        organizations = Organization.objects.exclude(subscription_plan__in=valid_plans)
        
        # Update each organization to have a valid subscription plan
        count = 0
        for organization in organizations:
            old_plan = organization.subscription_plan
            organization.subscription_plan = 'explorer'  # Default to explorer
            organization.save(update_fields=['subscription_plan'])
            count += 1
            self.stdout.write(self.style.SUCCESS(f'Updated organization {organization.id} from "{old_plan}" to "explorer"'))
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No organizations with invalid subscription plans found'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully updated {count} organizations'))
