"""
Environment variables setup script for User Management Service
Run this script before starting the service to ensure all environment variables are set.
"""
import os
import sys

def set_environment_variables():
    """Set all required environment variables."""
    # Set SQLite database URL for local development
    os.environ["DATABASE_URL"] = "sqlite:///./user_service.db"
    
    # Core settings
    os.environ["PORT"] = "8085"  # Use different port to avoid conflicts
    os.environ["JWT_SECRET"] = "your-secret-key-here-for-development-only"
    os.environ["JWT_ALGORITHM"] = "HS256"
    os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
    os.environ["BASE_URL"] = "http://localhost:8085"
    
    # CORS settings
    os.environ["CORS_ORIGINS"] = "http://localhost:3000,http://localhost:5173,https://candidatev.vercel.app"
    
    # Storage settings
    os.environ["USE_LOCAL_STORAGE"] = "true"
    os.environ["LOCAL_STORAGE_PATH"] = "./uploads"
    
    # Print environment variables for debugging
    print("Environment variables set:")
    for key, value in os.environ.items():
        if key in [
            "DATABASE_URL", "PORT", "JWT_SECRET", "JWT_ALGORITHM", 
            "ACCESS_TOKEN_EXPIRE_MINUTES", "BASE_URL", "CORS_ORIGINS",
            "USE_LOCAL_STORAGE", "LOCAL_STORAGE_PATH"
        ]:
            # Mask JWT_SECRET
            if key == "JWT_SECRET":
                print(f"  {key} = {'*' * 10}")
            else:
                print(f"  {key} = {value}")

if __name__ == "__main__":
    set_environment_variables()
    
    # Execute the next command if provided
    if len(sys.argv) > 1:
        # Run the specified command with the environment variables set
        command = " ".join(sys.argv[1:])
        print(f"\nRunning command: {command}")
        os.system(command)
    else:
        print("\nEnvironment variables have been set in this process.")
        print("To run the User Management Service, use:")
        print("python -m uvicorn app.main:app --reload --port 8085")
        print("\nNote: Environment variables are only set for this script's process.")
        print("For a different terminal, run this script again.") 