import os
import requests

# Load Google Public API Key (For Fetching)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

def get_fresh_oauth_token():
    """
    Trades the permanent Refresh Token for a temporary Access Token.
    This runs automatically behind the scenes before publishing.
    """
    token_url = "https://oauth2.googleapis.com/token"
    
    payload = {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "refresh_token": os.getenv("GOOGLE_REFRESH_TOKEN"),
        "grant_type": "refresh_token"
    }
    
    response = requests.post(token_url, data=payload)
    
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        print(f"❌ Critical Error: Could not refresh OAuth token! {response.text}")
        return None

def get_google_reviews(place_id: str):
    """
    READ: Fetches the most recent reviews for a specific Place ID using the Places API.
    Used by the core engine to monitor for new feedback.
    """
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "reviews.name,reviews.relativePublishTimeDescription,reviews.rating,reviews.text,reviews.authorAttribution"
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return data.get("reviews", [])
    else:
        print(f"❌ Error fetching Google reviews for {place_id}: {response.text}")
        return []

def publish_google_reply(review_name, reply_text, access_token):
    """
    review_name might come in as 'places/ChIJ.../reviews/Ci9...'
    We need it to be 'accounts/ACC_ID/locations/LOC_ID/reviews/Ci9...'
    """
    # 1. Extract the unique Review ID from the end of the string
    review_id = review_name.split('/')[-1]
    
    # 2. Hardcode the private path we found for this test
    # Replace these numbers with your actual Account ID and Store Code
    account_id = "12835766069274363665" 
    location_id = "04021770670292508271"
    
    # 3. Build the CORRECT Private URL
    target_url = f"https://mybusiness.googleapis.com/v4/accounts/{account_id}/locations/{location_id}/reviews/{review_id}/reply"
    
    print(f"🛠️ DEBUG - Fixed Target URL: {target_url}")
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {"comment": reply_text}
    
    response = requests.put(target_url, json=payload, headers=headers)
    
    if response.status_code == 200:
        print("✅ Successfully published reply to Google!")
        return True
    else:
        print(f"❌ Failed: {response.status_code} - {response.text}")
        return False