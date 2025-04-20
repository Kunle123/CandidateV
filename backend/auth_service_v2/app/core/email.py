"""Email utilities for sending emails."""
import logging
from typing import Dict, Any, Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from app.core.config import settings

logger = logging.getLogger(__name__)

# Email configuration
try:
    email_conf = ConnectionConfig(
        MAIL_USERNAME=settings.SMTP_USER or "",
        MAIL_PASSWORD=settings.SMTP_PASSWORD or "",
        MAIL_FROM=settings.EMAILS_FROM_EMAIL or "noreply@example.com",
        MAIL_PORT=settings.SMTP_PORT or 587,
        MAIL_SERVER=settings.SMTP_HOST or "localhost",
        MAIL_FROM_NAME=settings.EMAILS_FROM_NAME or "Auth Service",
        MAIL_TLS=settings.SMTP_TLS,
        MAIL_SSL=False,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
        TEMPLATE_FOLDER="app/templates"
    )
    fastmail = FastMail(email_conf)
except Exception as e:
    logger.error(f"Failed to initialize email configuration: {str(e)}")
    fastmail = None

async def send_email(
    email_to: str,
    subject: str = "",
    template_name: str = "",
    template_data: Dict[str, Any] = None
) -> None:
    """
    Send an email using FastMail.
    
    Args:
        email_to: Recipient email address
        subject: Email subject
        template_name: Name of the template to use
        template_data: Data to pass to the template
    """
    if not fastmail:
        logger.warning("Email service not configured, skipping email send")
        return

    try:
        message = MessageSchema(
            subject=subject,
            recipients=[email_to],
            template_body=template_data or {},
            subtype="html"
        )
        
        await fastmail.send_message(message, template_name=template_name)
        logger.info(f"Email sent successfully to {email_to}")
    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {str(e)}")
        # Don't raise the exception - we don't want to break the flow if email fails 