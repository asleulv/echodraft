from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Organization

User = get_user_model()

class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for Organization model."""
    
    total_credits_available = serializers.ReadOnlyField()
    has_credits = serializers.ReadOnlyField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'billing_info', 'stripe_customer_id',
            'ai_credits_balance', 'bonus_ai_generation_credits', 
            'ai_credits_purchased_total', 'total_credits_available', 
            'has_credits', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'total_credits_available', 
            'has_credits'
        ]



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

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer with better error messages for unverified accounts.
    """
    
    def validate(self, attrs):
        # Get username/email and password from request - try multiple field names
        username = attrs.get(self.username_field) or attrs.get('email') or attrs.get('username')
        password = attrs.get('password')
        
        if not username or not password:
            raise serializers.ValidationError({
                'detail': 'Email and password are required.',
                'error_type': 'missing_credentials'
            })
        
        # Check if user exists and handle unverified accounts
        try:
            # Try multiple ways to find the user
            user = None
            try:
                user = User.objects.get(email=username)
            except User.DoesNotExist:
                try:
                    user = User.objects.get(username=username)
                except User.DoesNotExist:
                    pass
            
            if not user:
                raise serializers.ValidationError({
                    'detail': 'Invalid email or password.',
                    'error_type': 'invalid_credentials'
                })
            
            # Check if user exists but is inactive (unverified email)
            if not user.is_active:
                if hasattr(user, 'email_verification_token') and user.email_verification_token:
                    raise serializers.ValidationError({
                        'detail': 'Please verify your email before logging in. Check your inbox for the verification link.',
                        'error_type': 'email_not_verified'
                    })
                else:
                    raise serializers.ValidationError({
                        'detail': 'Your account is inactive. Please contact support.',
                        'error_type': 'account_inactive'
                    })
            
            # Check password
            if not user.check_password(password):
                raise serializers.ValidationError({
                    'detail': 'Invalid email or password.',
                    'error_type': 'invalid_credentials'
                })
                
        except serializers.ValidationError:
            # Re-raise our custom validation errors
            raise
        except Exception as e:
            raise serializers.ValidationError({
                'detail': 'Invalid email or password.',
                'error_type': 'invalid_credentials'
            })
        
        # Continue with normal JWT validation
        return super().validate(attrs)


