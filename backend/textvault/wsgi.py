"""
WSGI config for textvault project.
"""

import os

from django.core.wsgi import get_wsgi_application
from dotenv import load_dotenv
import os

# Load environment variables from the appropriate .env file based on DJANGO_ENV
env_name = os.getenv('DJANGO_ENV', 'development')
env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), f'.env.{env_name}')
load_dotenv(env_file)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'textvault.settings')

application = get_wsgi_application()
