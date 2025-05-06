"""
Django settings initialization.
This file determines which settings file to load based on the environment.
"""

import os
# We're no longer loading dotenv here since it's handled in the specific settings files

# Determine which settings file to use based on the DJANGO_ENV environment variable
# Default to 'development' if not specified
env_name = os.getenv('DJANGO_ENV', 'development')

if env_name == 'production':
    print("Loading production settings...")
    from .production import *
else:
    print("Loading development settings...")
    from .development import *
