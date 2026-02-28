from app.database import SessionLocal, engine
from app import models

# 1. Ensure tables exist
print("Checking tables...")
models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Define our 3 Test Clients
    tenants_data = [
        {"id": 1, "name": "Starbucks Chennai", "place_id": "sim_starbucks_001", "plan": "premium"},
        {"id": 2, "name": "Dominos Pizza",     "place_id": "sim_dominos_002",   "plan": "basic"},
        {"id": 3, "name": "Hilton Hotel",      "place_id": "sim_hilton_003",    "plan": "pro"},
    ]

    print("--- Seeding 3 Tenants ---")
    for t_data in tenants_data:
        # Check if exists
        tenant = db.query(models.Tenant).filter(models.Tenant.id == t_data["id"]).first()
        
        if not tenant:
            new_tenant = models.Tenant(
                id=t_data["id"], # Force ID 1, 2, 3
                name=t_data["name"],
                api_key=f"key_{t_data['place_id']}",
                place_id=t_data["place_id"],
                is_active=True,
                subscription_plan=t_data["plan"]
            )
            db.add(new_tenant)
            print(f"✅ Created: {t_data['name']}")
        else:
            print(f"ℹ️ Exists: {t_data['name']}")

    db.commit()
    db.close()

if __name__ == "__main__":
    seed_data()