import os
from datetime import datetime, timedelta, timezone
from app.database import SessionLocal
from app import models
from app.services.auth_service import hash_password

def seed_database():
    db = SessionLocal()
    try:
        # 1. Check if already seeded to prevent duplicates
        if db.query(models.Tenant).filter(models.Tenant.name == "The Rustic Bean Cafe").first():
            print("⚠️ Database is already seeded! Skipping.")
            return

        print("🌱 Injecting Demo Data...")

        # 2. Create Dummy Tenants (Outlets)
        cafe = models.Tenant(name="The Rustic Bean Cafe", place_id="ChIJ_dummy_cafe", subscription_plan="Premium", api_key="demo_key_cafe", is_active=True)
        garage = models.Tenant(name="AutoCare Garage", place_id="ChIJ_dummy_garage", subscription_plan="Basic", api_key="demo_key_garage", is_active=True)
        db.add_all([cafe, garage])
        db.commit()

        # 3. Create Dummy Outlet Managers
        cafe_manager = models.User(email="manager@rusticbean.com", hashed_password=hash_password("password123"), role="user", outlet_id=cafe.id, is_active=True)
        garage_manager = models.User(email="owner@autocare.com", hashed_password=hash_password("password123"), role="user", outlet_id=garage.id, is_active=True)
        db.add_all([cafe_manager, garage_manager])
        db.commit()

        # 4. Generate a History of Reviews (Without the review_text column)
        now = datetime.now(timezone.utc)
        reviews = [
            # Cafe Reviews
            models.ReviewLog(tenant_id=cafe.id, google_review_id="rev_1", reviewer_name="Alice Smith", star_rating=5, ai_response_generated="Thank you so much, Alice! We are thrilled you loved our coffee. See you next time!", status="Success", processed_at=now - timedelta(days=1)),
            models.ReviewLog(tenant_id=cafe.id, google_review_id="rev_2", reviewer_name="John Doe", star_rating=2, ai_response_generated="Hi John, we are so sorry about the long wait. We are working on improving our speed. Please reach out to us so we can make it right.", status="Success", processed_at=now - timedelta(hours=5), whatsapp_alert_sent=True),
            models.ReviewLog(tenant_id=cafe.id, google_review_id="rev_3", reviewer_name="Emma W.", star_rating=4, ai_response_generated="Hi Emma, thanks for the feedback! We are glad you enjoyed the pastries and will look into the noise levels.", status="Success", processed_at=now - timedelta(days=3)),
            
            # Garage Reviews
            models.ReviewLog(tenant_id=garage.id, google_review_id="rev_4", reviewer_name="Sarah Connor", star_rating=5, ai_response_generated="Sarah, thanks for trusting us with your car! Safe driving!", status="Success", processed_at=now - timedelta(days=2)),
            models.ReviewLog(tenant_id=garage.id, google_review_id="rev_5", reviewer_name="Mike T.", star_rating=1, ai_response_generated="Mike, this is completely unacceptable. Please contact our main office immediately so we can review the garage footage and cover any damages.", status="Success", processed_at=now - timedelta(hours=1), whatsapp_alert_sent=True),
        ]
        db.add_all(reviews)
        db.commit()

        print("✅ Seeding Complete! You now have sample outlets, users, and a populated review log.")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()