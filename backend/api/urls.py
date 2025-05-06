from django.urls import path, include
from rest_framework.routers import DefaultRouter

from accounts.views import OrganizationViewSet, UserViewSet, RegisterView
from accounts.password_reset import PasswordResetRequestView, PasswordResetConfirmView

# Create a router and register our viewsets with it
router = DefaultRouter(trailing_slash=True)
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'users', UserViewSet, basename='user')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Include URLs from other apps
    path('', include('documents.urls')),
    path('', include('categories.urls')),
    # Additional apps will be added as they are implemented
    # path('ratings/', include('ratings.urls')),
    # path('exports/', include('exports.urls')),
    # path('ai/', include('ai.urls')),
    path('subscriptions/', include('subscriptions.urls')),
]
