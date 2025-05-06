from rest_framework import serializers
from .models import SystemMessage


class SystemMessageSerializer(serializers.ModelSerializer):
    """Serializer for the SystemMessage model."""
    
    class Meta:
        model = SystemMessage
        fields = [
            'id', 'title', 'message', 'location', 'message_type', 
            'is_active', 'disable_functionality', 'start_date', 'end_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SystemMessagePublicSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for public consumption of system messages.
    Only includes fields needed for display.
    """
    
    class Meta:
        model = SystemMessage
        fields = ['id', 'title', 'message', 'message_type', 'disable_functionality']
