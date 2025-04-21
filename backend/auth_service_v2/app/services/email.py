"""Email service for sending various types of emails."""
from typing import Any, Dict, Optional
from pathlib import Path
import aiofiles
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from app.core.config import settings
from jinja2 import Template
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Email templates directory
TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "email"

async def load_template(template_name: str) -> Template:
    """Load an email template."""
    template_path = TEMPLATE_DIR / template_name
    async with aiofiles.open(template_path) as f:
        template_content = await f.read()
    return Template(template_content)

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

async def read_template(template_name: str) -> str:
    """Read an email template file asynchronously."""
    template_path = Path(__file__).parent.parent / "templates" / template_name
    try:
        async with aiofiles.open(template_path) as f:
            return await f.read()
    except FileNotFoundError:
        # Fallback to a basic HTML template if file not found
        return """
        <html>
            <body>
                <p>{message}</p>
            </body>
        </html>
        """

async def send_email(
    email_to: str,
    subject: str,
    template_name: str,
    template_data: Dict[str, Any],
) -> None:
    """Send an email."""
    try:
        template = await load_template(template_name)
        html_content = template.render(**template_data)
        
        message = MessageSchema(
            subject=subject,
            recipients=[email_to],
            body=html_content,
            subtype="html"
        )
        
        await fastmail.send_message(message)
        logger.info(f"Email sent successfully to {email_to}")
    except Exception as e:
        logger.error(f"Failed to send email to {email_to}: {str(e)}")
        raise

async def send_test_email(email_to: EmailStr) -> None:
    """Send a test email."""
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    
    template_str = await read_template("test_email.html")
    
    await send_email(
        email_to=email_to,
        subject=subject,
        template_name="test_email.html",
        template_data={
            "project_name": settings.PROJECT_NAME,
            "email": email_to
        }
    )

async def send_reset_password_email(
    email_to: EmailStr,
    token: str,
    username: Optional[str] = None
) -> None:
    """Send a password reset email."""
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery"
    
    template_str = await read_template("password_reset.html")
    
    # Use API base URL for the reset link
    link = f"{settings.API_V1_STR}/auth/password-reset/reset?token={token}"
    
    await send_email(
        email_to=email_to,
        subject=subject,
        template_name="password_reset.html",
        template_data={
            "project_name": settings.PROJECT_NAME,
            "username": username or email_to,
            "email": email_to,
            "valid_hours": settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS,
            "link": link
        }
    )

async def send_verification_email(
    email_to: EmailStr,
    token: str,
    username: Optional[str] = None
) -> None:
    """Send an email verification email."""
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Verify your email"
    
    template_str = await read_template("email_verification.html")
    
    # Use API base URL for the verification link
    link = f"{settings.API_V1_STR}/users/verify-email?token={token}"
    
    await send_email(
        email_to=email_to,
        subject=subject,
        template_name="email_verification.html",
        template_data={
            "project_name": settings.PROJECT_NAME,
            "username": username or email_to,
            "email": email_to,
            "link": link
        }
    )

async def send_new_account_email(
    email_to: EmailStr,
    username: str,
    password: Optional[str] = None
) -> None:
    """Send new account email."""
    template_data = {
        "username": username,
        "password": password,
        "project_name": settings.PROJECT_NAME,
        "login_url": f"{settings.SERVER_HOST}/login"
    }
    await send_email(
        email_to=email_to,
        subject=f"Welcome to {settings.PROJECT_NAME}",
        template_name="new_account.html",
        template_data=template_data
    )

async def send_email_verification(
    email_to: EmailStr,
    token: str
) -> None:
    """Send email verification."""
    template_data = {
        "project_name": settings.PROJECT_NAME,
        "verify_url": f"{settings.SERVER_HOST}/verify-email?token={token}"
    }
    await send_email(
        email_to=email_to,
        subject=f"Verify your email for {settings.PROJECT_NAME}",
        template_name="verify_email.html",
        template_data=template_data
    )