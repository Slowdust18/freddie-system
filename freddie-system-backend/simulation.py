import random
import uuid
import time
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.services import review_processor

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
    "Not worth the price. Very disappointed."
]

NAMES = ["Arun", "Priya", "John", "Sarah", "Mohamed", "Lakshmi", "David", "Anita"]

def generate_random_reviews(count=2):
    reviews = []
    for _ in range(count):
        is_good = random.choice([True, False, True])
        text = random.choice(POSITIVE_TEXTS) if is_good else random.choice(NEGATIVE_TEXTS)
        stars = random.randint(4, 5) if is_good else random.randint(1, 3)
        
        reviews.append({
            "review_id": f"sim_{uuid.uuid4().hex[:8]}",
            "reviewer_name": random.choice(NAMES),
            "rating": stars,
            "text": text
        })
    return reviews

def run_simulation_cycle():
    db = SessionLocal()
    print("\n🚀 STARTING SIMULATION CYCLE...")
    
    # 1. The outside world (Google) tries to send data for everyone
    tenants = db.query(models.Tenant).order_by(models.Tenant.id.asc()).all()

    for tenant in tenants:
        print(f"\n--- 🌍 Outside World pushing data for: {tenant.name} ---")
        fake_reviews = generate_random_reviews(random.randint(1, 2))
        
        # 2. Push directly into the Core Engine (Let the engine decide if it should process)
        review_processor.process_review_batch(
            db=db,
            tenant_id=tenant.id,
            reviews_list=fake_reviews
        )

    db.close()
    print("\n💤 Cycle Complete. Sleeping for 30 seconds...")

if __name__ == "__main__":
    print("🤖 Freddie Dumb-Pipe Simulator Started!")
    while True:
        try:
            run_simulation_cycle()
            time.sleep(30)
        except KeyboardInterrupt:
            break