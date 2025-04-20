"""Email service for sending various types of emails."""
from typing import Any, Dict, Optional
from pathlib import Path
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.EMAILS_FROM_EMAIL,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_FROM_NAME=settings.PROJECT_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates'
)

fastmail = FastMail(conf)

async def send_email(
    email_to: str,
    subject_template: str = "",
    html_template: str = "",
    environment: Dict[str, Any] = {},
) -> None:
    """Send an email."""
    message = MessageSchema(
        subject=subject_template,
        recipients=[email_to],
        body=html_template,
        subtype="html"
    )
    
    await fastmail.send_message(message)

async def send_test_email(email_to: EmailStr) -> None:
    """Send a test email."""
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    
    with open(Path(__file__).parent.parent / "templates" / "test_email.html") as f:
        template_str = f.read()
    
    await send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": settings.PROJECT_NAME,
            "email": email_to
        }
    )

async def send_reset_password_email(
    email_to: EmailStr,
    token: str,
    username: str
) -> None:
    """Send a password reset email."""
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery"
    
    with open(Path(__file__).parent.parent / "templates" / "password_reset.html") as f:
        template_str = f.read()
    
    server_host = settings.SERVER_HOST
    link = f"{server_host}/reset-password?token={token}"
    
    await send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link
        }
    )

async def send_verification_email(
    email_to: EmailStr,
    token: str,
    username: str
) -> None:
    """Send an email verification email."""
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Verify your email"
    
    with open(Path(__file__).parent.parent / "templates" / "email_verification.html") as f:
        template_str = f.read()
    
    server_host = settings.SERVER_HOST
    link = f"{server_host}/verify-email?token={token}"
    
    await send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "email": email_to,
            "link": link
        }
    )