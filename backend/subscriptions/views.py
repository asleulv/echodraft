import stripe
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.urls import reverse
from django.http import HttpResponse
from emails.utils import send_subscription_confirmation_email

from .models import SubscriptionPlan
from .serializers import SubscriptionPlanSerializer
from accounts.permissions import IsSameOrganization

# Configure Stripe API key
stripe.api_key = settings.STRIPE_SECRET_KEY

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing subscription plans."""
    
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        """List all active subscription plans."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class OrganizationSubscriptionViewSet(viewsets.ViewSet):
    """ViewSet for managing organization subscriptions."""
    
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    
    def list(self, request):
        """Get the current organization's subscription."""
        organization = request.user.organization
        if not organization:
            return Response(
                {"detail": "User does not belong to an organization."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Return subscription details
        return Response([{
            'id': organization.id,
            'subscription_plan': organization.subscription_plan,
            'subscription_plan_display': organization.get_subscription_plan_display(),
            'subscription_status': organization.subscription_status,
            'subscription_period_end': organization.subscription_period_end,
            'cancel_at_period_end': organization.cancel_at_period_end,
            'ai_generations_used': organization.ai_generations_used,
            'ai_generation_limit': organization.ai_generation_limit,
            'ai_generations_remaining': organization.ai_generations_remaining,
            'subscription_price': organization.subscription_price
        }])
    
    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """Create a checkout session for subscription upgrade."""
        try:
            # Get the plan ID from the request
            plan_id = request.data.get('plan_id')
            if not plan_id:
                return Response(
                    {"detail": "Plan ID is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the plan from the database
            try:
                plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
            except SubscriptionPlan.DoesNotExist:
                return Response(
                    {"detail": "Invalid plan ID."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the organization
            organization = request.user.organization
            if not organization:
                return Response(
                    {"detail": "User does not belong to an organization."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get success and cancel URLs
            success_url = request.data.get('success_url', request.build_absolute_uri('/subscription?success=true'))
            cancel_url = request.data.get('cancel_url', request.build_absolute_uri('/subscription?canceled=true'))
            
            # Create or get Stripe customer
            if organization.stripe_customer_id:
                customer = stripe.Customer.retrieve(organization.stripe_customer_id)
            else:
                # Create a new customer
                customer = stripe.Customer.create(
                    email=request.user.email,
                    name=organization.name,
                    metadata={
                        'organization_id': organization.id
                    }
                )
                # Save the customer ID
                organization.stripe_customer_id = customer.id
                organization.save(update_fields=['stripe_customer_id'])
            
            # Check if this is a downgrade (moving to a cheaper plan)
            current_plan_price = 0
            if organization.subscription_plan != 'explorer':
                try:
                    current_plan = SubscriptionPlan.objects.get(name=organization.subscription_plan)
                    current_plan_price = current_plan.price
                except SubscriptionPlan.DoesNotExist:
                    print(f"Could not find current plan {organization.subscription_plan}")
            
            is_downgrade = plan.price < current_plan_price
            is_paid_to_paid_downgrade = is_downgrade and plan.price > 0 and current_plan_price > 0
            print(f"Plan change: {organization.subscription_plan} ({current_plan_price}) -> {plan.name} ({plan.price}), is_downgrade: {is_downgrade}, is_paid_to_paid_downgrade: {is_paid_to_paid_downgrade}")
            
            # Prevent downgrades between paid plans
            if is_paid_to_paid_downgrade:
                return Response({
                    'error': 'To downgrade to a lower-tier paid plan, you need to cancel your current subscription first. Once it expires, you can subscribe to the lower-tier plan.',
                    'requires_cancellation': True,
                    'current_plan': organization.subscription_plan,
                    'target_plan': plan.name
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # For the free plan or any downgrade, we don't need to create a checkout session
            if plan.price == 0 or is_downgrade:
                # Check if the organization has an active subscription that needs to be canceled
                existing_subscription_id = organization.stripe_subscription_id
                
                if existing_subscription_id:
                    from .models import SubscriptionEvent
                    try:
                        print(f"Attempting to retrieve subscription {existing_subscription_id} for organization {organization.id}")
                        
                        # Safely retrieve the existing subscription with error handling
                        try:
                            # Retrieve the existing subscription
                            existing_subscription = stripe.Subscription.retrieve(existing_subscription_id)
                            
                            # Only cancel if the subscription is active
                            if existing_subscription.status not in ['canceled', 'incomplete_expired']:
                                print(f"Canceling subscription {existing_subscription_id} for organization {organization.id} due to downgrade")
                                
                                try:
                                    # Verify the subscription ID before making API calls
                                    print(f"Verifying subscription ID: {existing_subscription_id}")
                                    if not existing_subscription_id or not isinstance(existing_subscription_id, str) or not existing_subscription_id.startswith('sub_'):
                                        print(f"WARNING: Invalid subscription ID format: {existing_subscription_id}")
                                    
                                    # Cancel the subscription at period end to avoid immediate cancellation
                                    # This allows the user to continue using their paid plan until the end of the current billing period
                                    print(f"Calling Stripe API to set cancel_at_period_end=True for subscription {existing_subscription_id}")
                                    
                                    # Add explicit response handling
                                    modified_subscription = stripe.Subscription.modify(
                                        existing_subscription_id,
                                        cancel_at_period_end=True,
                                        expand=['items']  # Expand items to get more details
                                    )
                                    
                                    # Log the response from Stripe
                                    print(f"Stripe API response - subscription {modified_subscription.id}:")
                                    print(f"  Status: {modified_subscription.status}")
                                    print(f"  Cancel at period end: {modified_subscription.cancel_at_period_end}")
                                    print(f"  Current period end: {modified_subscription.current_period_end}")
                                    
                                    # Verify the modification was successful
                                    if not modified_subscription.cancel_at_period_end:
                                        print(f"WARNING: Stripe did not set cancel_at_period_end to True for subscription {existing_subscription_id}")
                                        # Try again with a different approach
                                        print(f"Attempting alternative approach with cancellation_details")
                                        modified_subscription = stripe.Subscription.modify(
                                            existing_subscription_id,
                                            cancel_at_period_end=True,
                                            cancellation_details={
                                                'feedback': 'customer_service',
                                                'comment': f'Customer downgraded from {organization.subscription_plan} plan to {plan.name} plan'
                                            }
                                        )
                                        print(f"Second attempt result - cancel_at_period_end: {modified_subscription.cancel_at_period_end}")
                                    
                                    # Create a subscription event
                                    SubscriptionEvent.objects.create(
                                        organization=organization,
                                        event_type='subscription_cancelled_by_downgrade',
                                        stripe_event_id=f"manual_downgrade_{existing_subscription_id}",
                                        data={
                                            'subscription_id': existing_subscription_id,
                                            'new_plan': plan.name,
                                            'cancellation_details': {
                                                'feedback': 'customer_service',
                                                'comment': f'Customer downgraded from {organization.subscription_plan} plan to {plan.name} plan'
                                            },
                                            'previous_plan': organization.subscription_plan,
                                            'new_plan': plan.name
                                        }
                                    )
                                    
                                    # Update the organization's subscription fields
                                    # Store the previous plan name for reference
                                    previous_plan = organization.subscription_plan
                                    
                                    # For downgrades between paid plans, we want to keep the current plan active
                                    # until the end of the billing period, but we need to store the new plan
                                    # somewhere so we know what to change to when the subscription ends
                                    
                                    # We'll store the target plan in the metadata of the subscription event
                                    # but keep the current plan active in the organization
                                    target_plan = plan.name
                                    
                                    # Update the plan immediately, but keep the higher tier features active
                                    # until the end of the billing period through the ai_generation_limit property
                                    organization.subscription_plan = plan.name  # Change the plan now
                                    organization.subscription_status = 'active'
                                    organization.cancel_at_period_end = True
                                    
                                    # Log the plan change
                                    print(f"Downgrading organization {organization.id} from {previous_plan} to {target_plan} (will take effect at period end)")
                                    
                                    # Convert timestamp to timezone-aware datetime
                                    from django.utils import timezone
                                    from datetime import datetime
                                    
                                    # Safely access current_period_end, which could be an attribute or a dictionary key
                                    current_period_end = None
                                    try:
                                        if hasattr(existing_subscription, 'current_period_end'):
                                            current_period_end = existing_subscription.current_period_end
                                        elif isinstance(existing_subscription, dict) and 'current_period_end' in existing_subscription:
                                            current_period_end = existing_subscription['current_period_end']
                                        
                                        if current_period_end:
                                            # Make sure we have a timezone-aware datetime
                                            period_end_datetime = datetime.fromtimestamp(current_period_end)
                                            organization.subscription_period_end = timezone.make_aware(period_end_datetime, timezone=timezone.get_current_timezone())
                                        else:
                                            # If we can't get the period end, set it to 30 days from now
                                            organization.subscription_period_end = timezone.now() + timezone.timedelta(days=30)
                                            print(f"Could not determine subscription period end, setting to 30 days from now")
                                    except Exception as e:
                                        print(f"Error setting subscription period end: {str(e)}")
                                        # Set a default period end date
                                        organization.subscription_period_end = timezone.now() + timezone.timedelta(days=30)
                                        print(f"Setting default subscription period end to 30 days from now")
                                    # Debug the organization object before saving
                                    print(f"DEBUG: Organization before save - plan: {organization.subscription_plan}, status: {organization.subscription_status}, cancel_at_period_end: {organization.cancel_at_period_end}")
                                    
                                    # Use a transaction to ensure the changes are committed
                                    from django.db import transaction
                                    with transaction.atomic():
                                        # Make sure subscription_plan is included in update_fields
                                        organization.save(update_fields=[
                                            'subscription_plan', 'subscription_status', 'cancel_at_period_end', 'subscription_period_end'
                                        ])
                                        
                                        # Force a commit by creating a subscription event within the same transaction
                                        from .models import SubscriptionEvent
                                        SubscriptionEvent.objects.create(
                                            organization=organization,
                                            event_type='subscription_plan_changed',
                                            stripe_event_id=f"manual_plan_change_{organization.id}_{plan.name}",
                                            data={
                                                'previous_plan': previous_plan,
                                                'new_plan': plan.name,
                                                'message': f'Subscription plan changed from {previous_plan} to {plan.name}'
                                            }
                                        )
                                    
                                    # Verify the organization object after saving
                                    organization.refresh_from_db()
                                    print(f"DEBUG: Organization after save - plan: {organization.subscription_plan}, status: {organization.subscription_status}, cancel_at_period_end: {organization.cancel_at_period_end}")
                                    
                                    # Return success with more detailed information
                                    return Response({
                                        'success': True,
                                        'message': f'Successfully downgraded to {plan.display_name} plan. Your current plan will remain active until the end of the billing period.',
                                        'redirect_url': success_url,
                                        'downgrade_details': {
                                            'from_plan': previous_plan,  # Use the stored previous plan name
                                            'to_plan': plan.name,
                                            'period_end': organization.subscription_period_end.isoformat() if organization.subscription_period_end else None
                                        }
                                    })
                                except stripe.error.StripeError as modify_error:
                                    print(f"Error modifying subscription during downgrade: {str(modify_error)}")
                                    # Log the error in a subscription event
                                    SubscriptionEvent.objects.create(
                                        organization=organization,
                                        event_type='subscription_cancellation_error',
                                        stripe_event_id=f"manual_downgrade_error_{existing_subscription_id}",
                                        data={
                                            'subscription_id': existing_subscription_id,
                                            'new_plan': plan.name,
                                            'error': str(modify_error)
                                        }
                                    )
                                    # Continue with the downgrade even if there was an error with Stripe
                            else:
                                print(f"Subscription {existing_subscription_id} is already canceled or expired (status: {existing_subscription.status})")
                        except stripe.error.InvalidRequestError as e:
                            # This happens if the subscription doesn't exist anymore
                            print(f"Subscription {existing_subscription_id} not found or invalid: {str(e)}")
                            # Log the error but continue with the downgrade
                            SubscriptionEvent.objects.create(
                                organization=organization,
                                event_type='subscription_cancellation_error',
                                stripe_event_id=f"manual_downgrade_error_{existing_subscription_id}",
                                data={
                                    'subscription_id': existing_subscription_id,
                                    'new_plan': plan.name,
                                    'error': f"Subscription not found: {str(e)}"
                                }
                            )
                    except stripe.error.StripeError as e:
                        print(f"Stripe error handling subscription during downgrade: {str(e)}")
                        # Log the error but continue with the downgrade
                        SubscriptionEvent.objects.create(
                            organization=organization,
                            event_type='subscription_cancellation_error',
                            stripe_event_id=f"manual_downgrade_error_{existing_subscription_id}",
                            data={
                                'subscription_id': existing_subscription_id,
                                'new_plan': plan.name,
                                'error': str(e)
                            }
                        )
                    except Exception as e:
                        print(f"Unexpected error handling subscription during downgrade: {str(e)}")
                        # Log the error but continue with the downgrade
                        SubscriptionEvent.objects.create(
                            organization=organization,
                            event_type='subscription_cancellation_error',
                            stripe_event_id=f"manual_downgrade_error_{existing_subscription_id}",
                            data={
                                'subscription_id': existing_subscription_id,
                                'new_plan': plan.name,
                                'error': f"Unexpected error: {str(e)}"
                            }
                        )
                
                # If we get here, either there was no subscription to cancel or we had an error but want to continue
                # Update the organization's subscription plan
                print(f"Forcing update of organization {organization.id} to plan {plan.name}")
                organization.subscription_plan = plan.name
                organization.subscription_status = 'active'
                
                # Debug the organization object before saving
                print(f"DEBUG FORCE: Organization before save - plan: {organization.subscription_plan}, status: {organization.subscription_status}")
                
                # Force a direct database update to ensure the changes are persisted
                from django.db import connection, transaction
                with transaction.atomic():
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "UPDATE accounts_organization SET subscription_plan = %s, subscription_status = %s WHERE id = %s",
                            [plan.name, 'active', organization.id]
                        )
                    
                    # Force a commit by creating a subscription event within the same transaction
                    from .models import SubscriptionEvent
                    SubscriptionEvent.objects.create(
                        organization=organization,
                        event_type='subscription_plan_changed_direct',
                        stripe_event_id=f"direct_plan_change_{organization.id}_{plan.name}",
                        data={
                            'previous_plan': organization.subscription_plan,
                            'new_plan': plan.name,
                            'message': f'Subscription plan changed directly from {organization.subscription_plan} to {plan.name}'
                        }
                    )
                
                # Refresh from database to ensure we have the latest data
                organization.refresh_from_db()
                print(f"DEBUG FORCE: Organization after direct update - plan: {organization.subscription_plan}, status: {organization.subscription_status}")
                
                # Return success
                return Response({
                    'success': True,
                    'message': f'Successfully switched to {plan.display_name} plan.',
                    'redirect_url': success_url
                })
            
            # Find or create the Stripe price for this plan
            price = None
            
            # First, try to get the price ID from settings based on the plan name
            if plan.name == 'explorer' and hasattr(settings, 'STRIPE_PRICE_EXPLORER') and settings.STRIPE_PRICE_EXPLORER:
                try:
                    price = stripe.Price.retrieve(settings.STRIPE_PRICE_EXPLORER)
                    print(f"Using environment price ID for explorer plan: {settings.STRIPE_PRICE_EXPLORER}")
                except Exception as e:
                    print(f"Error retrieving explorer price: {str(e)}")
                    price = None
            elif plan.name == 'creator' and hasattr(settings, 'STRIPE_PRICE_CREATOR') and settings.STRIPE_PRICE_CREATOR:
                try:
                    price = stripe.Price.retrieve(settings.STRIPE_PRICE_CREATOR)
                    print(f"Using environment price ID for creator plan: {settings.STRIPE_PRICE_CREATOR}")
                except Exception as e:
                    print(f"Error retrieving creator price: {str(e)}")
                    price = None
            elif plan.name == 'master' and hasattr(settings, 'STRIPE_PRICE_MASTER') and settings.STRIPE_PRICE_MASTER:
                try:
                    price = stripe.Price.retrieve(settings.STRIPE_PRICE_MASTER)
                    print(f"Using environment price ID for master plan: {settings.STRIPE_PRICE_MASTER}")
                except Exception as e:
                    print(f"Error retrieving master price: {str(e)}")
                    price = None
            
            # If we couldn't get the price from environment settings, fall back to the original behavior
            if not price:
                # Try to find the price using lookup keys
                prices = stripe.Price.list(
                    lookup_keys=[f"plan_{plan.name}"],
                    expand=['data.product']
                )
                
                if prices.data:
                    price = prices.data[0]
                else:
                    # Create a product for this plan
                    product = stripe.Product.create(
                        name=plan.display_name,
                        description=plan.description,
                        metadata={
                            'plan_id': plan.id,
                            'plan_name': plan.name
                        }
                    )
                    
                    # Create a price for this product
                    price = stripe.Price.create(
                        product=product.id,
                        unit_amount=int(plan.price * 100),  # Convert to cents
                        currency=plan.currency.lower(),
                        recurring={
                            'interval': plan.interval,
                        },
                        lookup_key=f"plan_{plan.name}",
                        metadata={
                            'plan_id': plan.id,
                            'plan_name': plan.name
                        }
                    )
                    
                    # Store the price ID in the SubscriptionPlan model
                    plan.stripe_price_id = price.id
                    plan.save(update_fields=['stripe_price_id'])
                    
                    print(f"Created new Stripe price {price.id} for plan {plan.name}")
            
            # Check if the organization already has an active subscription
            existing_subscription_id = organization.stripe_subscription_id
            
            
            if existing_subscription_id:
                try:
                    # Retrieve the existing subscription
                    existing_subscription = stripe.Subscription.retrieve(
                        existing_subscription_id,
                        expand=['items.data']
                    )
                    
                    if existing_subscription.status not in ['canceled', 'incomplete_expired']:
                        print(f"Organization {organization.id} has an active subscription {existing_subscription_id}")
                        
                        # Instead of canceling, we'll update the existing subscription
                        # First, get the subscription item ID (usually there's only one item)
                        subscription_item_id = None
                        
                        # Initialize subscription_item_id to None
                        subscription_item_id = None
                        
                        # Safely access the items data
                        try:
                            # Try different ways to access items data
                            if hasattr(existing_subscription, 'items'):
                                if hasattr(existing_subscription.items, 'data'):
                                    items_data = existing_subscription.items.data
                                    if len(items_data) > 0:
                                        subscription_item_id = items_data[0].id
                                elif isinstance(existing_subscription.items, dict) and 'data' in existing_subscription.items:
                                    items_data = existing_subscription.items['data']
                                    if len(items_data) > 0:
                                        subscription_item_id = items_data[0]['id']
                            
                            # If we still can't find items, try a direct API call
                            if not subscription_item_id:
                                items = stripe.SubscriptionItem.list(subscription=existing_subscription_id)
                                if items.data and len(items.data) > 0:
                                    subscription_item_id = items.data[0].id
                                    print(f"Found subscription item {subscription_item_id} using direct API call")
                        except Exception as e:
                            print(f"Error accessing subscription items: {str(e)}")
                            subscription_item_id = None
                        
                        # If we have a subscription item ID, update the existing subscription
                        if subscription_item_id:
                            # Update the subscription with the new price
                            print(f"Updating subscription {existing_subscription_id} to plan {plan.name}")
                            try:
                                updated_subscription = stripe.Subscription.modify(
                                    existing_subscription_id,
                                    items=[{
                                        'id': subscription_item_id,
                                        'price': price.id,
                                    }],
                                    proration_behavior='always_invoice',  # This ensures proper proration and immediate invoice
                                    metadata={
                                        'organization_id': str(organization.id),
                                        'plan_id': str(plan.id),
                                        'plan_name': plan.name
                                    }
                                )
                            except Exception as e:
                                print(f"Error modifying subscription: {str(e)}")
                                # Fall through to creating a new checkout session
                        else:
                            # If the subscription has no items, we need to create a checkout session
                            # instead of trying to create a subscription directly
                            print(f"Subscription {existing_subscription_id} has no items, creating a checkout session")
                            
                            # We'll fall through to the checkout session creation code below
                            # But first, let's mark the old subscription for cancellation after successful checkout
                            # by setting a flag in the metadata
                            
                            # Don't cancel the subscription yet - we'll do that after the checkout is completed
                            # This ensures we don't leave the user without a subscription if the checkout fails
                except stripe.error.StripeError as e:
                    print(f"Error retrieving or updating existing subscription: {str(e)}")
                    # Continue with creating a new subscription if there was an error
            
            # If we don't have an existing subscription or couldn't update it,
            # create a new checkout session
            checkout_session = stripe.checkout.Session.create(
                customer=customer.id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price.id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'organization_id': str(organization.id),
                    'plan_id': str(plan.id),
                    'plan_name': plan.name,
                    'is_new_subscription': 'true'  # Flag to indicate this is a new subscription
                }
            )
            
            # Return the checkout URL
            return Response({
                'checkout_url': checkout_session.url
            })
            
        except stripe.error.StripeError as e:
            # Handle Stripe errors
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Handle other errors
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def portal(self, request):
        """Create a customer portal session for subscription management."""
        try:
            # Get the organization
            organization = request.user.organization
            if not organization:
                return Response(
                    {"detail": "User does not belong to an organization."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if the organization has a Stripe customer ID
            if not organization.stripe_customer_id:
                return Response(
                    {"detail": "Organization does not have a Stripe customer ID."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get return URL
            return_url = request.data.get('return_url', request.build_absolute_uri('/subscription'))
            
            # Create a portal session
            session = stripe.billing_portal.Session.create(
                customer=organization.stripe_customer_id,
                return_url=return_url,
            )
            
            # Return the portal URL
            return Response({
                'portal_url': session.url
            })
            
        except stripe.error.StripeError as e:
            # Handle Stripe errors
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Handle other errors
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Function to handle Stripe events, called from the root webhook handler
def handle_stripe_event(event):
    """
    Handle a verified Stripe webhook event.
    This function is called by the root_webhook_handler after verifying the event signature.
    """
    # Get the event type
    event_type = event['type']
    
    # Handle different event types
    if event_type == 'checkout.session.completed':
        _handle_checkout_session_completed(event)
    elif event_type == 'customer.subscription.updated':
        _handle_subscription_updated(event)
    elif event_type == 'customer.subscription.deleted':
        _handle_subscription_deleted(event)
    elif event_type == 'invoice.payment_succeeded':
        _handle_payment_succeeded(event)
    elif event_type == 'invoice.payment_failed':
        _handle_payment_failed(event)
    elif event_type == 'customer.subscription.created':
        _handle_subscription_created(event)
    elif event_type == 'invoice.finalized':
        _handle_invoice_finalized(event)
    elif event_type == 'invoice.created':
        _handle_invoice_created(event)
    elif event_type == 'invoice.paid':
        _handle_invoice_paid(event)
    else:
        # Log unhandled event types
        print(f"Unhandled event type: {event_type}")

# Helper functions for handling specific event types
def _handle_checkout_session_completed(event):
    """Handle checkout.session.completed event"""
    session = event['data']['object']
    
    # Get the organization ID from the metadata
    organization_id = session.get('metadata', {}).get('organization_id')
    plan_name = session.get('metadata', {}).get('plan_name')
    replace_subscription = session.get('metadata', {}).get('replace_subscription') == 'true'
    
    if organization_id and plan_name:
        from accounts.models import Organization
        from .models import SubscriptionEvent
        
        # Get the organization
        try:
            organization = Organization.objects.get(id=organization_id)
            
            # Check if we need to cancel any existing subscriptions
            if replace_subscription and organization.stripe_subscription_id:
                old_subscription_id = organization.stripe_subscription_id
                if old_subscription_id != session.get('subscription'):  # Don't cancel if it's the same subscription
                    try:
                        # First check if the subscription exists and is active
                        try:
                            old_subscription = stripe.Subscription.retrieve(old_subscription_id)
                            if old_subscription.status not in ['canceled', 'incomplete_expired']:
                                # Cancel the subscription
                                print(f"Canceling old subscription {old_subscription_id} for organization {organization_id}")
                                stripe.Subscription.cancel(
                                    old_subscription_id,
                                    cancellation_details={
                                        'feedback': 'customer_service',
                                        'comment': 'Customer upgraded to a different subscription plan'
                                    }
                                )
                                
                                # Create a subscription event for the cancellation
                                SubscriptionEvent.objects.create(
                                    organization=organization,
                                    event_type='subscription_cancelled_by_upgrade',
                                    stripe_event_id=f"{event['id']}_cancellation",  # Unique ID for this sub-event
                                    data={
                                        'subscription_id': old_subscription_id,
                                        'replaced_by': session.get('subscription'),
                                        'cancellation_details': {
                                            'feedback': 'customer_service',
                                            'comment': 'Customer upgraded to a different subscription plan'
                                        }
                                    }
                                )
                            else:
                                print(f"Old subscription {old_subscription_id} is already canceled or expired")
                        except stripe.error.InvalidRequestError as e:
                            # Subscription doesn't exist or is already canceled
                            print(f"Old subscription {old_subscription_id} not found or already canceled: {str(e)}")
                            
                    except stripe.error.StripeError as e:
                        print(f"Error handling old subscription: {str(e)}")
                        # Log the error but continue with the upgrade process
                        SubscriptionEvent.objects.create(
                            organization=organization,
                            event_type='subscription_cancellation_error',
                            stripe_event_id=f"{event['id']}_cancellation_error",  # Unique ID for this sub-event
                            data={
                                'subscription_id': old_subscription_id,
                                'replaced_by': session.get('subscription'),
                                'error': str(e)
                            }
                        )
                    except Exception as e:
                        # Catch any other exceptions to prevent the webhook from failing
                        print(f"Unexpected error handling old subscription: {str(e)}")
            
            # Update the organization's subscription
            organization.subscription_plan = plan_name
            organization.subscription_status = 'active'
            organization.stripe_subscription_id = session.get('subscription')
            
            # If upgrading to a paid plan, reset the cancel_at_period_end flag
            from .models import SubscriptionPlan
            try:
                plan = SubscriptionPlan.objects.get(name=plan_name)
                if plan.price > 0:  # This is a paid plan
                    print(f"Upgrading to paid plan {plan_name}, resetting cancel_at_period_end flag")
                    organization.cancel_at_period_end = False
                    organization.save(update_fields=[
                        'subscription_plan', 'subscription_status', 'stripe_subscription_id', 'cancel_at_period_end'
                    ])
                else:
                    organization.save(update_fields=[
                        'subscription_plan', 'subscription_status', 'stripe_subscription_id'
                    ])
            except SubscriptionPlan.DoesNotExist:
                # If we can't find the plan, just save without resetting the flag
                organization.save(update_fields=[
                    'subscription_plan', 'subscription_status', 'stripe_subscription_id'
                ])
            
            # Create a subscription event
            SubscriptionEvent.objects.create(
                organization=organization,
                event_type='subscription_created',
                stripe_event_id=event['id'],
                data={
                    'session_id': session.get('id'),
                    'subscription_id': session.get('subscription'),
                    'plan_name': plan_name,
                    'replaces_subscription': replace_subscription
                }
            )
            
            # Send subscription confirmation email to the organization admin
            try:
                # Get the organization admin
                from django.contrib.auth import get_user_model
                User = get_user_model()
                admin_user = User.objects.filter(organization=organization, role='admin').first()
                
                if admin_user:
                    # Get the plan details
                    from .models import SubscriptionPlan
                    try:
                        plan = SubscriptionPlan.objects.get(name=plan_name)
                        # Send the email
                        send_subscription_confirmation_email(
                            admin_user,
                            plan.name,
                            plan.display_name,
                            plan.price,
                            plan.currency
                        )
                    except SubscriptionPlan.DoesNotExist:
                        print(f"Could not find subscription plan {plan_name} for email notification")
            except Exception as e:
                # Log the error but don't prevent the subscription process
                print(f"Error sending subscription confirmation email: {str(e)}")
        except Organization.DoesNotExist:
            # Log the error
            print(f"Organization with ID {organization_id} not found")

def _handle_subscription_updated(event):
    """Handle customer.subscription.updated event"""
    subscription = event['data']['object']
    
    # Get the customer ID
    customer_id = subscription.get('customer')
    
    if customer_id:
        from accounts.models import Organization
        from .models import SubscriptionEvent
        
        # Get the organization
        try:
            organization = Organization.objects.get(stripe_customer_id=customer_id)
            
            # Check if this is a plan change by looking at the metadata
            plan_name = subscription.get('metadata', {}).get('plan_name')
            
            # Get the first subscription item to check the price
            items_data = subscription.get('items', {})
            if isinstance(items_data, dict) and 'data' in items_data:
                items = items_data.get('data', [])
                price_id = None
                if items and len(items) > 0:
                    price_obj = items[0].get('price')
                    if isinstance(price_obj, dict):
                        price_id = price_obj.get('id')
                    elif hasattr(price_obj, 'id'):
                        price_id = price_obj.id
            
            # Check if the organization is already on the free plan due to a downgrade
            if organization.subscription_plan == 'explorer' and organization.cancel_at_period_end:
                print(f"Organization {organization.id} has already downgraded to the free plan. Keeping the free plan.")
                # Don't update the plan, but still update other subscription details
            # If we have a plan name in the metadata, update the organization's plan
            elif plan_name:
                print(f"Updating organization {organization.id} to plan {plan_name} from subscription update event")
                organization.subscription_plan = plan_name
            # If we don't have a plan name but we have a price ID, try to find the plan by price ID
            elif price_id and organization.subscription_plan != 'explorer':
                # Try to find a subscription plan with this price ID
                try:
                    plan = SubscriptionPlan.objects.get(stripe_price_id=price_id)
                    print(f"Found plan {plan.name} for price ID {price_id}")
                    organization.subscription_plan = plan.name
                except SubscriptionPlan.DoesNotExist:
                    print(f"No plan found for price ID {price_id}")
                    
                    # If we can't find the plan by price ID, try to get the subscription directly from Stripe
                    # This is a fallback in case the webhook event has outdated information
                    try:
                        stripe_subscription = stripe.Subscription.retrieve(
                            subscription.get('id'),
                            expand=['items.data.price']
                        )
                        
                        # Check if we have items with prices
                        if hasattr(stripe_subscription, 'items') and hasattr(stripe_subscription.items, 'data'):
                            for item in stripe_subscription.items.data:
                                if hasattr(item, 'price') and hasattr(item.price, 'id'):
                                    stripe_price_id = item.price.id
                                    
                                    # Try to find a plan with this price ID
                                    try:
                                        plan = SubscriptionPlan.objects.get(stripe_price_id=stripe_price_id)
                                        print(f"Found plan {plan.name} for Stripe price ID {stripe_price_id}")
                                        organization.subscription_plan = plan.name
                                        break
                                    except SubscriptionPlan.DoesNotExist:
                                        print(f"No plan found for Stripe price ID {stripe_price_id}")
                                        
                                        # Check if the price has metadata with plan_name
                                        if hasattr(item.price, 'metadata') and hasattr(item.price.metadata, 'plan_name'):
                                            plan_name = item.price.metadata.plan_name
                                            print(f"Using plan name {plan_name} from price metadata")
                                            organization.subscription_plan = plan_name
                                            break
                    except Exception as e:
                        print(f"Error retrieving subscription from Stripe: {str(e)}")
            
            # Check if the subscription has been canceled at period end
            cancel_at_period_end = subscription.get('cancel_at_period_end', False)
            organization.cancel_at_period_end = cancel_at_period_end
            
            # Always update the subscription status and period end
            organization.subscription_status = subscription.get('status')
            
            # If the subscription is canceled at period end, use cancel_at as the period end
            if cancel_at_period_end and subscription.get('cancel_at'):
                from django.utils import timezone
                from datetime import datetime
                try:
                    period_end_datetime = datetime.fromtimestamp(subscription.get('cancel_at'))
                    organization.subscription_period_end = timezone.make_aware(period_end_datetime, timezone=timezone.get_current_timezone())
                except Exception as e:
                    print(f"Error setting subscription period end for cancel_at: {str(e)}")
                    # Set a default period end date
                    organization.subscription_period_end = timezone.now() + timezone.timedelta(days=30)
            else:
                # Convert timestamp to timezone-aware datetime
                from django.utils import timezone
                from datetime import datetime
                try:
                    period_end_datetime = datetime.fromtimestamp(subscription.get('current_period_end'))
                    organization.subscription_period_end = timezone.make_aware(period_end_datetime, timezone=timezone.get_current_timezone())
                except Exception as e:
                    print(f"Error setting subscription period end in _handle_subscription_updated: {str(e)}")
                    # Set a default period end date
                    organization.subscription_period_end = timezone.now() + timezone.timedelta(days=30)
            
            # Save all changes
            organization.save(update_fields=[
                'subscription_plan', 'subscription_status', 'subscription_period_end', 'cancel_at_period_end'
            ])
            
            # Create a subscription event
            SubscriptionEvent.objects.create(
                organization=organization,
                event_type='subscription_updated',
                stripe_event_id=event['id'],
                data={
                    'subscription_id': subscription.get('id'),
                    'status': subscription.get('status'),
                    'current_period_end': subscription.get('current_period_end'),
                    'plan_name': plan_name,
                    'price_id': price_id
                }
            )
        except Organization.DoesNotExist:
            # Log the error
            print(f"Organization with customer ID {customer_id} not found")

def _handle_subscription_deleted(event):
    """Handle customer.subscription.deleted event"""
    subscription = event['data']['object']
    
    # Get the customer ID
    customer_id = subscription.get('customer')
    
    if customer_id:
        from accounts.models import Organization
        from .models import SubscriptionEvent
        
        # Get the organization
        try:
            organization = Organization.objects.get(stripe_customer_id=customer_id)
            
            # Update the organization's subscription
            organization.subscription_status = 'canceled'
            organization.save(update_fields=['subscription_status'])
            
            # Create a subscription event
            SubscriptionEvent.objects.create(
                organization=organization,
                event_type='subscription_cancelled',
                stripe_event_id=event['id'],
                data={
                    'subscription_id': subscription.get('id'),
                    'status': subscription.get('status')
                }
            )
            
            # Downgrade to the free plan
            organization.subscription_plan = 'explorer'
            organization.save(update_fields=['subscription_plan'])
        except Organization.DoesNotExist:
            # Log the error
            print(f"Organization with customer ID {customer_id} not found")

def _handle_payment_succeeded(event):
    """Handle invoice.payment_succeeded event"""
    invoice = event['data']['object']
    
    # Get the customer ID
    customer_id = invoice.get('customer')
    
    if customer_id:
        from accounts.models import Organization
        from .models import SubscriptionEvent
        
        # Get the organization
        try:
            organization = Organization.objects.get(stripe_customer_id=customer_id)
            
            # Update the organization's subscription
            organization.subscription_status = 'active'
            organization.save(update_fields=['subscription_status'])
            
            # Create a subscription event
            SubscriptionEvent.objects.create(
                organization=organization,
                event_type='payment_succeeded',
                stripe_event_id=event['id'],
                data={
                    'invoice_id': invoice.get('id'),
                    'amount_paid': invoice.get('amount_paid'),
                    'subscription_id': invoice.get('subscription')
                }
            )
        except Organization.DoesNotExist:
            # Log the error
            print(f"Organization with customer ID {customer_id} not found")

def _handle_payment_failed(event):
    """Handle invoice.payment_failed event"""
    invoice = event['data']['object']
    
    # Get the customer ID
    customer_id = invoice.get('customer')
    
    if customer_id:
        from accounts.models import Organization
        from .models import SubscriptionEvent
        
        # Get the organization
        try:
            organization = Organization.objects.get(stripe_customer_id=customer_id)
            
            # Update the organization's subscription
            organization.subscription_status = 'past_due'
            organization.save(update_fields=['subscription_status'])
            
            # Create a subscription event
            SubscriptionEvent.objects.create(
                organization=organization,
                event_type='payment_failed',
                stripe_event_id=event['id'],
                data={
                    'invoice_id': invoice.get('id'),
                    'subscription_id': invoice.get('subscription'),
                    'attempt_count': invoice.get('attempt_count')
                }
            )
        except Organization.DoesNotExist:
            # Log the error
            print(f"Organization with customer ID {customer_id} not found")

def _handle_subscription_created(event):
    """Handle customer.subscription.created event"""
    subscription = event['data']['object']
    
    # Get the customer ID
    customer_id = subscription.get('customer')
    
    if customer_id:
        from accounts.models import Organization
        from .models import SubscriptionEvent
        
        # Get the organization
        try:
            organization = Organization.objects.get(stripe_customer_id=customer_id)
            
            # Create a subscription event
            SubscriptionEvent.objects.create(
                organization=organization,
                event_type='subscription_created_event',
                stripe_event_id=event['id'],
                data={
                    'subscription_id': subscription.get('id'),
                    'status': subscription.get('status'),
                    'current_period_end': subscription.get('current_period_end'),
                    'plan': subscription.get('plan', {}).get('nickname', 'Unknown')
                }
            )
            
            # Note: We don't update the organization's subscription here because
            # this event is usually followed by checkout.session.completed which
            # already updates the organization's subscription
            
        except Organization.DoesNotExist:
            # Log the error
            print(f"Organization with customer ID {customer_id} not found")

def _handle_invoice_finalized(event):
    """Handle invoice.finalized event"""
    invoice = event['data']['object']
    
    # Get the customer ID
    customer_id = invoice.get('customer')
    
    if customer_id:
        from accounts.models import Organization
        from .models import SubscriptionEvent
        
        # Get the organization
        try:
            organization = Organization.objects.get(stripe_customer_id=customer_id)
            
            # Create a subscription event
            SubscriptionEvent.objects.create(
                organization=organization,
                event_type='invoice_finalized',
                stripe_event_id=event['id'],
                data={
                    'invoice_id': invoice.get('id'),
                    'amount_due': invoice.get('amount_due'),
                    'subscription_id': invoice.get('subscription')
                }
            )
            
            # No need to update the organization's subscription status for this event
            
        except Organization.DoesNotExist:
            # Log the error
            print(f"Organization with customer ID {customer_id} not found")

def _handle_invoice_created(event):
    """Handle invoice.created event"""
    invoice = event['data']['object']
    
    # Get the customer ID
    customer_id = invoice.get('customer')
    
    if customer_id:
        from accounts.models import Organization
        from .models import SubscriptionEvent
        
        # Get the organization
        try:
            organization = Organization.objects.get(stripe_customer_id=customer_id)
            
            # Create a subscription event
            SubscriptionEvent.objects.create(
                organization=organization,
                event_type='invoice_created',
                stripe_event_id=event['id'],
                data={
                    'invoice_id': invoice.get('id'),
                    'amount_due': invoice.get('amount_due'),
                    'subscription_id': invoice.get('subscription')
                }
            )
            
            # No need to update the organization's subscription status for this event
            
        except Organization.DoesNotExist:
            # Log the error
            print(f"Organization with customer ID {customer_id} not found")

def _handle_invoice_paid(event):
    """Handle invoice.paid event"""
    invoice = event['data']['object']
    
    # Get the customer ID
    customer_id = invoice.get('customer')
    
    if customer_id:
        from accounts.models import Organization
        from .models import SubscriptionEvent
        
        # Get the organization
        try:
            organization = Organization.objects.get(stripe_customer_id=customer_id)
            
            # Create a subscription event
            SubscriptionEvent.objects.create(
                organization=organization,
                event_type='invoice_paid',
                stripe_event_id=event['id'],
                data={
                    'invoice_id': invoice.get('id'),
                    'amount_paid': invoice.get('amount_paid'),
                    'subscription_id': invoice.get('subscription')
                }
            )
            
            # This is similar to payment_succeeded, but we don't update the status
            # since payment_succeeded already does that
            
        except Organization.DoesNotExist:
            # Log the error
            print(f"Organization with customer ID {customer_id} not found")

class StripeWebhookView(viewsets.ViewSet):
    """ViewSet for handling Stripe webhooks."""
    
    permission_classes = []  # No authentication required for webhooks
    
    @action(detail=False, methods=['post'])
    def webhook(self, request):
        """Handle Stripe webhook events."""
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        # Add global try/except to prevent 500 errors
        try:
            # Verify the webhook signature
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
                )
            except ValueError as e:
                # Invalid payload
                print(f"Invalid webhook payload: {str(e)}")
                return HttpResponse(status=400)
            except stripe.error.SignatureVerificationError as e:
                # Invalid signature
                print(f"Invalid webhook signature: {str(e)}")
                return HttpResponse(status=400)
            
            # Check for duplicate events to ensure idempotency
            from .models import SubscriptionEvent
            
            # Check if we've already processed this event
            existing_event = SubscriptionEvent.objects.filter(stripe_event_id=event.id).first()
            if existing_event:
                print(f"Duplicate webhook event received: {event.id} (type: {event.type}). Skipping.")
                return HttpResponse(status=200)  # Return success to avoid Stripe retries
            
            # Handle the event
            if event.type == 'checkout.session.completed':
                # A checkout session was completed
                session = event.data.object
                
                # Get the organization ID from the metadata
                organization_id = session.metadata.get('organization_id')
                plan_name = session.metadata.get('plan_name')
                replace_subscription = session.metadata.get('replace_subscription') == 'true'
                
                if organization_id and plan_name:
                    from accounts.models import Organization
                    from .models import SubscriptionEvent
                    
                    # Get the organization
                    try:
                        organization = Organization.objects.get(id=organization_id)
                        
                        # Check if we need to cancel any existing subscriptions
                        if replace_subscription and organization.stripe_subscription_id:
                            old_subscription_id = organization.stripe_subscription_id
                            if old_subscription_id != session.subscription:  # Don't cancel if it's the same subscription
                                try:
                                    # First check if the subscription exists and is active
                                    try:
                                        old_subscription = stripe.Subscription.retrieve(old_subscription_id)
                                        if old_subscription.status not in ['canceled', 'incomplete_expired']:
                                            # Cancel at period end instead of immediately to avoid billing issues
                                            print(f"Canceling old subscription {old_subscription_id} for organization {organization_id} at period end")
                                            stripe.Subscription.cancel(
                                                old_subscription_id,
                                                cancellation_details={
                                                    'feedback': 'customer_service',
                                                    'comment': 'Customer upgraded to a different subscription plan'
                                                }
                                            )

                                            
                                            # Create a subscription event for the cancellation with the Stripe event ID
                                            SubscriptionEvent.objects.create(
                                                organization=organization,
                                                event_type='subscription_cancelled_by_upgrade',
                                                stripe_event_id=f"{event.id}_cancellation",  # Unique ID for this sub-event
                                                data={
                                                    'subscription_id': old_subscription_id,
                                                    'replaced_by': session.subscription,
                                                    'cancellation_details': {
                                                        'feedback': 'customer_service',
                                                        'comment': 'Customer upgraded to a different subscription plan'
                                                    }
                                                }
                                            )
                                        else:
                                            print(f"Old subscription {old_subscription_id} is already canceled or expired")
                                    except stripe.error.InvalidRequestError as e:
                                        # Subscription doesn't exist or is already canceled
                                        print(f"Old subscription {old_subscription_id} not found or already canceled: {str(e)}")
                                        
                                except stripe.error.StripeError as e:
                                    print(f"Error handling old subscription: {str(e)}")
                                    # Log the error but continue with the upgrade process
                                    SubscriptionEvent.objects.create(
                                        organization=organization,
                                        event_type='subscription_cancellation_error',
                                        stripe_event_id=f"{event.id}_cancellation_error",  # Unique ID for this sub-event
                                        data={
                                            'subscription_id': old_subscription_id,
                                            'replaced_by': session.subscription,
                                            'error': str(e)
                                        }
                                    )
                                except Exception as e:
                                    # Catch any other exceptions to prevent the webhook from failing
                                    print(f"Unexpected error handling old subscription: {str(e)}")
                        
                        # Update the organization's subscription
                        organization.subscription_plan = plan_name
                        organization.subscription_status = 'active'
                        organization.stripe_subscription_id = session.subscription
                        organization.save(update_fields=[
                            'subscription_plan', 'subscription_status', 'stripe_subscription_id'
                        ])
                        
                        # Create a subscription event with the Stripe event ID
                        SubscriptionEvent.objects.create(
                            organization=organization,
                            event_type='subscription_created',
                            stripe_event_id=event.id,
                            data={
                                'session_id': session.id,
                                'subscription_id': session.subscription,
                                'plan_name': plan_name,
                                'replaces_subscription': replace_subscription
                            }
                        )
                    except Organization.DoesNotExist:
                        # Log the error
                        print(f"Organization with ID {organization_id} not found")
            
            elif event.type == 'customer.subscription.updated':
                # A subscription was updated
                subscription = event.data.object
                
                # Get the customer ID
                customer_id = subscription.customer
                
                if customer_id:
                    from accounts.models import Organization
                    from .models import SubscriptionEvent, SubscriptionPlan
                    
                    # Get the organization
                    try:
                        organization = Organization.objects.get(stripe_customer_id=customer_id)
                        
                        # Check if this is a plan change by looking at the metadata
                        plan_name = subscription.metadata.get('plan_name')
                        
                        # Get the first subscription item to check the price
                        price_id = None
                        try:
                            # Try to access items as an attribute
                            if hasattr(subscription, 'items'):
                                items_data = subscription.items
                                # Check if items is a Stripe object with data attribute
                                if hasattr(items_data, 'data') and len(items_data.data) > 0:
                                    item = items_data.data[0]
                                    if hasattr(item, 'price') and hasattr(item.price, 'id'):
                                        price_id = item.price.id
                            # If that fails, try to access items as a dictionary
                            elif isinstance(subscription, dict) and 'items' in subscription:
                                items_data = subscription['items']
                                if isinstance(items_data, dict) and 'data' in items_data:
                                    items = items_data['data']
                                    if items and len(items) > 0:
                                        item = items[0]
                                        if isinstance(item, dict) and 'price' in item:
                                            price_obj = item['price']
                                            if isinstance(price_obj, dict) and 'id' in price_obj:
                                                price_id = price_obj['id']
                            
                            print(f"Found price ID: {price_id}")
                        except Exception as e:
                            print(f"Error extracting price ID from subscription: {str(e)}")
                        
                        # Check if the organization is already on the free plan due to a downgrade
                        if organization.subscription_plan == 'explorer' and organization.cancel_at_period_end:
                            print(f"Organization {organization.id} has already downgraded to the free plan. Keeping the free plan.")
                            # Don't update the plan, but still update other subscription details
                        # If we have a plan name in the metadata, update the organization's plan
                        elif plan_name:
                            print(f"Updating organization {organization.id} to plan {plan_name} from subscription update event")
                            organization.subscription_plan = plan_name
                        # If we don't have a plan name but we have a price ID, try to find the plan by price ID
                        elif price_id and organization.subscription_plan != 'explorer':
                            # Try to find a subscription plan with this price ID
                            try:
                                plan = SubscriptionPlan.objects.get(stripe_price_id=price_id)
                                print(f"Found plan {plan.name} for price ID {price_id}")
                                organization.subscription_plan = plan.name
                            except SubscriptionPlan.DoesNotExist:
                                print(f"No plan found for price ID {price_id}")
                        
                        # Check if the subscription has been canceled at period end
                        cancel_at_period_end = subscription.cancel_at_period_end if hasattr(subscription, 'cancel_at_period_end') else False
                        organization.cancel_at_period_end = cancel_at_period_end
                        
                        # Always update the subscription status and period end
                        organization.subscription_status = subscription.status
                        
                        # If the subscription is canceled at period end, use cancel_at as the period end
                        if cancel_at_period_end and hasattr(subscription, 'cancel_at'):
                            from django.utils import timezone
                            from datetime import datetime
                            try:
                                period_end_datetime = datetime.fromtimestamp(subscription.cancel_at)
                                organization.subscription_period_end = timezone.make_aware(period_end_datetime, timezone=timezone.get_current_timezone())
                            except Exception as e:
                                print(f"Error setting subscription period end for cancel_at in webhook: {str(e)}")
                                # Set a default period end date
                                organization.subscription_period_end = timezone.now() + timezone.timedelta(days=30)
                        else:
                            # Convert timestamp to timezone-aware datetime
                            from django.utils import timezone
                            from datetime import datetime
                            try:
                                period_end_datetime = datetime.fromtimestamp(subscription.current_period_end)
                                organization.subscription_period_end = timezone.make_aware(period_end_datetime, timezone=timezone.get_current_timezone())
                            except Exception as e:
                                print(f"Error setting subscription period end in webhook: {str(e)}")
                                # Set a default period end date
                                organization.subscription_period_end = timezone.now() + timezone.timedelta(days=30)
                        
                        # Save all changes
                        organization.save(update_fields=[
                            'subscription_plan', 'subscription_status', 'subscription_period_end', 'cancel_at_period_end'
                        ])
                        
                        # Create a subscription event with the Stripe event ID
                        SubscriptionEvent.objects.create(
                            organization=organization,
                            event_type='subscription_updated',
                            stripe_event_id=event.id,
                            data={
                                'subscription_id': subscription.id,
                                'status': subscription.status,
                                'current_period_end': subscription.current_period_end,
                                'plan_name': plan_name,
                                'price_id': price_id
                            }
                        )
                    except Organization.DoesNotExist:
                        # Log the error
                        print(f"Organization with customer ID {customer_id} not found")
            
            elif event.type == 'customer.subscription.deleted':
                # A subscription was canceled
                subscription = event.data.object
                
                # Get the customer ID
                customer_id = subscription.customer
                
                if customer_id:
                    from accounts.models import Organization
                    from .models import SubscriptionEvent
                    
                    # Get the organization
                    try:
                        organization = Organization.objects.get(stripe_customer_id=customer_id)
                        
                        # Update the organization's subscription
                        organization.subscription_status = 'canceled'
                        organization.save(update_fields=['subscription_status'])
                        
                        # Create a subscription event with the Stripe event ID
                        SubscriptionEvent.objects.create(
                            organization=organization,
                            event_type='subscription_cancelled',
                            stripe_event_id=event.id,
                            data={
                                'subscription_id': subscription.id,
                                'status': subscription.status
                            }
                        )
                        
                        # Downgrade to the free plan
                        organization.subscription_plan = 'explorer'
                        organization.save(update_fields=['subscription_plan'])
                    except Organization.DoesNotExist:
                        # Log the error
                        print(f"Organization with customer ID {customer_id} not found")
            
            elif event.type == 'invoice.payment_succeeded':
                # A payment succeeded
                invoice = event.data.object
                
                # Get the customer ID
                customer_id = invoice.customer
                
                if customer_id:
                    from accounts.models import Organization
                    from .models import SubscriptionEvent
                    
                    # Get the organization
                    try:
                        organization = Organization.objects.get(stripe_customer_id=customer_id)
                        
                        # Update the organization's subscription
                        organization.subscription_status = 'active'
                        organization.save(update_fields=['subscription_status'])
                        
                        # Create a subscription event with the Stripe event ID
                        SubscriptionEvent.objects.create(
                            organization=organization,
                            event_type='payment_succeeded',
                            stripe_event_id=event.id,
                            data={
                                'invoice_id': invoice.id,
                                'amount_paid': invoice.amount_paid,
                                'subscription_id': invoice.subscription
                            }
                        )
                    except Organization.DoesNotExist:
                        # Log the error
                        print(f"Organization with customer ID {customer_id} not found")
            
            elif event.type == 'invoice.payment_failed':
                # A payment failed
                invoice = event.data.object
                
                # Get the customer ID
                customer_id = invoice.customer
                
                if customer_id:
                    from accounts.models import Organization
                    from .models import SubscriptionEvent
                    
                    # Get the organization
                    try:
                        organization = Organization.objects.get(stripe_customer_id=customer_id)
                        
                        # Update the organization's subscription
                        organization.subscription_status = 'past_due'
                        organization.save(update_fields=['subscription_status'])
                        
                        # Create a subscription event with the Stripe event ID
                        SubscriptionEvent.objects.create(
                            organization=organization,
                            event_type='payment_failed',
                            stripe_event_id=event.id,
                            data={
                                'invoice_id': invoice.id,
                                'subscription_id': invoice.subscription,
                                'attempt_count': invoice.attempt_count
                            }
                        )
                    except Organization.DoesNotExist:
                        # Log the error
                        print(f"Organization with customer ID {customer_id} not found")
            
            # Return a success response
            return HttpResponse(status=200)
            
        except ValueError as e:
            # Invalid payload
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            return HttpResponse(status=400)
        except Exception as e:
            # Other errors
            return HttpResponse(status=500)
