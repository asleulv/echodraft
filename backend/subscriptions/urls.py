from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets with it
router = DefaultRouter(trailing_slash=True)
router.register(r'packages', views.CreditPackageViewSet, basename='credit-package')
router.register(r'organization', views.OrganizationCreditViewSet, basename='organization-credit')
router.register(r'webhook', views.StripeWebhookView, basename='stripe-webhook')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    # Add direct paths for credit purchase
    path('purchase/', views.OrganizationCreditViewSet.as_view({'post': 'purchase'}), name='credit-purchase'),
    # Add a direct path for the Stripe webhook
    path('webhook/', views.StripeWebhookView.as_view({'post': 'webhook'}), name='stripe-webhook'),
]
