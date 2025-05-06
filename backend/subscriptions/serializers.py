from rest_framework import serializers
from .models import SubscriptionPlan, SubscriptionEvent, AIGenerationUsage

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for SubscriptionPlan model."""
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'display_name', 'description', 'price', 
            'currency', 'interval', 'ai_generation_limit', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class SubscriptionEventSerializer(serializers.ModelSerializer):
    """Serializer for SubscriptionEvent model."""
    
    class Meta:
        model = SubscriptionEvent
        fields = [
            'id', 'organization', 'event_type', 'stripe_event_id', 
            'data', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class AIGenerationUsageSerializer(serializers.ModelSerializer):
    """Serializer for AIGenerationUsage model."""
    
    class Meta:
        model = AIGenerationUsage
        fields = [
            'id', 'organization', 'month', 'count', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
