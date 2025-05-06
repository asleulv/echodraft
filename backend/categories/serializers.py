from rest_framework import serializers
from .models import Category, Tag

class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    
    document_count = serializers.SerializerMethodField(read_only=True)
    all_documents_count = serializers.IntegerField(read_only=True)
    full_path = serializers.CharField(read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'slug', 'organization', 'parent',
            'color', 'icon', 'created_at', 'updated_at',
            'document_count', 'all_documents_count', 'full_path'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def get_document_count(self, obj):
        """Get the document count from the annotated field or property."""
        # First try to get the annotated field
        if hasattr(obj, 'documents_count'):
            return obj.documents_count
        # Fall back to the property
        return obj.document_count


class CategoryTreeSerializer(serializers.ModelSerializer):
    """Serializer for Category model with nested children."""
    
    children = serializers.SerializerMethodField()
    document_count = serializers.SerializerMethodField(read_only=True)
    all_documents_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'slug', 'color', 'icon',
            'document_count', 'all_documents_count', 'children'
        ]
    
    def get_document_count(self, obj):
        """Get the document count from the annotated field or property."""
        # First try to get the annotated field
        if hasattr(obj, 'documents_count'):
            return obj.documents_count
        # Fall back to the property
        return obj.document_count
    
    def get_children(self, obj):
        """Get the children of the category."""
        children = obj.children.all()
        return CategoryTreeSerializer(children, many=True).data


class CategoryListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing categories."""
    
    # Map the annotated documents_count to document_count for API consistency
    document_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'slug', 'parent', 'color', 'icon', 'document_count'
        ]
    
    def get_document_count(self, obj):
        """Get the document count from the annotated field or property."""
        # First try to get the annotated field
        if hasattr(obj, 'documents_count'):
            return obj.documents_count
        # Fall back to the property
        return obj.document_count


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model."""
    
    document_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Tag
        fields = [
            'id', 'name', 'slug', 'organization', 'color', 'created_at', 'document_count'
        ]
        read_only_fields = ['id', 'slug', 'created_at']


class TagListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing tags."""
    
    document_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Tag
        fields = [
            'id', 'name', 'slug', 'color', 'document_count'
        ]
