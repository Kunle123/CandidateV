"""Email service for sending various types of emails."""
from typing import Optional, Dict, Any
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr, ValidationError
from app.core.config import settings

email_conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.EMAILS_FROM_EMAIL,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_FROM_NAME=settings.EMAILS_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_email(payload: Dict[str, Any]) -> None:
    """Send an email."""
    try:
        # Validate email address
        EmailStr.validate(payload["to_email"])
        
        message = MessageSchema(
            subject=payload["subject"],
            recipients=[payload["to_email"]],
            body=payload["body"],
            subtype="html"
        )
        
        fm = FastMail(email_conf)
        await fm.send_message(message)
    except ValidationError:
        raise ValueError("Invalid email address")
    except Exception as e:
        raise Exception(f"Email service error: {str(e)}")

async def send_test_email(email_to: EmailStr) -> None:
    """Send a test email."""
    payload = {
        "to_email": email_to,
        "subject": f"{settings.PROJECT_NAME} - Test email",
        "body": f"""
        <p>Test email from {settings.PROJECT_NAME}</p>
        <p>If you received this email, it means your email service is working correctly.</p>
        """
    }
    await send_email(payload)

async def send_reset_password_email(email_to: EmailStr, token: str) -> None:
    """Send password reset email."""
    reset_link = f"{settings.SERVER_HOST}/reset-password?token={token}"
    payload = {
        "to_email": email_to,
        "subject": f"{settings.PROJECT_NAME} - Password Reset",
        "body": f"""
        <p>Password Reset Request</p>
        <p>To reset your password, click on the following link:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>The link is valid for {settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS} hours.</p>
        """
    }
    await send_email(payload)

async def send_verification_email(email_to: EmailStr, token: str) -> None:
    """Send email verification link."""
    verification_link = f"{settings.SERVER_HOST}/verify-email?token={token}"
    payload = {
        "to_email": email_to,
        "subject": f"{settings.PROJECT_NAME} - Verify Email",
        "body": f"""
        <p>Email Verification</p>
        <p>To verify your email address, click on the following link:</p>
        <p><a href="{verification_link}">{verification_link}</a></p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>The link is valid for {settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS} hours.</p>
        """
    }
    await send_email(payload)

async def send_new_account_email(email_to: EmailStr, name: str) -> None:
    """Send welcome email for new accounts."""
    payload = {
        "to_email": email_to,
        "subject": f"Welcome to {settings.PROJECT_NAME}!",
        "body": f"""
        <p>Welcome {name}!</p>
        <p>Thank you for creating an account with {settings.PROJECT_NAME}.</p>
        <p>We're excited to have you on board!</p>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        """
    }
    await send_email(payload) 