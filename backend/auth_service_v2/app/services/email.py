"""Email service for sending various types of emails."""
from typing import Any, Dict, Optional
from pathlib import Path
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_TLS,
    MAIL_SSL_TLS=settings.MAIL_SSL,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
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
    
    # Use API base URL for the reset link
    link = f"{settings.API_V1_STR}/auth/password-reset/reset?token={token}"
    
    await send_email(
        email_to=email_to,
        subject_template=subject,
        html_template=template_str,
        environment={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "email": email_to,
            "valid_hours": settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS,
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
    
    # Use API base URL for the verification link
    link = f"{settings.API_V1_STR}/users/verify-email?token={token}"
    
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