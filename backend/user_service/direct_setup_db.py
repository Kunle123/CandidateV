"""
Direct database setup script for User Management Service
This script creates the database schema directly without importing modules from the app package,
avoiding circular import dependencies.
"""
import os
import sqlite3
import sqlalchemy
from sqlalchemy import Column, String, Text, JSON, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
import uuid

# Set database URL
DB_FILE = "user_service.db"
DATABASE_URL = f"sqlite:///./{DB_FILE}"

# Set environment variable
os.environ["DATABASE_URL"] = DATABASE_URL
print(f"Set DATABASE_URL = {DATABASE_URL}")

# Create tables directly
Base = declarative_base()

class UserProfile(Base):
    __tablename__ = "user_profiles"

    # Use String type for ID in SQLite (instead of UUID which is not supported)
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String(255), nullable=True)
    job_title = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    social_links = Column(JSON, nullable=True)
    preferences = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

print("Creating SQLite database and tables...")

# Create engine and tables
engine = sqlalchemy.create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
)

# Drop tables if they exist
Base.metadata.drop_all(engine)
print("Dropped existing tables if any")

# Create tables
Base.metadata.create_all(engine)
print("Created tables successfully")

# Verify tables were created
conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("\nTables created in the database:")
for table in tables:
    print(f"- {table[0]}")

# Check schema of user_profiles table
cursor.execute("PRAGMA table_info(user_profiles);")
columns = cursor.fetchall()
print("\nColumns in user_profiles table:")
for column in columns:
    print(f"- {column[1]} ({column[2]})")

conn.close()

print("\nDatabase setup completed successfully!")
print(f"SQLite database file created: {os.path.abspath(DB_FILE)}")
print("\nYou can now run the User Management Service with:")
print("python -m uvicorn app.main:app --reload --port 8085") 