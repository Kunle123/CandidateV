from pydantic import BaseModel
from typing import Optional

class TokenData(BaseModel):
    """Token data model."""
    sub: Optional[str] = None 