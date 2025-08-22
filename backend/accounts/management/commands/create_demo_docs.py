from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from documents.models import TextDocument
from accounts.models import Organization
from documents.utils.demo_content import create_demo_documents_for_new_org

User = get_user_model()

class Command(BaseCommand):
    help = 'Create missing demo documents for organizations'

    def handle(self, *args, **options):
        # Get a superuser to act as the creator
        creator = User.objects.filter(is_superuser=True).first()
        if not creator:
            self.stdout.write(
                self.style.ERROR('No superuser found. Please create one first with: python manage.py createsuperuser')
            )
            return

        # Process ALL organizations (not just those without any demos)
        all_orgs = Organization.objects.all()
        
        processed_count = 0
        
        for org in all_orgs:
            # This function will now only create missing demo documents
            result = create_demo_documents_for_new_org(org, creator)
            if "Created 0" not in result:  # Only count if something was actually created
                processed_count += 1
                self.stdout.write(f'✅ {result}')
            else:
                self.stdout.write(f'ℹ️  {result}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {len(all_orgs)} organizations, updated {processed_count} of them!'
            )
        )
