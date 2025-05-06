from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
import stripe
import logging

# Get a logger
logger = logging.getLogger(__name__)

@csrf_exempt
@require_POST
def root_webhook_handler(request):
    """
    Handle Stripe webhook events sent to the root URL.
    """
    logger.info("Received webhook request at root URL")

    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    if not sig_header:
        logger.warning("Missing Stripe signature header")
        return HttpResponse(status=400)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        logger.info(f"Stripe webhook event verified: {event['type']}")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid Stripe signature: {str(e)}")
        return HttpResponse(status=400)
    except Exception as e:
        logger.error(f"Error parsing webhook event: {str(e)}", exc_info=True)
        return HttpResponse(status=400)

    # Handle the webhook event
    try:
        # Import the handler from subscriptions app
        from subscriptions.views import handle_stripe_event
        
        # Process the event with the imported handler
        handle_stripe_event(event)
        
        # Return success
        return HttpResponse(status=200)
    except Exception as e:
        logger.error(f"Error handling webhook event: {str(e)}", exc_info=True)
        # Still return 200 to acknowledge receipt to Stripe
        return HttpResponse(status=200)
