from django.urls import path
from .email_verification import EmailVerificationView

urlpatterns = [
    path('', EmailVerificationView.as_view(), name='verify-email'),
]
