from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Organization

User = get_user_model()

class OrganizationModelTests(TestCase):
    """Test the Organization model."""
    
    def test_organization_creation(self):
        """Test creating an organization."""
        organization = Organization.objects.create(
            name='Test Organization',
            subscription_plan='basic'
        )
        self.assertEqual(organization.name, 'Test Organization')
        self.assertEqual(organization.subscription_plan, 'basic')
        self.assertEqual(organization.document_limit, 500)
        self.assertEqual(organization.user_limit, 3)
        self.assertEqual(organization.ai_generation_limit, 50)


class UserModelTests(TestCase):
    """Test the User model."""
    
    def setUp(self):
        self.organization = Organization.objects.create(
            name='Test Organization',
            subscription_plan='basic'
        )
    
    def test_user_creation(self):
        """Test creating a user."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            organization=self.organization,
            role='admin'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.organization, self.organization)
        self.assertEqual(user.role, 'admin')
        self.assertTrue(user.is_organization_admin)
        self.assertTrue(user.can_edit)


class APITests(TestCase):
    """Test the API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.organization = Organization.objects.create(
            name='Test Organization',
            subscription_plan='basic'
        )
        self.admin_user = User.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='adminpass123',
            organization=self.organization,
            role='admin'
        )
        self.regular_user = User.objects.create_user(
            username='regularuser',
            email='regular@example.com',
            password='regularpass123',
            organization=self.organization,
            role='viewer'
        )
    
    def test_user_login(self):
        """Test user login and token generation."""
        response = self.client.post('/api/auth/token/', {
            'username': 'adminuser',
            'password': 'adminpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_user_me_endpoint(self):
        """Test the me endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/v1/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'adminuser')
        self.assertEqual(response.data['email'], 'admin@example.com')
        self.assertEqual(response.data['organization'], self.organization.id)
        self.assertEqual(response.data['role'], 'admin')
