from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'documents', views.LegalDocumentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('document/<str:doc_type>/', views.get_legal_document, name='get-legal-document'),
]
