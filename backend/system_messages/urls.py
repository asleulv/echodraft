from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'system-messages', views.SystemMessageViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('active-message/<str:location>/', views.get_active_message, name='active-message'),
]
