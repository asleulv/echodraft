"""
Django settings for textvault project.
This file is a wrapper that imports from the new settings structure.
"""

import os
from pathlib import Path
# We're no longer loading dotenv here since it's handled in the specific settings files

# Determine which settings file to use based on the DJANGO_ENV environment variable
# Default to 'development' if not specified
env_name = os.getenv('DJANGO_ENV', 'development')

if env_name == 'production':
    print("Loading production settings...")
    from .settings.production import *
else:
    print("Loading development settings...")
    from .settings.development import *
