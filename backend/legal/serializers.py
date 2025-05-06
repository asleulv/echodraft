from rest_framework import serializers
from .models import LegalDocument

class LegalDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalDocument
        fields = ['id', 'type', 'title', 'content', 'version', 'effective_date', 'updated_at']
        read_only_fields = ['id', 'updated_at']
