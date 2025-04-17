"""
Script to set up SQLite database for development
"""
import os
import sqlite3
from sqlalchemy import create_engine
from app.models import Base

# Create SQLite database
DB_FILE = "user_service.db"
DATABASE_URL = f"sqlite:///./{DB_FILE}"

# Set the environment variable for other modules
os.environ["DATABASE_URL"] = DATABASE_URL

print(f"Creating SQLite database: {DB_FILE}")

# Create database engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# Create all tables
print("Creating tables...")
Base.metadata.create_all(engine)
print("Tables created successfully!")

# Basic verification
conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

# List tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("\nTables in the database:")
for table in tables:
    print(f"- {table[0]}")

# Close connection
conn.close()

print("\nDatabase setup complete!") 