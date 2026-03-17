from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    """
    Represents a user account for the frontend.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user")  # 'admin' or 'user'
    outlet_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", backref="users")

class Tenant(Base):
    """
    Represents a client/user using your SaaS.
    """
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) 
    api_key = Column(String, unique=True, index=True)
    
    # --- NEW FIELD (Merged from your second definition) ---
    place_id = Column(String, nullable=True) 
    # ----------------------------------------------------

    is_active = Column(Boolean, default=True) 
    subscription_plan = Column(String, default="basic") 
    
    logs = relationship("ReviewLog", back_populates="tenant")

class ReviewLog(Base):
    """
    The history of reviews processed for each tenant.
    """
    __tablename__ = "review_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    
    google_review_id = Column(String, index=True)
    reviewer_name = Column(String)
    star_rating = Column(Integer)
    
    # Audit Trail
    ai_response_generated = Column(Text, nullable=True)
    whatsapp_alert_sent = Column(Boolean, default=False)
    status = Column(String, default="Success") 
    processed_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="logs")