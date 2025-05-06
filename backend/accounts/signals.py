from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Organization

User = get_user_model()

@receiver(post_save, sender=User)
def create_organization_for_superuser(sender, instance, created, **kwargs):
    """
    Create an organization for a superuser if they don't have one.
    """
    if created and instance.is_superuser and not instance.organization:
        organization = Organization.objects.create(
            name=f"{instance.username}'s Organization",
            subscription_plan='enterprise'
        )
        instance.organization = organization
        instance.role = 'admin'
        instance.save(update_fields=['organization', 'role'])
