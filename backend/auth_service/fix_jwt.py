#!/usr/bin/env python3
"""
Script to help diagnose and fix JWT import issues.
"""

import sys
import subprocess
import os

print("--- fix_jwt.py executed ---")

def check_module_installation():
    """Check if PyJWT is installed and install it if needed"""
    try:
        import jwt
        print(f"PyJWT is installed. Version: {jwt.__version__}")
        return True
    except ImportError:
        print("PyJWT is not installed. Attempting to install it...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "PyJWT==2.8.0"])
            print("PyJWT installed successfully!")
            return True
        except subprocess.CalledProcessError:
            print("Failed to install PyJWT.")
            return False

def test_jwt_import():
    """Test importing JWT module"""
    try:
        import jwt
        # Try creating a token
        token = jwt.encode({"test": "data"}, "secret", algorithm="HS256")
        print(f"JWT test successful! Created token: {token}")
        return True
    except ImportError as e:
        print(f"Failed to import JWT: {e}")
        return False
    except Exception as e:
        print(f"Error testing JWT: {e}")
        return False

def fix_dependencies():
    """Fix dependencies"""
    try:
        # Get the current directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        requirements_path = os.path.join(current_dir, "requirements.txt")
        
        # Update requirements file if needed
        updated = False
        with open(requirements_path, "r") as f:
            content = f.read()
            
        if "PyJWT" not in content:
            with open(requirements_path, "a") as f:
                f.write("\n# Added by fix script\nPyJWT==2.8.0\n")
            updated = True
            print("Updated requirements.txt with PyJWT entry")
        
        # Ensure all dependencies are installed
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", requirements_path])
        print("All dependencies installed")
        
        return updated
    except Exception as e:
        print(f"Failed to fix dependencies: {e}")
        return False

if __name__ == "__main__":
    print("JWT Import Fix Utility")
    print("======================")
    check_module_installation()
    fix_dependencies()
    if test_jwt_import():
        print("JWT module is working correctly!")
    else:
        print("JWT module is still not working. Try running this script again.")
    
    print("\nIf you're running in Docker, make sure to rebuild your container with:")
    print("docker build -t auth-service .")
    print("docker run -p 8000:8000 auth-service") 