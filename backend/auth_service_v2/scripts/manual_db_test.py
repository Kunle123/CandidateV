"""Manual database connection test."""
import psycopg2
import sys
import urllib.parse

# Database connection parameters from Railway configuration
params = {
    'host': 'monorail.proxy.rlwy.net',
    'port': '29421',  # Railway's proxy port
    'database': 'railway',
    'user': 'postgres',
    'password': 'tlWJRdQivsxtdYTfawGUBGGehAdRKtlm'
}

print("Testing direct database connection...")
print(f"Host: {params['host']}")
print(f"Port: {params['port']}")
print(f"Database: {params['database']}")
print(f"User: {params['user']}")
print(f"Using Railway's monorail proxy")

try:
    # Attempt connection
    print("\nAttempting to connect...")
    conn = psycopg2.connect(**params)
    
    # Create a cursor
    cur = conn.cursor()
    
    # Test basic query
    print("\nTesting SELECT 1...")
    cur.execute("SELECT 1")
    result = cur.fetchone()
    print(f"Query result: {result}")
    
    # Get PostgreSQL version
    print("\nChecking PostgreSQL version...")
    cur.execute("SHOW server_version")
    version = cur.fetchone()[0]
    print(f"PostgreSQL version: {version}")
    
    # List all tables
    print("\nListing tables in public schema...")
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = cur.fetchall()
    if tables:
        print("Found tables:")
        for table in tables:
            print(f"- {table[0]}")
            
            # Get table row count
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cur.fetchone()[0]
                print(f"  Row count: {count}")
            except Exception as e:
                print(f"  Could not get row count: {e}")
    else:
        print("WARNING: No tables found in public schema")
    
    # Check database size
    print("\nChecking database size...")
    cur.execute("""
        SELECT pg_size_pretty(pg_database_size(current_database()))
    """)
    db_size = cur.fetchone()[0]
    print(f"Database size: {db_size}")
    
    # Close cursor and connection
    cur.close()
    conn.close()
    print("\nConnection test successful!")
    sys.exit(0)
    
except psycopg2.Error as e:
    print(f"\nError connecting to database: {e}")
    sys.exit(1)
except Exception as e:
    print(f"\nUnexpected error: {e}")
    sys.exit(1) 