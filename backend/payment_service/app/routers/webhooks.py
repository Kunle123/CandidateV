from fastapi import APIRouter, Request, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import logging
import stripe
import json
import httpx
import asyncio
from app.config import settings
from supabase import create_client, Client
from datetime import datetime

# Configure logger
logger = logging.getLogger("payment_service")

# Initialize router
router = APIRouter(prefix="/api/webhooks")

# Stripe API key and webhook secret
STRIPE_API_KEY = settings.STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET

# Initialize Stripe
stripe.api_key = STRIPE_API_KEY

# Initialize Supabase client
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)

class WebhookResponse(BaseModel):
    status: str
    message: str

@router.post("/stripe", response_model=WebhookResponse)
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events.
    
    This endpoint receives webhook events from Stripe for events like:
    - subscription.created
    - subscription.updated
    - subscription.deleted
    - invoice.payment_succeeded
    - payment_intent.succeeded
    """
    try:
        # Get the raw request body
        body = await request.body()
        body_str = body.decode("utf-8")
        
        # Get the Stripe signature from headers
        sig_header = request.headers.get("stripe-signature")
        
        if not sig_header:
            logger.warning("Missing Stripe signature header")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Stripe signature header"
            )
        
        if not STRIPE_WEBHOOK_SECRET:
            logger.warning("Stripe webhook secret not configured")
            return WebhookResponse(
                status="error",
                message="Stripe webhook secret not configured"
            )
        
        # Verify the webhook signature
        try:
            event = stripe.Webhook.construct_event(
                body_str,
                sig_header,
                STRIPE_WEBHOOK_SECRET
            )
        except stripe.error.SignatureVerificationError as e:
            logger.warning(f"Invalid Stripe signature: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Stripe signature"
            )
        
        # Process the event
        event_type = event["type"]
        event_object = event["data"]["object"]
        
        logger.info(f"Received Stripe webhook event: {event_type}")
        
        # Handle specific event types
        if event_type == "checkout.session.completed":
            await handle_checkout_session_completed(event_object)
        
        elif event_type == "subscription.created":
            await handle_subscription_created(event_object)
            
        elif event_type == "subscription.updated":
            await handle_subscription_updated(event_object)
            
        elif event_type == "subscription.deleted":
            await handle_subscription_deleted(event_object)
            
        elif event_type == "invoice.payment_succeeded":
            await handle_invoice_payment_succeeded(event_object)
            
        elif event_type == "invoice.payment_failed":
            await handle_invoice_payment_failed(event_object)
            
        else:
            logger.info(f"Unhandled event type: {event_type}")
        
        return WebhookResponse(
            status="success",
            message=f"Processed webhook event: {event_type}"
        )
    
    except Exception as e:
        logger.error(f"Error processing Stripe webhook: {str(e)}")
        # Don't return an error status code to Stripe to avoid retries
        return WebhookResponse(
            status="error",
            message=f"Error processing webhook: {str(e)}"
        )

async def handle_checkout_session_completed(session):
    """Handle checkout.session.completed event"""
    logger.info(f"Processing checkout.session.completed: {session.id}")
    
    try:
        # If this was a subscription checkout, update user's subscription status
        if session.mode == "subscription":
            # Get the customer and subscription IDs
            customer_id = session.customer
            subscription_id = session.subscription
            
            if not subscription_id:
                logger.warning(f"No subscription ID in session {session.id}")
                return
            
            # Get user ID from metadata
            user_id = session.metadata.get("user_id")
            if not user_id:
                # Try to get it from the customer
                customer = stripe.Customer.retrieve(customer_id)
                user_id = customer.metadata.get("user_id")
            
            if not user_id:
                logger.warning(f"No user ID found for subscription {subscription_id}")
                return
            
            # Get the subscription
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            # Update subscription metadata if needed
            if "user_id" not in subscription.metadata:
                stripe.Subscription.modify(
                    subscription_id,
                    metadata={"user_id": user_id}
                )
            
            # Notify the user service (or any other service) about the subscription change
            await notify_subscription_update(user_id, subscription)
    
    except Exception as e:
        logger.error(f"Error handling checkout.session.completed: {str(e)}")

async def handle_subscription_created(subscription):
    """Handle subscription.created event"""
    logger.info(f"Processing subscription.created: {subscription.id}")
    
    try:
        # Get user ID from metadata
        user_id = subscription.metadata.get("user_id")
        if not user_id:
            # Try to get it from the customer
            customer = stripe.Customer.retrieve(subscription.customer)
            user_id = customer.metadata.get("user_id")
        
        if not user_id:
            logger.warning(f"No user ID found for subscription {subscription.id}")
            return
        
        # Update user's subscription status
        await notify_subscription_update(user_id, subscription)
    
    except Exception as e:
        logger.error(f"Error handling subscription.created: {str(e)}")

async def handle_subscription_updated(subscription):
    """Handle subscription.updated event"""
    logger.info(f"Processing subscription.updated: {subscription.id}")
    
    try:
        # Get user ID from metadata
        user_id = subscription.metadata.get("user_id")
        if not user_id:
            # Try to get it from the customer
            customer = stripe.Customer.retrieve(subscription.customer)
            user_id = customer.metadata.get("user_id")
        
        if not user_id:
            logger.warning(f"No user ID found for subscription {subscription.id}")
            return
        
        # Update user's subscription status
        await notify_subscription_update(user_id, subscription)
    
    except Exception as e:
        logger.error(f"Error handling subscription.updated: {str(e)}")

async def handle_subscription_deleted(subscription):
    """Handle subscription.deleted event"""
    logger.info(f"Processing subscription.deleted: {subscription.id}")
    
    try:
        # Get user ID from metadata
        user_id = subscription.metadata.get("user_id")
        if not user_id:
            # Try to get it from the customer
            customer = stripe.Customer.retrieve(subscription.customer)
            user_id = customer.metadata.get("user_id")
        
        if not user_id:
            logger.warning(f"No user ID found for subscription {subscription.id}")
            return
        
        # Update user's subscription status
        await notify_subscription_update(user_id, subscription, is_deleted=True)
    
    except Exception as e:
        logger.error(f"Error handling subscription.deleted: {str(e)}")

async def handle_invoice_payment_succeeded(invoice):
    """Handle invoice.payment_succeeded event"""
    logger.info(f"Processing invoice.payment_succeeded: {invoice.id}")
    
    try:
        # If this was a subscription invoice, check subscription status
        if invoice.subscription:
            subscription = stripe.Subscription.retrieve(invoice.subscription)
            
            # Get user ID from metadata
            user_id = subscription.metadata.get("user_id")
            if not user_id:
                # Try to get it from the customer
                customer = stripe.Customer.retrieve(invoice.customer)
                user_id = customer.metadata.get("user_id")
            
            if not user_id:
                logger.warning(f"No user ID found for subscription {subscription.id}")
                return
            
            # Update user's subscription status
            await notify_subscription_update(user_id, subscription)
    
    except Exception as e:
        logger.error(f"Error handling invoice.payment_succeeded: {str(e)}")

async def handle_invoice_payment_failed(invoice):
    """Handle invoice.payment_failed event"""
    logger.info(f"Processing invoice.payment_failed: {invoice.id}")
    
    try:
        # If this was a subscription invoice, check subscription status
        if invoice.subscription:
            subscription = stripe.Subscription.retrieve(invoice.subscription)
            
            # Get user ID from metadata
            user_id = subscription.metadata.get("user_id")
            if not user_id:
                # Try to get it from the customer
                customer = stripe.Customer.retrieve(invoice.customer)
                user_id = customer.metadata.get("user_id")
            
            if not user_id:
                logger.warning(f"No user ID found for subscription {subscription.id}")
                return
            
            # Update user's subscription status
            await notify_subscription_update(user_id, subscription, is_payment_failed=True)
    
    except Exception as e:
        logger.error(f"Error handling invoice.payment_failed: {str(e)}")

async def notify_subscription_update(user_id, subscription, is_deleted=False, is_payment_failed=False):
    """Notify other services about subscription changes"""
    try:
        # Get subscription details
        plan_id = subscription.metadata.get("plan_id", "basic")
        
        # Determine subscription status
        status = "canceled" if is_deleted else subscription.status
        if is_payment_failed and status == "active":
            status = "past_due"
        
        # Create notification payload
        payload = {
            "user_id": user_id,
            "subscription_id": subscription.id,
            "status": status,
            "plan_id": plan_id,
            "current_period_end": subscription.current_period_end,
            "cancel_at_period_end": subscription.cancel_at_period_end,
            "is_active": status == "active"
        }
        
        # Send notification to Auth Service
        # (This would update user's permissions/roles based on subscription)
        auth_service_url = f"{settings.AUTH_SERVICE_URL}/api/users/{user_id}/subscription"
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {"Content-Type": "application/json"}
            try:
                response = await client.post(auth_service_url, json=payload, headers=headers)
                if response.status_code != 200:
                    logger.warning(f"Failed to notify Auth Service: {response.status_code} {response.text}")
            except Exception as e:
                logger.warning(f"Error notifying Auth Service: {str(e)}")
        
        logger.info(f"Subscription update notification sent for user {user_id} - status: {status}")
    
    except Exception as e:
        logger.error(f"Error in notify_subscription_update: {str(e)}") 