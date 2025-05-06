from django.urls import path
from . import views

urlpatterns = [
    path('send-email/', views.send_contact_email, name='send-contact-email'),
]
