from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# --- AUTH SCHEMAS ---

class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    role: str
    outlet_id: Optional[int] = None

    class Config:
        orm_mode = True

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# --- INPUT SCHEMAS (Data coming IN to the API) ---

class ReviewInput(BaseModel):
    google_review_id: str
    reviewer_name: str
    review_text: str
    star_rating: int

# --- OUTPUT SCHEMAS (Data going OUT to the user) ---

class ReviewLogOut(BaseModel):
    id: int
    tenant_id: int
    reviewer_name: str
    star_rating: int
    ai_response_generated: Optional[str] = None
    whatsapp_alert_sent: bool
    status: str
    processed_at: datetime

    class Config:
        # This tells Pydantic to read data from SQLAlchemy models
        orm_mode = True