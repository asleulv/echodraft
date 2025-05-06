"""
URL configuration for textvault project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from django.views.decorators.csrf import csrf_exempt
from documents.ai_views import generate_document_with_ai
from subscriptions import views as subscription_views
from .webhook_handler import root_webhook_handler

# API documentation schema
schema_view = get_schema_view(
    openapi.Info(
        title="TextVault API",
        default_version='v1',
        description="API for TextVault - Text archiving, rating, and AI generation system",
        terms_of_service="https://www.textvault.com/terms/",
        contact=openapi.Contact(email="contact@textvault.com"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Root webhook handler for Stripe
    path('', root_webhook_handler, name='root-webhook-handler'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Direct AI document generation endpoint
    path('api/v1/documents/generate-with-ai', csrf_exempt(generate_document_with_ai), name='generate-document-with-ai'),
    
    # API endpoints
    path('api/v1/', include('api.urls')),
    path('api/v1/legal/', include('legal.urls')),
    path('api/v1/contact/', include('contact.urls')),
    path('api/v1/subscriptions/', include('subscriptions.urls')),
    path('api/v1/system-messages/', include('system_messages.urls')),
    
    # Stripe webhook endpoint (bypasses CSRF protection)
    path('api/v1/stripe/webhook/', csrf_exempt(subscription_views.StripeWebhookView.as_view({'post': 'webhook'})), name='stripe-webhook'),
    
# JWT authentication
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Email verification
    path('api/v1/verify-email/<str:token>/', include('accounts.email_verification_urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
