from django.db import models
from django.utils.translation import gettext_lazy as _

class EmailTemplate(models.Model):
    """
    Model to store email templates that can be edited through the admin interface.
    """
    TEMPLATE_TYPES = (
        ('welcome', _('Welcome Email')),
        ('subscription_confirmation', _('Subscription Confirmation')),
        ('password_reset', _('Password Reset')),
    )
    
    name = models.CharField(_('Template Name'), max_length=100)
    template_type = models.CharField(_('Template Type'), max_length=50, choices=TEMPLATE_TYPES, unique=True)
    subject = models.CharField(_('Email Subject'), max_length=255)
    html_content = models.TextField(_('HTML Content'), help_text=_('HTML content of the email. Use {{ variable }} for template variables.'))
    plain_content = models.TextField(_('Plain Text Content'), help_text=_('Plain text version of the email. Use {{ variable }} for template variables.'))
    is_active = models.BooleanField(_('Active'), default=True)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('Email Template')
        verbose_name_plural = _('Email Templates')
    
    def __str__(self):
        return self.name
