import requests
from app.services.google_maps import get_fresh_oauth_token

def find_my_business():
    token = get_fresh_oauth_token()
    if not token:
        print("❌ Could not get token.")
        return

    headers = {"Authorization": f"Bearer {token}"}

    print("🔍 Searching for your Private Google Business Accounts...")
    
    # 1. Fetch Accounts
    acc_url = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts"
    acc_res = requests.get(acc_url, headers=headers)
    
    if acc_res.status_code != 200:
        print(f"❌ Failed to fetch accounts: {acc_res.text}")
        print("⚠️ You may need to enable the 'My Business Account Management API' in Google Cloud.")
        return

    accounts = acc_res.json().get('accounts', [])
    if not accounts:
        print("❌ No accounts found! Ensure the email you logged in with manages Kolapasi.")
        return

    # 2. Fetch Locations for each Account
    for acc in accounts:
        print(f"\n🏢 Account Name: {acc.get('accountName')} | Account ID: {acc.get('name')}")
        
        loc_url = f"https://mybusinessbusinessinformation.googleapis.com/v1/{acc['name']}/locations?readMask=name,title"
        loc_res = requests.get(loc_url, headers=headers)
        
        if loc_res.status_code == 200:
            locations = loc_res.json().get('locations', [])
            for loc in locations:
                print(f"   📍 Location: {loc.get('title')}")
                print(f"   🔑 PRIVATE ID: {loc.get('name')}\n")
        else:
            print(f"   ❌ Could not fetch locations for this account: {loc_res.text}")
            print("   ⚠️ You may need to enable the 'My Business Business Information API' in Google Cloud.")

if __name__ == "__main__":
    find_my_business()