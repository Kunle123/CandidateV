import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI(title="CandidateV Developer Portal")

# Mount static files
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")

# Directory containing contracts
contracts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "shared", "contracts")

# Serve contracts directory
app.mount("/contracts", StaticFiles(directory=contracts_dir), name="contracts")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the developer portal homepage."""
    with open(os.path.join(os.path.dirname(__file__), "index.html"), "r") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

@app.get("/auth/docs")
async def redirect_auth_docs():
    """Redirect to Authentication Service Swagger UI."""
    return RedirectResponse(url="http://localhost:8000/docs")

@app.get("/auth/redoc")
async def redirect_auth_redoc():
    """Redirect to Authentication Service ReDoc."""
    return RedirectResponse(url="http://localhost:8000/redoc")

@app.get("/users/docs")
async def redirect_users_docs():
    """Redirect to User Management Service Swagger UI."""
    return RedirectResponse(url="http://localhost:8001/docs")

@app.get("/users/redoc")
async def redirect_users_redoc():
    """Redirect to User Management Service ReDoc."""
    return RedirectResponse(url="http://localhost:8001/redoc")

@app.get("/cv/docs")
async def redirect_cv_docs():
    """Redirect to CV Management Service Swagger UI."""
    return RedirectResponse(url="http://localhost:8002/docs")

@app.get("/cv/redoc")
async def redirect_cv_redoc():
    """Redirect to CV Management Service ReDoc."""
    return RedirectResponse(url="http://localhost:8002/redoc")

@app.get("/export/docs")
async def redirect_export_docs():
    """Redirect to Export Service Swagger UI."""
    return RedirectResponse(url="http://localhost:8003/docs")

@app.get("/export/redoc")
async def redirect_export_redoc():
    """Redirect to Export Service ReDoc."""
    return RedirectResponse(url="http://localhost:8003/redoc")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True) 