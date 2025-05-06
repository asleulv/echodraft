from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, TagViewSet

# Create a router and register our viewsets with it
router = DefaultRouter(trailing_slash=False)
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]
