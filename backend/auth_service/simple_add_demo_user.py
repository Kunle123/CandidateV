import os
import sys
import sqlite3
import bcrypt
from datetime import datetime

# Set up the database path
db_path = os.path.join(os.path.dirname(__file__), "test.db")
print(f"Using database at: {db_path}")

# Create connection to the SQLite database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if users table exists, create it if not
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT,
    hashed_password TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
""")

# Create demo user
demo_user_id = "demo-user-123"
demo_email = "demo@candidatev.com"
demo_username = "demo_user"
password = "demo1234"  # Updated password to be 8 characters

# Hash the password
hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
now = datetime.now().isoformat()

# Check if demo user already exists
cursor.execute("SELECT id FROM users WHERE id = ? OR email = ?", (demo_user_id, demo_email))
existing_user = cursor.fetchone()

if existing_user:
    print(f"Demo user already exists with ID: {existing_user[0]}")
    print("Updating the demo user details...")
    cursor.execute("""
    UPDATE users 
    SET email = ?, username = ?, hashed_password = ?, is_active = TRUE, is_admin = FALSE, updated_at = ?
    WHERE id = ?
    """, (demo_email, demo_username, hashed_password, now, demo_user_id))
else:
    print("Creating new demo user...")
    cursor.execute("""
    INSERT INTO users (id, email, username, hashed_password, is_active, is_admin, created_at, updated_at)
    VALUES (?, ?, ?, ?, TRUE, FALSE, ?, ?)
    """, (demo_user_id, demo_email, demo_username, hashed_password, now, now))

# Commit the changes and close the connection
conn.commit()
conn.close()

print(f"Demo user successfully created/updated with ID: {demo_user_id}")
print(f"Email: {demo_email}")
print(f"Password: {password}") 