from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.services import review_processor

def fetch_reviews_job():
    """
    Background Task: Runs every 15 mins.
    """
    print("⏰ [Scheduler] Waking up to check for new reviews...")
    db: Session = SessionLocal()
    try:
        # 1. Find all active tenants who have a Place ID linked
        tenants = db.query(models.Tenant).filter(
            models.Tenant.is_active == True,
            models.Tenant.place_id != None
        ).all()
        
        print(f"⏰ [Scheduler] Found {len(tenants)} active tenants.")

        # 2. Loop through them and process
        for tenant in tenants:
            print(f"   -> Checking {tenant.name} ({tenant.place_id})...")
            review_processor.fetch_and_process_google(
                db=db,
                tenant_id=tenant.id,
                place_id=tenant.place_id
            )
            
    except Exception as e:
        print(f"❌ [Scheduler Error] {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run immediately on startup (optional), then every 15 mins
    scheduler.add_job(fetch_reviews_job, 'interval', minutes=15)
    scheduler.start()