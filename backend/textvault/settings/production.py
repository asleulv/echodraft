"""
Django production settings for textvault project.
These settings are specific to the production environment.
"""

import os
import dj_database_url
from dotenv import load_dotenv
from .base import *

print("Starting to load production settings...")

# Load environment variables from .env.production file
env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env.production')
load_dotenv(env_file)

# Note: We're no longer falling back to .env to ensure consistent environment settings
# If you need shared settings, consider moving them to .env.production

# Check if we're in a testing environment
IS_TESTING = os.getenv('DJANGO_TESTING', 'False').lower() == 'true'

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY and not IS_TESTING:
    raise ValueError("No SECRET_KEY set for production environment")
elif not SECRET_KEY and IS_TESTING:
    SECRET_KEY = 'django-insecure-testing-key-not-for-real-production'
    print("WARNING: Using insecure testing key")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = IS_TESTING  # Only enable debug in testing mode

# Set allowed hosts from environment variable
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')
if (not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']) and not IS_TESTING:
    raise ValueError("ALLOWED_HOSTS is not set for production environment")
elif (not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']) and IS_TESTING:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']
    print(f"WARNING: Using default allowed hosts for testing: {ALLOWED_HOSTS}")

# Production security settings
# Check if we're in a testing environment
IS_TESTING = os.getenv('DJANGO_TESTING', 'False').lower() == 'true'

if not IS_TESTING:
    # Only apply these settings in a real production environment
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "None"
    CSRF_COOKIE_SAMESITE = "None"
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
else:
    # For testing production settings locally
    print("Running in testing mode - security settings relaxed")

print("Loading database settings...")
# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL', 'sqlite:///db.sqlite3'),
        conn_max_age=600
    )
}
print("Database settings loaded...")

# CORS settings
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Restrict to specified origins in production
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cache-control',
    'pragma',
]

# JWT settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 15))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}

# OpenAI settings
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY and not IS_TESTING:
    raise ValueError("OPENAI_API_KEY is not set for production environment")
elif not OPENAI_API_KEY and IS_TESTING:
    OPENAI_API_KEY = 'sk-test-key-for-development-only'
    print("WARNING: Using dummy OpenAI API key for testing")

# Anthropic settings
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

# Stripe settings
STRIPE_PUBLIC_KEY = os.getenv('STRIPE_PUBLIC_KEY')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')
if not (STRIPE_PUBLIC_KEY and STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET) and not IS_TESTING:
    raise ValueError("Stripe API keys are not set for production environment")
elif not (STRIPE_PUBLIC_KEY and STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET) and IS_TESTING:
    STRIPE_PUBLIC_KEY = 'pk_test_dummy'
    STRIPE_SECRET_KEY = 'sk_test_dummy'
    STRIPE_WEBHOOK_SECRET = 'whsec_dummy'
    print("WARNING: Using dummy Stripe API keys for testing")

# Stripe Price IDs
STRIPE_PRICE_EXPLORER = os.getenv('STRIPE_PRICE_EXPLORER')
STRIPE_PRICE_CREATOR = os.getenv('STRIPE_PRICE_CREATOR')
STRIPE_PRICE_MASTER = os.getenv('STRIPE_PRICE_MASTER')

# Celery settings
if IS_TESTING:
    # Use a dummy broker URL for testing
    CELERY_BROKER_URL = 'memory://'
    CELERY_RESULT_BACKEND = 'memory://'
    print("WARNING: Using in-memory Celery broker for testing")
else:
    CELERY_BROKER_URL = os.getenv('REDIS_URL')
    CELERY_RESULT_BACKEND = os.getenv('REDIS_URL')

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Email settings
if IS_TESTING:
    # Use console backend for testing
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    EMAIL_HOST = 'localhost'
    EMAIL_HOST_USER = ''
    EMAIL_HOST_PASSWORD = ''
    DEFAULT_FROM_EMAIL = 'testing@example.com'
    print("WARNING: Using console email backend for testing")
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.getenv('EMAIL_HOST')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
    EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
    DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL')
    
    if not (EMAIL_HOST and EMAIL_HOST_USER and EMAIL_HOST_PASSWORD and DEFAULT_FROM_EMAIL):
        raise ValueError("Email settings are not properly configured for production")

CONTACT_EMAIL = os.getenv('CONTACT_EMAIL', 'hello@echodraft.app')

# Frontend URL for links in emails
FRONTEND_URL = os.getenv('FRONTEND_URL')
if not FRONTEND_URL and not IS_TESTING:
    raise ValueError("FRONTEND_URL is not set for production environment")
elif not FRONTEND_URL and IS_TESTING:
    FRONTEND_URL = 'http://localhost:3000'
    print(f"WARNING: Using default frontend URL for testing: {FRONTEND_URL}")

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/django-error.log'),
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}

# Ensure logs directory exists
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)

print("Production settings completely loaded!")
