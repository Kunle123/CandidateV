"""Initialize Railway database with schema."""
from app.db.session import init_db

if __name__ == "__main__":
    print("Creating database tables...")
    init_db()
    print("Database initialization completed.") 