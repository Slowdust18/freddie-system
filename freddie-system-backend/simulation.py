import random
import uuid
import time
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.services import review_processor

# --- FAKE DATA LIBRARY ---
POSITIVE_TEXTS = [
    "Absolutely loved it! Will come again.",
    "Staff was super friendly and the place was clean.",
    "Best experience I've had in a long time.",
    "Five stars! Highly recommended.",
    "Great value for money."
]

NEGATIVE_TEXTS = [
    "Terrible service. Waited 30 minutes for water.",
    "Food was cold and tasteless.",
    "Rude staff and dirty tables.",
    "Not worth the price. Very disappointed.",
    "I will never come back here again."
]

NAMES = ["Arun", "Priya", "John", "Sarah", "Mohamed", "Lakshmi", "David", "Anita"]

def generate_random_reviews(count=5):
    """Generates a list of N random fake review objects"""
    reviews = []
    for _ in range(count):
        is_good = random.choice([True, False])
        text = random.choice(POSITIVE_TEXTS) if is_good else random.choice(NEGATIVE_TEXTS)
        stars = random.randint(4, 5) if is_good else random.randint(1, 2)
        
        reviews.append({
            "review_id": f"sim_{uuid.uuid4().hex[:8]}",
            "reviewer_name": random.choice(NAMES),
            "rating": stars,
            "text": text
        })
    return reviews

def run_simulation_cycle():
    db = SessionLocal()
    print("\n🚀STARTING SIMULATION CYCLE (Processing 3 Tenants)...")
    
    # 1. Get all active tenants
    tenants = db.query(models.Tenant).filter(models.Tenant.is_active == True).all()
    
    for tenant in tenants:
        print(f"\n--- 🏢 Tenant: {tenant.name} (ID: {tenant.id}) ---")
        
        # 2. Generate 5 random reviews
        fake_reviews = generate_random_reviews(5)
        
        # 3. Push them into the Core Processor
        # (This is the SAME function the real scheduler uses)
        review_processor.process_review_batch(
            db=db,
            tenant_id=tenant.id,
            reviews_list=fake_reviews
        )
        
        print(f"   ✅ Injected 5 reviews for {tenant.name}")

    db.close()
    print("\n💤 Cycle Complete. Sleeping...")

if __name__ == "__main__":
    # Infinite Loop: Runs every 10 seconds for testing
    while True:
        run_simulation_cycle()
        time.sleep(15) # Wait 15 seconds before next batch