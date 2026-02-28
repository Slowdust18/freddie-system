from sqlalchemy.orm import Session
from .. import models, schemas
from . import google_maps, ai_service, whatsapp_service

def process_review_batch(db: Session, tenant_id: int, reviews_list: list):
    """
    CORE LOGIC: Takes a list of reviews (Real OR Simulated) and processes them.
    """
    processed_count = 0
    
    for review in reviews_list:
        # --- 1. Normalize Data (Handle both Google API format and Simulator format) ---
        
        # ID: Google uses 'name', Simulator uses 'review_id'
        review_id = review.get("name") or review.get("review_id")
        
        # Text: Google nests it inside {'text': {'text': '...'}}, Simulator sends straight string
        if "text" in review and isinstance(review["text"], dict):
            review_text = review["text"].get("text", "")
        else:
            review_text = review.get("text", "")
            
        # Name: Google nests inside 'authorAttribution', Simulator sends straight string
        if "authorAttribution" in review:
            reviewer_name = review["authorAttribution"].get("displayName", "Anonymous")
        else:
            reviewer_name = review.get("reviewer_name", "Anonymous")
            
        star_rating = review.get("rating", 0)
        
        # --- 2. Check Database (Deduplication) ---
        exists = db.query(models.ReviewLog).filter(
            models.ReviewLog.google_review_id == review_id
        ).first()
        
        if exists:
            # If it's a simulation, we might want to allow duplicates for testing, 
            # but for safety, we usually skip. (You can comment this out if you want to spam test).
            print(f"Skipping existing review: {review_id}")
            continue
            
        # --- 3. Process New Review ---
        print(f"Processing NEW review from {reviewer_name} ({star_rating} stars)")
        
        # A. Generate AI Reply
        ai_reply = ai_service.generate_reply(
            name=reviewer_name,
            rating=star_rating,
            text=review_text
        )
        
        # B. (Optional) Send WhatsApp Alert
        # We generally DON'T want to spam WhatsApp for simulated reviews, 
        # so we can check if the ID looks like a real Google ID (starts with 'places/')
        whatsapp_sent = False
        is_real_google_review = str(review_id).startswith("places/")
        
        if star_rating <= 3 and is_real_google_review:
            msg = f"Alert: New {star_rating}-star review from {reviewer_name}. AI Draft: {ai_reply[:50]}..."
            # whatsapp_service.send_alert("ADMIN_PHONE_NUMBER", msg) 
            whatsapp_sent = True

        # C. Save to Database
        db_log = models.ReviewLog(
            tenant_id=tenant_id,
            google_review_id=review_id,
            reviewer_name=reviewer_name,
            star_rating=star_rating,
            ai_response_generated=ai_reply,
            whatsapp_alert_sent=whatsapp_sent,
            status="Drafted"
        )
        
        db.add(db_log)
        processed_count += 1
    
    db.commit()
    return processed_count

def fetch_and_process_google(db: Session, tenant_id: int, place_id: str):
    """
    Fetches REAL data from Google and sends it to the processor.
    Used by the /run-sync endpoint.
    """
    print(f"--- Fetching Real Google Reviews for: {place_id} ---")
    real_reviews = google_maps.get_google_reviews(place_id)
    
    count = process_review_batch(db, tenant_id, real_reviews)
    
    return {"status": "success", "source": "Google API", "new_reviews_processed": count}