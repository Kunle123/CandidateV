from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World from user service"}

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "timestamp": "2025-04-10T12:00:00Z",
        "version": "1.0.0",
        "database_connection": "ok"
    }

@app.get("/api/users/me")
def get_current_user():
    return {
        "id": "test-user-id",
        "name": "Test User",
        "email": "test@example.com",
        "bio": "This is a test user",
        "profile_image_url": None,
        "job_title": "Test Engineer",
        "location": "Test City",
        "website": None,
        "social_links": {},
        "preferences": {"theme": "light", "notifications": True}
    } 