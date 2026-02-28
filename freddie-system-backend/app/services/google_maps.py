import requests
import os

# Load Key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

def search_business(query: str):
    """
    Searches for a business and returns its Name and Place ID.
    Equivalent to your PowerShell test.
    """
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.id,places.formattedAddress"
    }
    
    payload = {"textQuery": query}
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return data.get("places", [])
    else:
        print(f"Google Error: {response.text}")
        return []

def get_google_reviews(place_id: str):
    """
    Fetches the 5 most recent reviews for a specific Place ID.
    """
    # Note: We query a specific place by ID
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        # We specifically ask for reviews here
        "X-Goog-FieldMask": "reviews.name,reviews.relativePublishTimeDescription,reviews.rating,reviews.text,reviews.authorAttribution"
    }
    
    # We use GET for details, but Places New API often uses GET with field mask
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return data.get("reviews", [])
    else:
        print(f"Error fetching reviews: {response.text}")
        return []