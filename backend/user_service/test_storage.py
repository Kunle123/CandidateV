import asyncio
import io
import os
import sys
import uuid
import traceback
from PIL import Image

# Import storage functionality
try:
    from app.storage import store_image, delete_image, StorageError, get_s3_client
    print("Successfully imported storage modules")
except ImportError as e:
    print(f"Error importing storage modules: {e}")
    traceback.print_exc()
    sys.exit(1)

# Create a test user ID
TEST_USER_ID = str(uuid.uuid4())
print(f"Testing with user ID: {TEST_USER_ID}")

# Create a simple test image
def create_test_image():
    image = Image.new('RGB', (100, 100), color='red')
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    return img_byte_arr

def check_s3_config():
    """Check if S3 is properly configured"""
    try:
        # Check S3 environment variables
        s3_vars = ["S3_BUCKET_NAME", "S3_REGION", "S3_ACCESS_KEY", "S3_SECRET_KEY"]
        all_configured = True
        
        for var in s3_vars:
            if var in os.environ and os.environ[var] and os.environ[var] != "your-s3-access-key" and os.environ[var] != "your-s3-secret-key":
                print(f"{var}: Configured")
            else:
                print(f"{var}: Not configured or using default placeholder value")
                all_configured = False
        
        if all_configured:
            # Try to create an S3 client
            try:
                s3_client = get_s3_client()
                print("S3 client created successfully")
                return True
            except Exception as e:
                print(f"Failed to create S3 client: {e}")
                return False
        else:
            print("S3 is not fully configured")
            return False
    except Exception as e:
        print(f"Error checking S3 config: {e}")
        return False

async def test_image_storage(use_local_storage=True):
    print(f"\nStarting image storage test... (Local storage: {use_local_storage})")
    
    # Save the original environment setting
    original_setting = os.environ.get("USE_LOCAL_STORAGE", "true")
    
    try:
        # Set the environment variable for this test
        os.environ["USE_LOCAL_STORAGE"] = "true" if use_local_storage else "false"
        print(f"USE_LOCAL_STORAGE set to: {os.environ['USE_LOCAL_STORAGE']}")
        
        if not use_local_storage:
            # Check S3 configuration
            s3_configured = check_s3_config()
            if not s3_configured:
                print("S3 is not properly configured, test will likely fail")
                print("You should have proper S3 credentials set in your environment variables")
        
        # Create test image
        test_image = create_test_image()
        print("Test image created successfully")
        
        # Upload the image
        print("Uploading image...")
        try:
            image_url = await store_image(test_image, TEST_USER_ID)
            print(f"Image uploaded successfully: {image_url}")
            
            # Verify local storage
            if use_local_storage:
                filename = image_url.split("/")[-1]
                local_path = os.path.join("uploads", filename)
                if os.path.exists(local_path):
                    print(f"Image file exists at {local_path}")
                else:
                    print(f"Error: Image file not found at {local_path}")
            
            # Delete the image
            print("Deleting image...")
            delete_success = await delete_image(image_url)
            if delete_success:
                print("Image deleted successfully")
            else:
                print("Failed to delete image")
            
            # Verify deletion for local storage
            if use_local_storage:
                filename = image_url.split("/")[-1]
                local_path = os.path.join("uploads", filename)
                if not os.path.exists(local_path):
                    print(f"Image file was correctly deleted from {local_path}")
                else:
                    print(f"Error: Image file still exists at {local_path}")
            
            return True
        except StorageError as e:
            print(f"Storage error: {e}")
            traceback.print_exc()
            return False
        except Exception as e:
            print(f"Unexpected error during storage operation: {e}")
            traceback.print_exc()
            return False
    except Exception as e:
        print(f"Error during test: {e}")
        traceback.print_exc()
        return False
    finally:
        # Restore the original environment setting
        os.environ["USE_LOCAL_STORAGE"] = original_setting
        print(f"Restored USE_LOCAL_STORAGE to {original_setting}")

if __name__ == "__main__":
    # Test with local storage
    print("\n=== TESTING LOCAL STORAGE ===")
    local_success = asyncio.run(test_image_storage(use_local_storage=True))
    
    # Test with S3 storage (will fail without proper S3 credentials)
    print("\n=== TESTING S3 STORAGE ===")
    s3_success = asyncio.run(test_image_storage(use_local_storage=False))
    
    # Summary
    print("\n=== TEST SUMMARY ===")
    print(f"Local storage test: {'PASSED' if local_success else 'FAILED'}")
    print(f"S3 storage test: {'PASSED' if s3_success else 'FAILED'}")
    
    if not s3_success:
        print("\nNote: The S3 test failure is expected without proper S3 credentials.")
        print("To test S3 storage, you need to set the following environment variables:")
        print("  - S3_BUCKET_NAME: Name of your S3 bucket")
        print("  - S3_REGION: AWS region (e.g., us-east-1)")
        print("  - S3_ACCESS_KEY: Your AWS access key")
        print("  - S3_SECRET_KEY: Your AWS secret key")
        print("\nFor production deployment on Railway, configure these as secrets.") 