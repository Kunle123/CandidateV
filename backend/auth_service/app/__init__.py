"""
CandidateV Authentication Service
"""
from importlib import import_module

# Import the app from main.py
try:
    # Try to import from app.main
    from .main import app
except ImportError:
    # If it fails, set app to None
    app = None 