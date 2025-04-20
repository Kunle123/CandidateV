import psycopg2

def test_connection():
    try:
        conn = psycopg2.connect(
            "postgresql://postgres:tlWJRdQivsxtdYTfawGUBGGehAdRKtlm@monorail.proxy.rlwy.net:5432/railway"
        )
        print("Connection successful!")
        conn.close()
    except Exception as e:
        print(f"Connection failed: {str(e)}")

if __name__ == "__main__":
    test_connection() 