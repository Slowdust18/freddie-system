import requests
import random
import time

# Point this to your FastAPI backend
BASE_URL = "http://localhost:8000"

# A bank of realistic reviews
REVIEW_BANK = [
    {"reviewer_name": "Tom H.", "star_rating": 5, "review_text": "Absolutely fantastic experience! Highly recommend to everyone."},
    {"reviewer_name": "Sarah J.", "star_rating": 2, "review_text": "Service was incredibly slow today. Waited way too long."},
    {"reviewer_name": "David K.", "star_rating": 4, "review_text": "Good overall, but a little on the pricey side for what you get."},
    {"reviewer_name": "Emily R.", "star_rating": 1, "review_text": "Horrible! Nobody helped me for 20 minutes. I just walked out."},
    {"reviewer_name": "Marcus T.", "star_rating": 5, "review_text": "The staff was super friendly and everything was perfect. 10/10!"}
]

def run_live_simulation():
    print("🚀 STARTING FREDDIE LIVE DEMO SIMULATION\n" + "="*45)
    
    # 1. Fetch ALL clients dynamically (Active and Inactive)
    print("📡 Fetching complete client roster from the database...")
    try:
        response = requests.get(f"{BASE_URL}/api/admin/outlets")
        response.raise_for_status()
        all_outlets = response.json()
    except Exception as e:
        print(f"❌ Failed to connect to backend: {e}")
        return

    if not all_outlets:
        print("⚠️ No clients found! Please onboard a client from the dashboard first.")
        return
        
    print(f"✅ Found {len(all_outlets)} total clients. Commencing stress test...\n")

    # 2. Fire reviews at EVERY client to test system robustness
    for outlet in all_outlets:
        review = random.choice(REVIEW_BANK)
        
        # Visual badge for the terminal output
        status_badge = "🟢 ACTIVE" if outlet.get('is_active') else "🔴 PAUSED"
        
        print(f"🏢 TARGET: {outlet['name']} | Status: {status_badge} (Client ID: {outlet['id']})")
        print(f"   💬 INCOMING: {review['star_rating']}-Star Review from {review['reviewer_name']}")
        print("   ⚙️ Routing to Core AI Engine...")
        
        # Add a dramatic pause to simulate network latency
        time.sleep(1.5) 
        
        # Hit the simulation endpoint
        sim_url = f"{BASE_URL}/simulate/incoming-review?tenant_id={outlet['id']}"
        res = requests.post(sim_url, json=review)
        
        if res.status_code == 200:
            data = res.json()
            # If the backend processed it, ai_triggered will be True
            if data.get("ai_triggered"):
                print("   ✨ SUCCESS: AI intercepted, drafted context-aware response, and published!\n")
            else:
                # If ai_triggered is False, it means our backend Kill Switch blocked it
                print("   🛡️ SYSTEM GUARDRAIL ENGAGED: Client subscription is paused. Review dropped to save API costs.\n")
                print(data)
        else:
            print(f"   ❌ FAILED: {res.text}\n")
            
        time.sleep(1) # Breath between clients

    print("🎉 DEMO SIMULATION COMPLETE! Check your Next.js dashboard to view the logs.")
    print("="*45)

if __name__ == "__main__":
    run_live_simulation()