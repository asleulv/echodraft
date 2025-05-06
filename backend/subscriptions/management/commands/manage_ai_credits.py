from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from accounts.models import Organization
from datetime import timedelta


class Command(BaseCommand):
    help = 'Manage AI generation credits for testing purposes'

    def add_arguments(self, parser):
        parser.add_argument('--org_id', type=int, help='Organization ID')
        parser.add_argument('--org_name', type=str, help='Organization name (alternative to org_id)')
        parser.add_argument('--add-bonus', type=int, help='Add bonus credits')
        parser.add_argument('--set-used', type=int, help='Set used credits')
        parser.add_argument('--reset', action='store_true', help='Force reset credits counter')
        parser.add_argument('--set-period-end', type=str, help='Set subscription period end date (YYYY-MM-DD)')
        parser.add_argument('--list', action='store_true', help='List all organizations')

    def handle(self, *args, **options):
        # List all organizations if requested
        if options['list']:
            self.list_organizations()
            return

        # Get the organization
        org = self.get_organization(options)
        if not org:
            return

        # Process commands
        if options['add_bonus'] is not None:
            self.add_bonus_credits(org, options['add_bonus'])
        
        if options['set_used'] is not None:
            self.set_used_credits(org, options['set_used'])
        
        if options['reset']:
            self.reset_credits(org)
        
        if options['set_period_end']:
            self.set_period_end(org, options['set_period_end'])
        
        # Display current status
        self.display_status(org)

    def get_organization(self, options):
        """Get the organization by ID or name."""
        org_id = options['org_id']
        org_name = options['org_name']
        
        if not org_id and not org_name:
            self.stdout.write(self.style.ERROR('Please provide either --org_id or --org_name'))
            return None
        
        try:
            if org_id:
                org = Organization.objects.get(id=org_id)
            else:
                org = Organization.objects.get(name=org_name)
            return org
        except Organization.DoesNotExist:
            if org_id:
                self.stdout.write(self.style.ERROR(f"Organization with ID {org_id} not found"))
            else:
                self.stdout.write(self.style.ERROR(f"Organization with name '{org_name}' not found"))
            return None
        except Organization.MultipleObjectsReturned:
            self.stdout.write(self.style.ERROR(f"Multiple organizations found with name '{org_name}'. Please use --org_id instead."))
            return None

    def list_organizations(self):
        """List all organizations with their IDs and names."""
        orgs = Organization.objects.all().order_by('name')
        
        if not orgs:
            self.stdout.write("No organizations found.")
            return
        
        self.stdout.write(self.style.SUCCESS("Organizations:"))
        for org in orgs:
            self.stdout.write(f"ID: {org.id}, Name: {org.name}, Plan: {org.subscription_plan}")

    def add_bonus_credits(self, org, credits):
        """Add bonus credits to the organization."""
        org.bonus_ai_generation_credits += credits
        org.save(update_fields=['bonus_ai_generation_credits'])
        self.stdout.write(self.style.SUCCESS(f"Added {credits} bonus credits to {org.name}"))

    def set_used_credits(self, org, credits):
        """Set the used credits for the organization."""
        org.ai_generations_used = credits
        org.save(update_fields=['ai_generations_used'])
        self.stdout.write(self.style.SUCCESS(f"Set used credits to {credits} for {org.name}"))

    def reset_credits(self, org):
        """Force reset the credits counter."""
        # Save the bonus credits before resetting
        bonus_credits = org.bonus_ai_generation_credits
        
        # Force reset by setting the reset date to yesterday
        yesterday = timezone.now() - timedelta(days=1)
        org.ai_generations_reset_date = yesterday
        org.save(update_fields=['ai_generations_reset_date'])
        
        # Call the reset method
        org.reset_ai_generations_if_needed()
        
        self.stdout.write(self.style.SUCCESS(f"Reset credits counter for {org.name}"))
        
        # If we want to preserve bonus credits for testing, uncomment this
        # org.bonus_ai_generation_credits = bonus_credits
        # org.save(update_fields=['bonus_ai_generation_credits'])
        # self.stdout.write(self.style.SUCCESS(f"Preserved {bonus_credits} bonus credits"))

    def set_period_end(self, org, date_str):
        """Set the subscription period end date."""
        try:
            from datetime import datetime
            date = datetime.strptime(date_str, '%Y-%m-%d')
            date = timezone.make_aware(date)
            
            org.subscription_period_end = date
            org.save(update_fields=['subscription_period_end'])
            self.stdout.write(self.style.SUCCESS(f"Set subscription period end to {date_str} for {org.name}"))
        except ValueError:
            self.stdout.write(self.style.ERROR(f"Invalid date format: {date_str}. Use YYYY-MM-DD."))

    def display_status(self, org):
        """Display the current status of the organization."""
        self.stdout.write("\nCurrent Status:")
        self.stdout.write(f"Organization: {org.name}")
        self.stdout.write(f"Subscription Plan: {org.subscription_plan}")
        self.stdout.write(f"Base AI Generation Limit: {org.base_ai_generation_limit}")
        self.stdout.write(f"Bonus Credits: {org.bonus_ai_generation_credits}")
        self.stdout.write(f"Total AI Generation Limit: {org.total_ai_generation_limit}")
        self.stdout.write(f"AI Generations Used: {org.ai_generations_used}")
        self.stdout.write(f"AI Generations Remaining: {org.ai_generations_remaining}")
        
        if org.ai_generations_reset_date:
            self.stdout.write(f"Next Reset Date: {org.ai_generations_reset_date.strftime('%Y-%m-%d')}")
        else:
            self.stdout.write("Next Reset Date: Not set")
        
        if org.subscription_period_end:
            self.stdout.write(f"Subscription Period End: {org.subscription_period_end.strftime('%Y-%m-%d')}")
        else:
            self.stdout.write("Subscription Period End: Not set")
        
        self.stdout.write(f"Cancel At Period End: {org.cancel_at_period_end}")
