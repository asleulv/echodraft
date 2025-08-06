from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from openai import OpenAI
from django.conf import settings

from ..models import TextDocument, AIPromptTemplate
from ..services.content_converter import ContentConverter


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def format_document_with_ai(request):
    """Format existing document content using AI."""
    document_id = request.data.get('document_id')
    formatting_type = request.data.get('formatting_type', 'improve')
    style_guide = request.data.get('style_guide', '')
    
    if not document_id:
        return Response(
            {"detail": "Document ID is required."}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get document
    try:
        document = get_object_or_404(
            TextDocument.objects.filter(organization=request.user.organization),
            id=document_id
        )
    except TextDocument.DoesNotExist:
        return Response(
            {"detail": "Document not found."}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check OpenAI API key
    openai_api_key = settings.OPENAI_API_KEY
    if not openai_api_key:
        return Response(
            {"detail": "OpenAI API key is not configured."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    try:
        client = OpenAI(api_key=openai_api_key)
        
        # Get formatting template
        template = AIPromptTemplate.get_template(
            f'format_{formatting_type}', 
            request.user.organization
        )
        
        if not template:
            return Response(
                {"detail": f"No formatting template found for type: {formatting_type}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert document content to plain text for formatting
        plain_content = ContentConverter.slate_to_html(document.content)
        
        # Prepare prompt
        prompt = template.format(
            content=plain_content,
            style_guide=style_guide or "",
            document_title=document.title
        )
        
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional document formatter."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.3
        )
        
        formatted_content = response.choices[0].message.content.strip()
        
        return Response({
            "formatted_content": formatted_content,
            "original_content": plain_content,
            "formatting_type": formatting_type
        })
        
    except Exception as e:
        return Response(
            {"detail": f"Failed to format document: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
