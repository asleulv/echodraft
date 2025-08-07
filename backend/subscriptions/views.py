import stripe
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.http import HttpResponse
from accounts.models import Organization, CreditPackage, CreditPurchase
from accounts.permissions import IsSameOrganization

# Configure Stripe API key
stripe.api_key = settings.STRIPE_SECRET_KEY

# Set up logging
logger = logging.getLogger(__name__)


class CreditPackageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing credit packages."""
    
    queryset = CreditPackage.objects.filter(is_active=True)
    serializer_class = None  # We'll create this serializer later
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        """List all active credit packages."""
        queryset = self.get_queryset().order_by('price')
        
        # Simple serialization without a dedicated serializer for now
        packages_data = []
        for package in queryset:
            packages_data.append({
                'id': package.id,
                'name': package.name,
                'display_name': package.display_name,
                'description': package.description,
                'credits': package.credits,
                'price': float(package.price),
                'currency': package.currency,
            })
        
        return Response(packages_data)


class OrganizationCreditViewSet(viewsets.ViewSet):
    """ViewSet for managing organization credits."""
    
    permission_classes = [permissions.IsAuthenticated, IsSameOrganization]
    
    def list(self, request):
        """Get the current organization's credit information."""
        organization = request.user.organization
        if not organization:
            return Response(
                {"detail": "User does not belong to an organization."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Return credit details
        return Response([{
            'id': organization.id,
            'ai_credits_balance': organization.ai_credits_balance,
            'bonus_ai_generation_credits': organization.bonus_ai_generation_credits,
            'total_credits_available': organization.total_credits_available,
            'ai_credits_purchased_total': organization.ai_credits_purchased_total,
        }])
    
    @action(detail=False, methods=['post'])
    def purchase(self, request):
        """Create a checkout session for credit package purchase."""
        try:
            # Get the package ID from the request
            package_id = request.data.get('package_id')
            if not package_id:
                return Response(
                    {"detail": "Package ID is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the package from the database
            try:
                package = CreditPackage.objects.get(id=package_id, is_active=True)
            except CreditPackage.DoesNotExist:
                return Response(
                    {"detail": "Invalid package ID."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the organization
            organization = request.user.organization
            if not organization:
                return Response(
                    {"detail": "User does not belong to an organization."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create Stripe checkout session for one-time payment
            success_url = request.data.get('success_url', f"{request.scheme}://{request.get_host()}/credits/success")
            cancel_url = request.data.get('cancel_url', f"{request.scheme}://{request.get_host()}/credits/cancel")
            
            # Create checkout session
            checkout_session = self.create_checkout_session(
                organization=organization,
                package=package,
                success_url=success_url,
                cancel_url=cancel_url
            )
            
            return Response({
                'checkout_url': checkout_session.url
            })
            
        except Exception as e:
            logger.error(f"Error creating checkout session: {str(e)}")
            return Response(
                {"detail": "Failed to create checkout session. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create_checkout_session(self, organization, package, success_url, cancel_url):
        """Create Stripe checkout session for credit package purchase."""
        
        # Ensure organization has a Stripe customer ID
        if not organization.stripe_customer_id:
            customer = stripe.Customer.create(
                email=organization.users.first().email,
                name=organization.name,
            )
            organization.stripe_customer_id = customer.id
            organization.save(update_fields=['stripe_customer_id'])
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=organization.stripe_customer_id,
            payment_method_types=['card'],
            mode='payment',  # One-time payment instead of subscription
            line_items=[{
                'price_data': {
                    'currency': package.currency.lower(),
                    'product_data': {
                        'name': package.display_name,
                        'description': f"{package.credits} AI Generation Credits - {package.description}",
                    },
                    'unit_amount': int(package.price * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'organization_id': str(organization.id),
                'package_id': str(package.id),
                'credits': str(package.credits),
            }
        )
        
        return checkout_session


class StripeWebhookView(viewsets.ViewSet):
    """ViewSet for handling Stripe webhooks for credit purchases."""
    
    permission_classes = []  # No authentication required for webhooks
    
    @action(detail=False, methods=['post'])
    def webhook(self, request):
        """Handle Stripe webhook events for credit purchases."""
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            # Verify the webhook signature
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            logger.error("Invalid webhook payload")
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid webhook signature")
            return HttpResponse(status=400)
        
        # Handle successful credit purchases
        if event.type == 'checkout.session.completed':
            session = event.data.object
            
            # Get organization and package info from metadata
            organization_id = session.metadata.get('organization_id')
            package_id = session.metadata.get('package_id')
            credits = session.metadata.get('credits')
            
            if organization_id and package_id and credits:
                try:
                    organization = Organization.objects.get(id=organization_id)
                    package = CreditPackage.objects.get(id=package_id)
                    
                    # Add credits to organization
                    organization.add_purchased_credits(int(credits))
                    
                    # Record the purchase
                    CreditPurchase.objects.create(
                        organization=organization,
                        package=package,
                        credits_purchased=int(credits),
                        amount_paid=package.price,
                        stripe_payment_intent_id=session.payment_intent
                    )
                    
                    logger.info(f"Successfully added {credits} credits to organization {organization.name}")
                    
                except (Organization.DoesNotExist, CreditPackage.DoesNotExist) as e:
                    logger.error(f"Error processing credit purchase: {str(e)}")
                except Exception as e:
                    logger.error(f"Unexpected error processing credit purchase: {str(e)}")
        else:
            logger.info(f"Unhandled webhook event type: {event.type}")
        
        return HttpResponse(status=200)
