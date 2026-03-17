from sqlalchemy.orm import Session
from .. import models, schemas
from . import google_maps, ai_service

def process_review_batch(db: Session, tenant_id: int, reviews_list: list):
    """
    CORE LOGIC: Takes a list of reviews (Real OR Simulated) and processes them.
    Includes mandatory subscription guardrails.
    """
    # --- 1. SYSTEM GUARDRAIL: Enforce Kill Switch ---
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    
    if not tenant:
        print(f"❌ Core Engine: Tenant ID {tenant_id} not found. Dropping batch.")
        return 0
        
    if not tenant.is_active:
        print(f"🛑 Core Engine: {tenant.name} is PAUSED. Refusing to process {len(reviews_list)} incoming reviews.")
        return 0  # Kills the process immediately. OpenAI is never called.

    processed_count = 0
    
    for review in reviews_list:
        # --- 2. Normalize Data ---
        review_id = review.get("name") or review.get("review_id")
        
        # 🛑 NEW GUARDRAIL: Check if the business already replied!
        if "reviewReply" in review:
            print(f"⏭️ Skipping {review_id}: Business owner already replied historically.")
            continue
            
        if "text" in review and isinstance(review["text"], dict):
            review_text = review["text"].get("text", "")
        else:
            review_text = review.get("text", "")
            
        if "authorAttribution" in review:
            reviewer_name = review["authorAttribution"].get("displayName", "Anonymous")
        else:
            reviewer_name = review.get("reviewer_name", "Anonymous")
            
        star_rating = review.get("rating", 0)
        
        # --- 3. Check Database (Deduplication) ---
        exists = db.query(models.ReviewLog).filter(
            models.ReviewLog.google_review_id == review_id
        ).first()
        
        if exists:
            continue
            
        # --- 4. Process New Review ---
        print(f"⚙️ Core Engine: Processing NEW review from {reviewer_name} ({star_rating} stars)")
    
        # 4a. Generate the Reply
        ai_reply = ai_service.generate_reply(
            name=reviewer_name,
            rating=star_rating,
            text=review_text
        )
        
        # 4b. Fetch token and publish safely
        access_token = google_maps.get_fresh_oauth_token() 
        publish_success = False  # Default to False
        
        if access_token:
            publish_success = google_maps.publish_google_reply(
               review_name=review_id, 
               reply_text=ai_reply, 
               access_token=access_token
            )
        else:
            print("⚠️ Skipping Google publish: No access token available (Shadow Mode / Simulation).")

        # Determine actual status based on if Google accepted it
        final_status = "Success" if publish_success else "Failed to Publish"

        # 4c. Save to Database
        db_log = models.ReviewLog(
            tenant_id=tenant_id,
            google_review_id=review_id,
            reviewer_name=reviewer_name,
            star_rating=star_rating,
            ai_response_generated=ai_reply,
            whatsapp_alert_sent=False, 
            status=final_status  # <--- Now it tells the truth!
        )
        
        db.add(db_log)
        processed_count += 1
    
    db.commit()
    return processed_count

def fetch_and_process_google(db: Session, tenant_id: int, place_id: str):
    """
    Fetches REAL data from Google and sends it to the processor.
    """
    print(f"--- Fetching Real Google Reviews for: {place_id} ---")
    real_reviews = google_maps.get_google_reviews(place_id)
    count = process_review_batch(db, tenant_id, real_reviews)
    return {"status": "success", "source": "Google API", "new_reviews_processed": count}