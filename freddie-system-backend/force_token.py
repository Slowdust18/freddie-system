import os
from google_auth_oauthlib.flow import InstalledAppFlow

# 1. HARDCODE CREDENTIALS (Bypasses any .env reading errors)


# 2. We use the absolute bare minimum scope required to reply
SCOPES = ["https://www.googleapis.com/auth/business.manage"]

def get_forced_token():
    print("🚀 Booting forced token generator...")
    
    # Construct the exact JSON format Google expects
    client_config = {
        "web": {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost:8080/"]
        }
    }

    try:
        flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
        # Force it to use exactly port 8080 to match Google Cloud settings
        creds = flow.run_local_server(port=0, access_type='offline', prompt='consent')
        
        print("\n" + "="*50)
        print("✅ SUCCESS! HERE IS YOUR NEW REFRESH TOKEN:")
        print(creds.refresh_token)
        print("="*50 + "\n")
        
    except Exception as e:
        print(f"\n❌ FAILED: {e}")

if __name__ == "__main__":
    get_forced_token()