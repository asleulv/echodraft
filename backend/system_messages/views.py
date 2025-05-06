from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import SystemMessage
from .serializers import SystemMessageSerializer, SystemMessagePublicSerializer


class SystemMessageViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing system messages.
    Only accessible to admin users.
    """
    queryset = SystemMessage.objects.all()
    serializer_class = SystemMessageSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        """
        Optionally filter by location.
        """
        queryset = SystemMessage.objects.all()
        location = self.request.query_params.get('location', None)
        if location is not None:
            queryset = queryset.filter(location=location)
        return queryset


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_active_message(request, location):
    """
    Get the active message for a specific location.
    This endpoint is public and can be accessed by anyone.
    """
    message = SystemMessage.get_active_message(location)
    
    if message:
        serializer = SystemMessagePublicSerializer(message)
        return Response(serializer.data)
    else:
        return Response(None, status=status.HTTP_204_NO_CONTENT)
