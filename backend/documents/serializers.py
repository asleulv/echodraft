from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TextDocument, Comment, DocumentPDFExport, StyleConstraint

User = get_user_model()

class CommentSerializer(serializers.ModelSerializer):
    """Serializer for Comment model."""
    
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'document', 'user', 'user_name', 'text',
            'parent', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        """Get the name of the comment author."""
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


class TextDocumentListSerializer(serializers.ModelSerializer):
    """Serializer for listing TextDocument instances."""
    
    created_by_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    category_color = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TextDocument
        fields = [
            'id', 'title', 'plain_text', 'slug', 'created_by', 'created_by_name',
            'organization', 'category', 'category_name', 'category_color', 'tags',
            'version', 'is_latest', 'status', 'created_at', 'updated_at',
            'comment_count'
        ]
        read_only_fields = [
            'id', 'slug', 'plain_text', 'version', 'is_latest', 'created_at', 'updated_at',
            'created_by_name', 'category_name', 'category_color', 'comment_count'
        ]
    
    def get_created_by_name(self, obj):
        """Get the name of the document creator."""
        return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
    
    def get_category_name(self, obj):
        """Get the name of the document category."""
        return obj.category.name if obj.category else None
    
    def get_category_color(self, obj):
        """Get the color of the document category."""
        return obj.category.color if obj.category else None
    
    def get_comment_count(self, obj):
        """Get the number of comments on the document."""
        return obj.comments.count()


class TextDocumentDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed view of TextDocument instances."""
    
    created_by_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    category_color = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = TextDocument
        fields = [
            'id', 'title', 'content', 'slug', 'created_by', 'created_by_name',
            'organization', 'category', 'category_name', 'category_color', 'tags',
            'version', 'parent', 'is_latest', 'status', 'created_at', 'updated_at',
            'comments'
        ]
        read_only_fields = [
            'id', 'slug', 'version', 'is_latest', 'created_at', 'updated_at',
            'created_by_name', 'category_name', 'category_color', 'comments'
        ]
    
    def get_created_by_name(self, obj):
        """Get the name of the document creator."""
        return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
    
    def get_category_name(self, obj):
        """Get the name of the document category."""
        return obj.category.name if obj.category else None
    
    def get_category_color(self, obj):
        """Get the color of the document category."""
        return obj.category.color if obj.category else None


class TextDocumentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating TextDocument instances."""
    
    class Meta:
        model = TextDocument
        fields = [
            'title', 'content', 'organization', 'category', 'tags', 'status'
        ]
    
    def create(self, validated_data):
        """Create and return a new document."""
        user = self.context['request'].user
        validated_data['created_by'] = user
        return super().create(validated_data)


class TextDocumentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating TextDocument instances."""
    
    create_new_version = serializers.BooleanField(default=False, write_only=True)
    
    class Meta:
        model = TextDocument
        fields = [
            'title', 'content', 'category', 'tags', 'status', 'create_new_version'
        ]
    
    def update(self, instance, validated_data):
        """Update and return an existing document."""
        create_new_version = validated_data.pop('create_new_version', False)
        
        if create_new_version:
            # Create a new version
            instance = instance.create_new_version()
            # Update the new version with the validated data
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            return instance
        else:
            # Update the existing document
            return super().update(instance, validated_data)


class DocumentPDFExportSerializer(serializers.ModelSerializer):
    """Serializer for DocumentPDFExport model."""
    
    document_title = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    share_url = serializers.SerializerMethodField()
    expiration_display = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentPDFExport
        fields = [
            'id', 'document', 'document_title', 'created_by', 'created_by_name',
            'uuid', 'created_at', 'expires_at', 'expiration_type', 'expiration_display',
            'pin_protected', 'pin_code', 'share_url'
        ]
        read_only_fields = [
            'id', 'uuid', 'created_at', 'created_by_name', 'document_title', 
            'share_url', 'pin_code', 'expiration_display'
        ]
    
    def get_document_title(self, obj):
        """Get the title of the document."""
        return obj.document.title
    
    def get_created_by_name(self, obj):
        """Get the name of the export creator."""
        return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
    
    def get_share_url(self, obj):
        """Get the shareable URL for the PDF."""
        request = self.context.get('request')
        if request is None:
            return None
        
        # Get the host from the request
        host = request.get_host()
        
        # Determine the protocol (http or https)
        protocol = 'https' if request.is_secure() else 'http'
        
        # Extract the domain part (without port) for the frontend URL
        domain = host.split(':')[0]
        
        # Use the same domain for the frontend, but with the frontend port
        # In development, this is typically 3000 for Next.js
        frontend_port = '3000'
        frontend_host = f"{domain}:{frontend_port}"
        
        # Construct the frontend URL
        frontend_url = f"{protocol}://{frontend_host}"
        
        # Construct the URL for the shared PDF using the frontend route
        return f"{frontend_url}/shared/pdf/{obj.uuid}"
    
    def get_expiration_display(self, obj):
        """Get a human-readable expiration time."""
        if obj.expiration_type == '1h':
            return "1 Hour"
        elif obj.expiration_type == '24h':
            return "24 Hours"
        elif obj.expiration_type == '1w':
            return "1 Week"
        elif obj.expiration_type == '1m':
            return "1 Month"
        elif obj.expiration_type == 'never':
            return "Never Expires"
        return "Unknown"
    
    def create(self, validated_data):
        """Create and return a new PDF export."""
        user = self.context['request'].user
        validated_data['created_by'] = user
        return super().create(validated_data)


class StyleConstraintSerializer(serializers.ModelSerializer):
    """Serializer for StyleConstraint model."""
    
    created_by_name = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()
    reference_document_titles = serializers.SerializerMethodField()
    
    class Meta:
        model = StyleConstraint
        fields = [
            'id', 'name', 'description', 'constraints', 'organization', 'organization_name',
            'created_by', 'created_by_name', 'reference_documents', 'reference_document_titles',
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'created_by_name', 
            'organization_name', 'reference_document_titles'
        ]
    
    def get_created_by_name(self, obj):
        """Get the name of the style constraint creator."""
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_organization_name(self, obj):
        """Get the name of the organization."""
        return obj.organization.name if obj.organization else "Global"
    
    def get_reference_document_titles(self, obj):
        """Get the titles of the reference documents."""
        return [doc.title for doc in obj.reference_documents.all()]
    
    def create(self, validated_data):
        """Create and return a new style constraint."""
        user = self.context['request'].user
        validated_data['created_by'] = user
        
        # Handle reference_documents separately
        reference_documents = validated_data.pop('reference_documents', [])
        
        # Create the style constraint
        style_constraint = super().create(validated_data)
        
        # Add reference documents if provided
        if reference_documents:
            style_constraint.reference_documents.set(reference_documents)
        
        return style_constraint
