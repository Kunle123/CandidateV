"""
CandidateV Authentication Service
"""
from importlib import import_module

# Import the app from app.py
try:
    # First try to import from the current directory
    from .. import app as root_app
    app = getattr(root_app, 'app', None)
    
    # If not found, import from app.main
    if app is None:
        from .main import app
except ImportError:
    # Fallback to import from app.main
    try:
        from .main import app
    except ImportError:
        # If none of the above work, set app to None
        app = None 