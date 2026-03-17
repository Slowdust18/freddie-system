from app.database import SessionLocal
from app.services.review_processor import fetch_and_process_google

def run_live_test():
    db = SessionLocal()
    
    # Change these to match Kolapasi's exact details from your database!
    KOLAPASI_TENANT_ID = 4  # Look at your dashboard to see what ID they were assigned
    KOLAPASI_PLACE_ID = "ChIJ6d-mz8VlUjoRfZ3l33GORjk" 
    
    print(f"🚀 Reaching out to live Google servers for Place ID: {KOLAPASI_PLACE_ID}...")
    
    try:
        result = fetch_and_process_google(db=db, tenant_id=KOLAPASI_TENANT_ID, place_id=KOLAPASI_PLACE_ID)
        print(f"✅ Success: {result}")
    except Exception as e:
        print(f"❌ Live fetch failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_live_test()