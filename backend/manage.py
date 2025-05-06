#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from dotenv import load_dotenv

def main():
    """Run administrative tasks."""
    # Load environment variables from the appropriate .env file based on DJANGO_ENV
    env_name = os.getenv('DJANGO_ENV', 'development')
    env_file = os.path.join(os.path.dirname(__file__), f'.env.{env_name}')
    load_dotenv(env_file)
    
    # Set the Django settings module based on DJANGO_ENV environment variable
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'textvault.settings')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
