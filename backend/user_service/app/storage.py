import os
import boto3
from botocore.exceptions import ClientError
import uuid
import io
from PIL import Image
import logging
from typing import Optional, Tuple, BinaryIO

# Configure logging
logger = logging.getLogger("storage")

# Environment variables
USE_LOCAL_STORAGE = os.getenv("USE_LOCAL_STORAGE", "true").lower() == "true"
UPLOAD_DIR = os.getenv("LOCAL_STORAGE_PATH", "./uploads")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8001")

# S3 settings
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")

# Image optimization settings
MAX_IMAGE_SIZE = (800, 800)  # Maximum width and height
JPEG_QUALITY = 85  # JPEG quality (0-100)
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

class StorageError(Exception):
    """Base exception for storage errors."""
    pass

class ImageOptimizationError(Exception):
    """Exception for image optimization errors."""
    pass

def get_s3_client():
    """Create and return an S3 client."""
    if not all([S3_ACCESS_KEY, S3_SECRET_KEY]):
        raise StorageError("S3 credentials not configured")
    
    return boto3.client(
        's3',
        region_name=S3_REGION,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY
    )

def optimize_image(file: BinaryIO) -> Tuple[bytes, str]:
    """
    Optimize an image for storage.
    
    Args:
        file: File-like object containing image data
        
    Returns:
        Tuple of (optimized image bytes, file extension)
    """
    try:
        image = Image.open(file)
        
        # Get original format or default to JPEG
        original_format = image.format or "JPEG"
        
        # Convert PNG with alpha channel to JPEG with white background
        if original_format == "PNG" and image.mode == "RGBA":
            # Create a white background
            background = Image.new("RGB", image.size, (255, 255, 255))
            # Paste the image on the background
            background.paste(image, mask=image.split()[3])  # Using alpha channel as mask
            image = background
            original_format = "JPEG"
        
        # Resize if larger than max size
        if image.width > MAX_IMAGE_SIZE[0] or image.height > MAX_IMAGE_SIZE[1]:
            image.thumbnail(MAX_IMAGE_SIZE, Image.LANCZOS)
        
        # Save optimized image to bytes
        optimized_image = io.BytesIO()
        
        if original_format == "JPEG":
            image.save(optimized_image, format="JPEG", quality=JPEG_QUALITY, optimize=True)
            file_ext = "jpg"
        elif original_format == "PNG":
            image.save(optimized_image, format="PNG", optimize=True)
            file_ext = "png"
        else:
            # Convert other formats to JPEG
            image = image.convert("RGB")
            image.save(optimized_image, format="JPEG", quality=JPEG_QUALITY, optimize=True)
            file_ext = "jpg"
        
        optimized_image.seek(0)
        return optimized_image.getvalue(), file_ext
    
    except Exception as e:
        logger.error(f"Image optimization error: {str(e)}")
        raise ImageOptimizationError(f"Failed to optimize image: {str(e)}")

async def store_image(file: BinaryIO, user_id: str) -> str:
    """
    Store an image in S3 or local storage.
    
    Args:
        file: File-like object containing image data
        user_id: ID of the user the image belongs to
        
    Returns:
        URL of the stored image
    """
    try:
        # Optimize the image
        optimized_image_data, file_ext = optimize_image(file)
        
        # Generate a unique filename
        filename = f"{user_id}_{uuid.uuid4().hex}.{file_ext}"
        
        if USE_LOCAL_STORAGE:
            # Create uploads directory if it doesn't exist
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            
            # Save file to local storage
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as f:
                f.write(optimized_image_data)
            
            # Generate URL
            image_url = f"{BASE_URL}/uploads/{filename}"
            return image_url
        else:
            # Upload to S3
            s3_client = get_s3_client()
            
            # Upload the optimized image
            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=f"images/{filename}",
                Body=optimized_image_data,
                ContentType=f"image/{file_ext}",
                ACL="public-read"  # Make publicly accessible
            )
            
            # Generate S3 URL
            if S3_REGION == "us-east-1":
                image_url = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/images/{filename}"
            else:
                image_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/images/{filename}"
            
            return image_url
    
    except (StorageError, ImageOptimizationError) as e:
        logger.error(f"Storage error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error storing image: {str(e)}")
        raise StorageError(f"Failed to store image: {str(e)}")

async def delete_image(image_url: str) -> bool:
    """
    Delete an image from S3 or local storage.
    
    Args:
        image_url: URL of the image to delete
        
    Returns:
        True if successful, False otherwise
    """
    try:
        if USE_LOCAL_STORAGE:
            # Extract filename from URL
            filename = image_url.split("/")[-1]
            file_path = os.path.join(UPLOAD_DIR, filename)
            
            # Delete the file if it exists
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        else:
            # Extract key from URL
            if "amazonaws.com" in image_url:
                key = image_url.split(".com/")[-1]
            else:
                # Can't determine the key from URL
                return False
            
            # Delete from S3
            s3_client = get_s3_client()
            s3_client.delete_object(
                Bucket=S3_BUCKET_NAME,
                Key=key
            )
            return True
    
    except Exception as e:
        logger.error(f"Error deleting image: {str(e)}")
        return False 