from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets with it
router = DefaultRouter(trailing_slash=True)
router.register(r'plans', views.SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'organization', views.OrganizationSubscriptionViewSet, basename='organization-subscription')
router.register(r'webhook', views.StripeWebhookView, basename='stripe-webhook')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    # Add direct paths for checkout and portal
    path('checkout/', views.OrganizationSubscriptionViewSet.as_view({'post': 'checkout'}), name='checkout'),
    path('portal/', views.OrganizationSubscriptionViewSet.as_view({'post': 'portal'}), name='portal'),
    # Add a direct path for the Stripe webhook
    path('webhook/', views.StripeWebhookView.as_view({'post': 'webhook'}), name='stripe-webhook'),
]
