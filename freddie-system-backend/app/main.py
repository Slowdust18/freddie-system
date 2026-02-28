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

# Create tables on startup
models.Base.metadata.create_all(bind=database.engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Application Starting: Initializing Scheduler...")
    scheduler.start_scheduler()
    yield
    print("🛑 Application Shutdown: Stopping Scheduler...")

# Initialize App with the Scheduler
app = FastAPI(
    title="Freddie Backend", 
    version="1.0", 
    lifespan=lifespan
)

# --- ADD THIS CORS BLOCK ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Default for React/Next.js
        "http://localhost:5173",  # Default for Vite
        # Add any other ports your frontend might use here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------------------

# Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create demo user on startup
def create_demo_user():
    db = database.SessionLocal()
    try:
        # Check if demo user exists
        user = db.query(models.User).filter(models.User.email == "demo@freddie.ai").first()
        if not user:
            demo_user = models.User(
                email="demo@freddie.ai",
                hashed_password=hash_password("password123"),
                role="admin",
                outlet_id=None,
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            print("✅ Demo user created: demo@freddie.ai / password123")
    finally:
        db.close()

create_demo_user()

# --- 2. AUTH ENDPOINTS ---

@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint: Authenticate user and return JWT token.
    """
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})
    
    return schemas.LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserOut(
            id=user.id,
            email=user.email,
            role=user.role,
            outlet_id=user.outlet_id
        )
    )

# --- 3. ADMIN & SUBSCRIPTION ENDPOINTS ---

@app.post("/admin/subscription/toggle")
def toggle_subscription(tenant_api_key: str, active: bool, db: Session = Depends(get_db)):
    """
    Admin Switch: Turn a user's subscription ON or OFF.
    """
    tenant = db.query(models.Tenant).filter(models.Tenant.api_key == tenant_api_key).first()
    if not tenant:
        # Auto-create for testing if they don't exist
        tenant = models.Tenant(name="New Client", api_key=tenant_api_key, is_active=active)
        db.add(tenant)
    else:
        tenant.is_active = active
    
    db.commit()
    status = "ACTIVATED" if active else "PAUSED"
    return {"message": f"Subscription for {tenant.api_key} is now {status}"}

# --- 4. WEBHOOKS (Direct Integration) ---

@app.post("/webhook/process-review")
def process_review_webhook(
    review: schemas.ReviewInput, 
    x_api_key: str = Header(None), 
    db: Session = Depends(get_db)
):
    """
    Push Endpoint: For when you want to send a single review immediately (via Zapier/Postman).
    Includes Subscription Checks.
    """
    # A. AUTH CHECK
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API Key")
        
    tenant = db.query(models.Tenant).filter(models.Tenant.api_key == x_api_key).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    if not tenant.is_active:
        raise HTTPException(status_code=403, detail="SUBSCRIPTION_INACTIVE: Please renew payment.")

    # B. DUPLICATE CHECK
    exists = db.query(models.ReviewLog).filter(
        models.ReviewLog.tenant_id == tenant.id,
        models.ReviewLog.google_review_id == review.google_review_id
    ).first()
    
    if exists:
        return {"status": "Ignored", "reason": "Duplicate"}

    # C. AI GENERATION
    ai_reply = ai_service.generate_reply(review.reviewer_name, review.star_rating, review.review_text)

    # D. ALERTING
    alert_sent = False
    if review.star_rating <= 3:
        # Placeholder for alert logic
        alert_sent = True

    # E. SAVE LOG
    log = models.ReviewLog(
        tenant_id=tenant.id,
        google_review_id=review.google_review_id,
        reviewer_name=review.reviewer_name,
        star_rating=review.star_rating,
        ai_response_generated=ai_reply,
        whatsapp_alert_sent=alert_sent,
        status="Success"
    )
    
    db.add(log)
    db.commit()
    
    return {"status": "Processed", "ai_reply": ai_reply}


# --- 5. TEST TOOLS (Google & AI) ---

@app.get("/test/google-search")
def test_search(query: str):
    """Verify backend can see Google Maps."""
    results = google_maps.search_business(query)
    return {"found": len(results), "results": results}

@app.get("/test/get-reviews")
def test_reviews(place_id: str):
    """Verify backend can pull reviews."""
    reviews = google_maps.get_google_reviews(place_id)
    return {"count": len(reviews), "reviews": reviews}

@app.post("/test/ai-reply")
def test_ai_reply(review: schemas.ReviewInput):
    """Test the AI Brain directly."""
    reply = ai_service.generate_reply(
        name=review.reviewer_name,
        rating=review.star_rating,
        text=review.review_text
    )
    return {"ai_generated_reply": reply}


# --- 6. AUTOMATION ENDPOINTS (Sync & Sim) ---

@app.post("/run-sync")
def run_sync(place_id: str, tenant_id: int = 1, db: Session = Depends(get_db)):
    """
    Manually triggers the Scheduler Logic (Fetch Google -> AI -> DB).
    """
    result = review_processor.fetch_and_process_google(
        db=db, 
        tenant_id=tenant_id, 
        place_id=place_id
    )
    return result

# Simulator Schema
class SimulatedReviewInput(BaseModel):
    reviewer_name: str
    star_rating: int
    review_text: str

@app.post("/simulate/incoming-review")
def simulate_review(
    review: SimulatedReviewInput, 
    tenant_id: int = 1, 
    db: Session = Depends(get_db)
):
    """
    Injects fake reviews to test the system without waiting for Google.
    """
    fake_review = {
        "review_id": f"simulated_{uuid.uuid4()}",
        "reviewer_name": review.reviewer_name,
        "rating": review.star_rating,
        "text": review.review_text
    }
    
    count = review_processor.process_review_batch(
        db=db, 
        tenant_id=tenant_id, 
        reviews_list=[fake_review]
    )
    
    return {"status": "Simulated", "message": "Review injected", "ai_triggered": count > 0}


# --- 7. LOGS & HEALTH ---

@app.get("/logs", response_model=List[schemas.ReviewLogOut])
def get_review_logs(tenant_id: int = 1, limit: int = 20, db: Session = Depends(get_db)):
    """
    View the history of processed reviews.
    """
    logs = db.query(models.ReviewLog)\
        .filter(models.ReviewLog.tenant_id == tenant_id)\
        .order_by(models.ReviewLog.processed_at.desc())\
        .limit(limit)\
        .all()
    return logs

@app.get("/")
def read_root():
    return {"status": "Freddie System is Live 🚀", "docs": "/docs"}