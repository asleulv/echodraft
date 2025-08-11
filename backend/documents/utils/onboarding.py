# documents/utils/onboarding.py
from django.contrib.auth import get_user_model
from ..models import TextDocument

User = get_user_model()

def user_has_only_demo_documents(user):
    """Check if user only has demo documents (no real content yet)"""
    organization = user.organization
    if not organization:
        return False
    
    # Get all documents for this organization
    total_docs = TextDocument.objects.filter(organization=organization).count()
    demo_docs = TextDocument.objects.filter(organization=organization, is_demo=True).count()
    
    # If they only have demo documents (or no documents at all)
    return total_docs == demo_docs and demo_docs > 0

def get_onboarding_status(user):
    """Get comprehensive onboarding status for user"""
    organization = user.organization
    if not organization:
        return {
            'has_only_demo_documents': False,
            'show_getting_started': False,
            'total_documents': 0,
            'demo_documents': 0,
            'real_documents': 0
        }
    
    total_docs = TextDocument.objects.filter(organization=organization).count()
    demo_docs = TextDocument.objects.filter(organization=organization, is_demo=True).count()
    real_docs = total_docs - demo_docs
    has_only_demo_documents = total_docs == demo_docs and demo_docs > 0
    
    return {
        'has_only_demo_documents': has_only_demo_documents,
        'show_getting_started': has_only_demo_documents,
        'total_documents': total_docs,
        'demo_documents': demo_docs,
        'real_documents': real_docs
    }
