from django.db import models
from django.utils import timezone


class SystemMessage(models.Model):
    """
    Model for system messages that can be displayed on different pages of the application.
    """
    LOCATION_CHOICES = [
        ('dashboard', 'Dashboard'),
        ('subscription', 'Subscription'),
        ('register', 'Register'),
    ]
    
    MESSAGE_TYPE_CHOICES = [
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('success', 'Success'),
        ('error', 'Error'),
    ]
    
    title = models.CharField(max_length=200, blank=True, null=True, 
                            help_text="Optional title for the message")
    message = models.TextField(help_text="The content of the message")
    location = models.CharField(max_length=50, choices=LOCATION_CHOICES,
                               help_text="Where this message should be displayed")
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, 
                                   default='info', help_text="The type of message (affects styling)")
    is_active = models.BooleanField(default=True, 
                                   help_text="Whether this message is currently active")
    disable_functionality = models.BooleanField(default=False,
                                  help_text="Whether to disable the functionality of the page (e.g., disable registration form)")
    start_date = models.DateTimeField(null=True, blank=True, 
                                     help_text="Optional start date for when this message should be displayed")
    end_date = models.DateTimeField(null=True, blank=True, 
                                   help_text="Optional end date for when this message should stop being displayed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "System Message"
        verbose_name_plural = "System Messages"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_location_display()}: {self.title or self.message[:50]}"
    
    def is_valid_timeframe(self):
        """Check if the message is within its valid timeframe."""
        now = timezone.now()
        
        # If no start_date, or start_date is in the past
        start_valid = self.start_date is None or self.start_date <= now
        
        # If no end_date, or end_date is in the future
        end_valid = self.end_date is None or self.end_date >= now
        
        return start_valid and end_valid
    
    @classmethod
    def get_active_message(cls, location):
        """
        Get the active message for a specific location.
        Returns the most recently created active message for the location.
        """
        now = timezone.now()
        
        # Query for active messages at the specified location
        messages = cls.objects.filter(
            location=location,
            is_active=True
        ).order_by('-created_at')
        
        # Filter by date constraints
        for message in messages:
            if message.is_valid_timeframe():
                return message
        
        return None
