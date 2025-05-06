from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Organization

User = get_user_model()

class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for Organization model."""
    
    subscription_plan_display = serializers.SerializerMethodField()
    ai_generations_remaining = serializers.ReadOnlyField()
    subscription_price = serializers.ReadOnlyField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'subscription_plan', 'subscription_plan_display',
            'subscription_status', 'subscription_period_end', 'cancel_at_period_end',
            'ai_generations_used', 'ai_generation_limit', 'ai_generations_remaining',
            'subscription_price', 'document_limit', 'user_limit',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'document_limit', 'user_limit',
            'ai_generation_limit', 'ai_generations_used', 'ai_generations_remaining',
            'subscription_price', 'subscription_plan_display', 'cancel_at_period_end'
        ]
    
    def get_subscription_plan_display(self, obj):
        """Get the display name of the subscription plan."""
        return obj.get_subscription_plan_display()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    organization_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'organization', 'organization_name', 'role', 'profile_picture',
            'is_organization_admin', 'can_edit', 'date_joined', 'marketing_consent'
        ]
        read_only_fields = ['id', 'date_joined', 'is_organization_admin', 'can_edit']
    
    def get_organization_name(self, obj):
        """Get the name of the user's organization."""
        return obj.organization.name if obj.organization else None


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new user."""
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    marketing_consent = serializers.BooleanField(required=False, default=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm', 'organization', 'role',
            'marketing_consent'
        ]
    
    def validate_email(self, value):
        """Validate that the email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        """Create and return a new user."""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing password."""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        """Validate that new passwords match."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'profile_picture', 'marketing_consent'
        ]
    
    def validate_email(self, value):
        """Validate that the email is unique."""
        user = self.context['request'].user
        
        # Check if another user already has this email
        if User.objects.exclude(id=user.id).filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return value
