# Demo user provisioning script
import os
import sys
import json
from datetime import datetime, timedelta

# Try to import required modules
try:
    from app.database import get_db_session
    from app.models import User
    from app.security import get_password_hash
    from sqlalchemy.orm import Session
except ImportError:
    print("Error: Unable to import required modules. Make sure you're in the auth_service directory.")
    sys.exit(1)

# Create a demo user in the database
def create_demo_user():
    print("Attempting to create demo user...")
    
    try:
        # Get database session
        db = next(get_db_session())
        
        # Check if demo user already exists
        user_id = os.getenv('DEMO_USER_ID', 'demo-user-123')
        existing_user = db.query(User).filter(User.id == user_id).first()
        
        if existing_user:
            print(f"Demo user already exists with ID: {user_id}")
            return True
        
        # Create a new demo user
        demo_user = User(
            id=user_id,
            email="demo@example.com",
            name="Demo User",
            hashed_password=get_password_hash("demo-password"),
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Add user to database
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        
        print(f"Successfully created demo user with ID: {demo_user.id}")
        return True
    except Exception as e:
        print(f"Error creating demo user: {str(e)}")
        return False

if __name__ == "__main__":
    create_demo_user()
