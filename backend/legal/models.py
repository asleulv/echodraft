from django.db import models
from django.utils import timezone

class LegalDocument(models.Model):
    TYPE_CHOICES = (
        ('terms', 'Terms of Service'),
        ('privacy', 'Privacy Policy'),
    )
    
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, unique=True)
    title = models.CharField(max_length=200)
    content = models.TextField()
    version = models.PositiveIntegerField(default=1)
    effective_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-effective_date']
        
    def __str__(self):
        return f"{self.get_type_display()} v{self.version}"
