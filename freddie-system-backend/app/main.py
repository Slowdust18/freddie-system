import os
import uuid
from typing import List
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Internal Imports
from . import models, schemas, database, scheduler
from .services import ai_service, whatsapp_service, google_maps, review_processor
from .services.auth_service import hash_password, verify_password, create_access_token

# --- 1. SETUP DATABASE & LIFESPAN ---
models.Base.metadata.create_all(bind=database.engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Application Starting: Initializing Scheduler...")
    scheduler.start_scheduler()
    yield
    print("🛑 Application Shutdown: Stopping Scheduler...")

app = FastAPI(title="Freddie Backend", version="1.0", lifespan=lifespan)

# --- DYNAMIC CORS SETUP ---
# Define trusted origins: Localhost + Whatever is in your .env file
origins = [
    "http://localhost:3000",
    "http://localhost:5173"
]

production_url = os.getenv("FRONTEND_URL")
if production_url:
    origins.append(production_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_master_admin():
    """
    Creates the definitive Master Admin account on startup using secure .env credentials.
    """
    db = database.SessionLocal()
    
    # Pull credentials from .env, with a fallback just in case
    admin_email = os.getenv("ADMIN_EMAIL", "admin@freddie.ai")
    admin_password = os.getenv("ADMIN_PASSWORD", "fallback_password_123")
    
    try:
        user = db.query(models.User).filter(models.User.email == admin_email).first()
        if not user:
            print(f"👑 Creating definitive Master Admin account for: {admin_email}")
            master_admin = models.User(
                email=admin_email,
                hashed_password=hash_password(admin_password),
                role="admin",
                outlet_id=None, # Master admins don't belong to a single outlet
                is_active=True
            )
            db.add(master_admin)
            db.commit()
    finally:
        db.close()

# Call the new function instead of create_demo_user()
create_master_admin()

# --- 2. AUTH ENDPOINTS ---
@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return schemas.LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserOut(id=user.id, email=user.email, role=user.role, outlet_id=user.outlet_id)
    )

# --- 3. ADMIN ENDPOINTS ---
@app.get("/api/admin/outlets")
def get_all_outlets(db: Session = Depends(get_db)):
    tenants = db.query(models.Tenant).order_by(models.Tenant.id.asc()).all()
    return [{"id": t.id, "name": t.name, "is_active": t.is_active, "subscription_plan": t.subscription_plan, "place_id": t.place_id} for t in tenants]

@app.post("/api/admin/outlets/{tenant_id}/toggle")
def toggle_subscription(tenant_id: int, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Outlet not found")
    tenant.is_active = not tenant.is_active
    db.commit()
    return {"id": tenant.id, "is_active": tenant.is_active, "message": f"{tenant.name} is now {'Active' if tenant.is_active else 'Paused'}"}

class OnboardingInput(BaseModel):
    name: str
    place_id: str
    plan: str
    email: str
    password: str

@app.post("/api/admin/onboard")
def onboard_client(data: OnboardingInput, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered in the system.")
        
    new_tenant = models.Tenant(name=data.name, place_id=data.place_id, subscription_plan=data.plan, api_key=f"key_{data.place_id}_{uuid.uuid4().hex[:8]}", is_active=True)
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    
    new_user = models.User(email=data.email, hashed_password=hash_password(data.password), role="user", outlet_id=new_tenant.id, is_active=True)
    db.add(new_user)
    db.commit()
    return {"status": "success", "message": f"Successfully onboarded {data.name}!"}

@app.get("/api/admin/logs")
def get_admin_logs(limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(models.ReviewLog).order_by(models.ReviewLog.processed_at.desc()).limit(limit).all()
    return [{
        "id": l.id,
        "outlet_name": l.tenant.name if l.tenant else "Unknown",
        "customer": l.reviewer_name,
        "rating": l.star_rating,
        "status": l.status,
        "date": l.processed_at.isoformat() if l.processed_at else None
    } for l in logs]

@app.get("/api/admin/accounts")
def get_admin_accounts(db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.id.asc()).all()
    return [{
        "id": u.id,
        "email": u.email,
        "role": u.role,
        "is_active": u.is_active,
        "outlet_id": u.outlet_id,
        "outlet_name": u.tenant.name if u.tenant else "Master Admin"
    } for u in users]

# --- 4. OUTLET OWNER ENDPOINTS ---
@app.get("/api/outlet/reviews")
def get_outlet_reviews(outlet_id: int, db: Session = Depends(get_db)):
    reviews = db.query(models.ReviewLog).filter(models.ReviewLog.tenant_id == outlet_id).order_by(models.ReviewLog.processed_at.desc()).limit(50).all()
    return [{
        "id": r.id,
        "customer_name": r.reviewer_name,
        "rating": r.star_rating,
        "text": r.review_text if hasattr(r, 'review_text') else "", 
        "ai_response": r.ai_response_generated,
        "status": r.status.lower() if hasattr(r, 'status') else "responded",
        "timestamp": r.processed_at.isoformat() if r.processed_at else None
    } for r in reviews]

# --- 5. WEBHOOKS & AUTOMATION ---
@app.post("/webhook/process-review")
def process_review_webhook(review: schemas.ReviewInput, x_api_key: str = Header(None), db: Session = Depends(get_db)):
    if not x_api_key: raise HTTPException(status_code=401, detail="Missing API Key")
    tenant = db.query(models.Tenant).filter(models.Tenant.api_key == x_api_key).first()
    if not tenant: raise HTTPException(status_code=404, detail="Tenant not found")
    if not tenant.is_active: raise HTTPException(status_code=403, detail="SUBSCRIPTION_INACTIVE: Please renew payment.")

    exists = db.query(models.ReviewLog).filter(models.ReviewLog.tenant_id == tenant.id, models.ReviewLog.google_review_id == review.google_review_id).first()
    if exists: return {"status": "Ignored", "reason": "Duplicate"}

    ai_reply = ai_service.generate_reply(review.reviewer_name, review.star_rating, review.review_text)

    log = models.ReviewLog(
        tenant_id=tenant.id, google_review_id=review.google_review_id,
        reviewer_name=review.reviewer_name, star_rating=review.star_rating,
        ai_response_generated=ai_reply, whatsapp_alert_sent=(review.star_rating <= 3), status="Success"
    )
    db.add(log)
    db.commit()
    return {"status": "Processed", "ai_reply": ai_reply}

class SimulatedReviewInput(BaseModel):
    reviewer_name: str
    star_rating: int
    review_text: str

@app.post("/simulate/incoming-review")
def simulate_review(review: SimulatedReviewInput, tenant_id: int = 1, db: Session = Depends(get_db)):
    fake_review = {"review_id": f"simulated_{uuid.uuid4()}", "reviewer_name": review.reviewer_name, "rating": review.star_rating, "text": review.review_text}
    count = review_processor.process_review_batch(db=db, tenant_id=tenant_id, reviews_list=[fake_review])
    return {"status": "Simulated", "message": "Review injected", "ai_triggered": count > 0}