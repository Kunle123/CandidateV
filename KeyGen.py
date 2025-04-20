import jwt
import datetime
import os

# --- Configuration ---
# !!! REPLACE WITH YOUR ACTUAL JWT SECRET !!!
SECRET_KEY = os.environ.get("JWT_SECRET", "cee809392216c387fff9792252f071005d1413fcc627bb1944bacc2338e4dc23")
ALGORITHM = "HS256"
SERVICE_USER_ID = "ai_service_account" # Or any identifier for the AI service
# Set expiration far in the future (e.g., 10 years)
EXPIRATION_YEARS = 10
# -------------------

if SECRET_KEY == "your-actual-jwt-secret":
    print("ERROR: Please replace 'your-actual-jwt-secret' with your actual JWT secret key.")
else:
    expiration_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365 * EXPIRATION_YEARS)

    payload = {
        "user_id": SERVICE_USER_ID,
        "exp": expiration_time,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "sub": SERVICE_USER_ID, # Subject claim, often same as user_id for services
        "iss": "candidatev_auth" # Issuer claim (optional, adjust as needed)
    }

    service_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    print("Generated Service Token:")
    print(service_token)
    print(f"\nExpiration: {expiration_time.isoformat()}")
    print(f"User ID in token: {SERVICE_USER_ID}")
    print("\n>>> Action Required: Copy the generated token above <<<")
    print(">>> Set it as the 'CV_SERVICE_AUTH_TOKEN' environment variable for the AI service in Railway. <<<")
