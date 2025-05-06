# Deployment Guide

This document provides instructions for deploying the TextVault application in both development and production environments.

## Environment Configuration

The application uses environment-specific settings and configuration files:

- `textvault/settings/base.py`: Common settings shared between all environments
- `textvault/settings/development.py`: Development-specific settings
- `textvault/settings/production.py`: Production-specific settings
- `.env.development`: Environment variables for development
- `.env.production`: Environment variables for production

## Development Setup

1. **Environment Variables**:
   - Use the `.env.development` file for development environment variables
   - This file should already be configured with sensible defaults

2. **Running the Development Server**:
   ```bash
   # Set the environment to development (this is the default)
   export DJANGO_ENV=development
   
   # Run the development server
   python manage.py runserver
   
   # Or to make the server accessible from other devices on the network:
   python manage.py runserver 0.0.0.0:8000
   ```

3. **Database**:
   - By default, development uses SQLite
   - To use PostgreSQL, update the `DATABASE_URL` in `.env.development`

## Production Deployment

1. **Environment Variables**:
   - Copy `.env.production` to your production server
   - Update all placeholder values with actual production credentials
   - Ensure all required variables are set

2. **Critical Production Settings**:
   - Generate a secure `SECRET_KEY` (do not use the development key)
   - Set `ALLOWED_HOSTS` to your production domain(s)
   - Configure a production database (PostgreSQL recommended)
   - Set up proper email settings
   - Configure Stripe with production API keys
   - Set up Redis for Celery if using background tasks

3. **Running in Production**:
   ```bash
   # Set the environment to production
   export DJANGO_ENV=production
   
   # Collect static files
   python manage.py collectstatic --no-input
   
   # Run migrations
   python manage.py migrate
   
   # Start the production server with Gunicorn
   gunicorn textvault.wsgi:application
   ```

4. **Web Server Configuration**:
   - Set up Nginx or Apache as a reverse proxy
   - Configure SSL/TLS certificates
   - Set up proper static file serving

## Security Checklist

Before going live, ensure:

- Debug mode is disabled (`DEBUG=False`)
- A strong, unique `SECRET_KEY` is set
- Database credentials are secure
- All API keys are production keys, not test keys
- SSL/TLS is properly configured
- CORS settings are properly restricted
- Email is properly configured
- Database backups are set up

## Environment Variables Reference

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| SECRET_KEY | Django secret key | `your-secure-key` |
| ALLOWED_HOSTS | Comma-separated list of allowed hosts | `example.com,www.example.com` |
| DATABASE_URL | Database connection string | `postgres://user:pass@host:5432/dbname` |
| CORS_ALLOWED_ORIGINS | Allowed CORS origins | `https://example.com` |
| OPENAI_API_KEY | OpenAI API key | `sk_...` |
| STRIPE_PUBLIC_KEY | Stripe public key | `pk_live_...` |
| STRIPE_SECRET_KEY | Stripe secret key | `sk_live_...` |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret | `whsec_...` |
| EMAIL_HOST | SMTP host | `smtp.example.com` |
| EMAIL_HOST_USER | SMTP username | `user@example.com` |
| EMAIL_HOST_PASSWORD | SMTP password | `password` |
| DEFAULT_FROM_EMAIL | Default sender email | `noreply@example.com` |
| FRONTEND_URL | Frontend application URL | `https://example.com` |

## Switching Between Environments

To switch between development and production environments:

### Unix/Linux/macOS:

```bash
# For development
export DJANGO_ENV=development

# For production
export DJANGO_ENV=production
```

### Windows (Command Prompt):

```cmd
# For development
set DJANGO_ENV=development

# For production
set DJANGO_ENV=production
```

### Windows (PowerShell):

```powershell
# For development
$env:DJANGO_ENV = "development"

# For production
$env:DJANGO_ENV = "production"
```

The application will automatically load the appropriate settings based on the `DJANGO_ENV` environment variable.

## Testing Production Settings Locally

You can test the production settings locally without having to set up all the production infrastructure by using the `DJANGO_TESTING` environment variable:

### Unix/Linux/macOS:

```bash
# Enable testing mode for production settings
export DJANGO_ENV=production
export DJANGO_TESTING=true
python manage.py runserver

# Or to make the server accessible from other devices on the network:
python manage.py runserver 0.0.0.0:8000
```

### Windows (Command Prompt):

```cmd
# Enable testing mode for production settings
set DJANGO_ENV=production
set DJANGO_TESTING=true
python manage.py runserver

# Or to make the server accessible from other devices on the network:
python manage.py runserver 0.0.0.0:8000
```

### Windows (PowerShell):

```powershell
# Enable testing mode for production settings
$env:DJANGO_ENV = "production"
$env:DJANGO_TESTING = "true"
python manage.py runserver

# Or to make the server accessible from other devices on the network:
python manage.py runserver 0.0.0.0:8000
```

When `DJANGO_TESTING` is set to `true`, the production settings will:

1. Use SQLite instead of requiring a PostgreSQL database
2. Disable strict security settings that would prevent local testing
3. Use console email backend instead of requiring SMTP setup
4. Provide dummy values for required API keys
5. Enable DEBUG mode for easier troubleshooting

This allows you to test your production configuration without needing to set up all the production infrastructure.

**Important**: Never use `DJANGO_TESTING=true` in a real production environment!
