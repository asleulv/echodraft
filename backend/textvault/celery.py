"""
Celery configuration for textvault project.
"""

import os
from celery import Celery
from dotenv import load_dotenv
import os

# Load environment variables from the appropriate .env file based on DJANGO_ENV
env_name = os.getenv('DJANGO_ENV', 'development')
env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), f'.env.{env_name}')
load_dotenv(env_file)

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'textvault.settings')

app = Celery('textvault')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
