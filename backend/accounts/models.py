from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class Organization(models.Model):
    """
    Organization model for grouping users and managing subscriptions.
    """
    name = models.CharField(_("Organization Name"), max_length=255)
    subscription_plan = models.CharField(_("Subscription Plan"), max_length=50, choices=[
        ('explorer', 'Explorer'),
        ('creator', 'Creator'),
        ('master', 'Master'),
    ], default='explorer')
    billing_info = models.JSONField(_("Billing Information"), default=dict, blank=True)
    stripe_customer_id = models.CharField(_("Stripe Customer ID"), max_length=255, blank=True, null=True)
    stripe_subscription_id = models.CharField(_("Stripe Subscription ID"), max_length=255, blank=True, null=True)
    subscription_status = models.CharField(_("Subscription Status"), max_length=50, default='active')
    subscription_period_end = models.DateTimeField(_("Subscription Period End"), null=True, blank=True)
    cancel_at_period_end = models.BooleanField(_("Cancel At Period End"), default=False)
    ai_generations_used = models.IntegerField(_("AI Generations Used This Month"), default=0)
    bonus_ai_generation_credits = models.IntegerField(_("Bonus AI Generation Credits"), default=0, 
                                                     help_text=_("Additional one-time AI generation credits that reset monthly"))
    ai_generations_reset_date = models.DateTimeField(_("AI Generations Reset Date"), null=True, blank=True)
    created_at = models.DateTimeField(_("Created At"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Updated At"), auto_now=True)
    
    class Meta:
        verbose_name = _("Organization")
        verbose_name_plural = _("Organizations")
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_subscription_plan_display(self):
        """Return the display name of the subscription plan."""
        choices = dict(self._meta.get_field('subscription_plan').choices)
        return choices.get(self.subscription_plan, self.subscription_plan)
    
    @property
    def document_limit(self):
        """Return the document limit based on the subscription plan."""
        limits = {
            'explorer': 500,
            'creator': 2000,
            'master': 0,  # Unlimited
        }
        return limits.get(self.subscription_plan, 0)
    
    @property
    def user_limit(self):
        """Return the user limit based on the subscription plan."""
        limits = {
            'explorer': 3,
            'creator': 10,
            'master': 0,  # Unlimited
        }
        return limits.get(self.subscription_plan, 0)
    
    @property
    def base_ai_generation_limit(self):
        """Return the base AI generation limit from the subscription plan without bonus credits."""
        from django.utils import timezone
        
        limits = {
            'explorer': 3,
            'creator': 100,
            'master': 500,
        }
        
        # If the subscription is set to cancel at period end and we're still in the paid period,
        # we should return the higher limit of the paid plan
        if self.cancel_at_period_end and self.subscription_period_end and self.subscription_period_end > timezone.now():
            # Get the subscription events to find the previous plan
            from subscriptions.models import SubscriptionEvent
            
            # Look for a downgrade event
            downgrade_event = SubscriptionEvent.objects.filter(
                organization=self,
                event_type='subscription_cancelled_by_downgrade'
            ).order_by('-created_at').first()
            
            if downgrade_event and downgrade_event.data:
                # The downgrade event should contain the previous plan in the data
                try:
                    # The data might be stored as a string or a dict
                    data = downgrade_event.data
                    if isinstance(data, str):
                        import json
                        data = json.loads(data)
                    
                    # Log the downgrade event data for debugging
                    print(f"Downgrade event data: {data}")
                    
                    # For any downgrade, we should use the higher limit of the previous plan
                    # First, try to find the previous plan from the event data
                    previous_plan = None
                    
                    # Check if we have a comment that indicates the previous plan
                    if 'cancellation_details' in data and 'comment' in data['cancellation_details']:
                        comment = data['cancellation_details']['comment']
                        if 'master' in comment.lower():
                            previous_plan = 'master'
                        elif 'creator' in comment.lower():
                            previous_plan = 'creator'
                    
                    # If we couldn't determine the previous plan from the comment,
                    # use a heuristic based on the current plan
                    if not previous_plan:
                        if self.subscription_plan == 'explorer':
                            # If current plan is explorer, previous was likely creator or master
                            # Default to creator as a safer option
                            previous_plan = 'creator'
                        elif self.subscription_plan == 'creator':
                            # If current plan is creator, previous was likely master
                            previous_plan = 'master'
                    
                    # If we found a previous plan, use its limit
                    if previous_plan and previous_plan in limits:
                        print(f"Using limit from previous plan: {previous_plan} ({limits[previous_plan]})")
                        return limits[previous_plan]
                    
                    # If all else fails, use the highest limit as a fallback
                    # This ensures users don't lose access during the transition
                    highest_limit = max(limits.values())
                    print(f"Using highest limit as fallback: {highest_limit}")
                    return highest_limit
                    
                except Exception as e:
                    print(f"Error getting previous plan from downgrade event: {str(e)}")
                    # In case of error, use the highest limit to ensure users don't lose access
                    highest_limit = max(limits.values())
                    print(f"Using highest limit due to error: {highest_limit}")
                    return highest_limit
        
        # Get the base limit from the subscription plan
        return limits.get(self.subscription_plan, 0)
    
    @property
    def ai_generation_limit(self):
        """Return the base AI generation limit from the subscription plan (for backward compatibility)."""
        return self.base_ai_generation_limit
    
    @property
    def total_ai_generation_limit(self):
        """Return the total AI generation limit including bonus credits."""
        # Base limit + bonus credits
        return self.base_ai_generation_limit + self.bonus_ai_generation_credits
    
    @property
    def ai_generations_remaining(self):
        """Return the number of AI generations remaining this month."""
        limit = self.total_ai_generation_limit
        if limit == 0:  # If limit is 0, it means unlimited
            return 999999  # Use a large number instead of infinity for JSON serialization
        return max(0, limit - self.ai_generations_used)
    
    @property
    def subscription_price(self):
        """Return the subscription price based on the plan."""
        prices = {
            'explorer': 0,  # Free
            'creator': 9,   # $9/month
            'master': 19,   # $19/month
        }
        return prices.get(self.subscription_plan, 0)
    
    def reset_ai_generations_if_needed(self):
        """Reset AI generations count if the reset date has passed."""
        from django.utils import timezone
        
        now = timezone.now()
        if not self.ai_generations_reset_date or now >= self.ai_generations_reset_date:
            # Reset the counter and set the next reset date to the 1st of next month
            self.ai_generations_used = 0
            
            # Reset bonus credits to zero
            self.bonus_ai_generation_credits = 0
            
            # Calculate next month's 1st day
            next_month = now.replace(day=28) + timezone.timedelta(days=4)  # Jump to next month
            next_reset = next_month.replace(day=1)  # Set to 1st of that month
            
            self.ai_generations_reset_date = next_reset
            self.save(update_fields=['ai_generations_used', 'bonus_ai_generation_credits', 'ai_generations_reset_date'])
            
            return True
        return False
    
    def increment_ai_generations_used(self):
        """Increment the AI generations used counter and check if limit is reached."""
        # First check if we need to reset the counter
        self.reset_ai_generations_if_needed()
        
        # Then increment the counter
        self.ai_generations_used += 1
        self.save(update_fields=['ai_generations_used'])
        
        # Return True if we're still under the limit, False if we've reached it
        # Use total_ai_generation_limit to include bonus credits
        return self.ai_generations_used <= self.total_ai_generation_limit or self.base_ai_generation_limit == 0


class User(AbstractUser):
    """
    Custom user model with additional fields.
    """
    # Override the email field to make it unique
    email = models.EmailField(_('email address'), unique=True)
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='users',
        verbose_name=_("Organization"),
        null=True,
        blank=True,
    )
    role = models.CharField(_("Role"), max_length=50, choices=[
        ('admin', 'Administrator'),
        ('editor', 'Editor'),
        ('viewer', 'Viewer'),
    ], default='viewer')
    profile_picture = models.ImageField(
        _("Profile Picture"),
        upload_to='profile_pictures/',
        null=True,
        blank=True
    )
    # Session preferences
    inactivity_timeout = models.IntegerField(
        _("Inactivity Timeout (seconds)"), 
        default=1800,  # 30 minutes default
        help_text=_("Time in seconds before automatic logout due to inactivity")
    )
    stay_logged_in = models.BooleanField(
        _("Stay Logged In"), 
        default=False,
        help_text=_("Whether to keep the user logged in across browser sessions")
    )
    # Email verification
    email_verification_token = models.CharField(
        _("Email Verification Token"),
        max_length=100,
        null=True,
        blank=True,
        help_text=_("Token used for email verification")
    )
    # Marketing consent
    marketing_consent = models.BooleanField(
        _("Marketing Email Consent"),
        default=False,
        help_text=_("Whether the user has consented to receiving marketing emails")
    )
    
    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
    
    def __str__(self):
        return self.email or self.username
    
    @property
    def is_organization_admin(self):
        """Check if the user is an admin of their organization."""
        return self.role == 'admin'
    
    @property
    def can_edit(self):
        """Check if the user has edit permissions."""
        return self.role in ['admin', 'editor']
