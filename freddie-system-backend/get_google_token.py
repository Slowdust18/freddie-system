import os
from dotenv import load_dotenv
from google_auth_oauthlib.flow import InstalledAppFlow

load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/business.manage']

def get_refresh_token():
    client_config = {
        "installed": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost:8080/"]
        }
    }

    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    
    # We are locking the port to 8080 so Google doesn't get confused
    creds = flow.run_local_server(port=8080)

    print("\n✅ AUTHENTICATION SUCCESSFUL!")
    print("-" * 50)
    print("Add this exact line to the bottom of your .env file:\n")
    print(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}")
    print("-" * 50)

if __name__ == '__main__':
    get_refresh_token()