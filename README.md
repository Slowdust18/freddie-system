

# 🤖 Freddie AI: Full-Stack Setup & Hand-off Guide

## 📋 Project Status: "The 2nd Security Gate"
* **The Code:** 100% complete and containerized.
* **The "Write" Access:** Currently hitting **429/403** errors. This is **expected**. 
* **The Reason:** Google has set the API quota to **0**. We are awaiting manual whitelisting via **Case ID: [INSERT_ID_HERE]**.
* **The Architecture:** Freddie uses the **Places API** to read reviews (Public) and the **Business Profile API** to reply via **Store Codes** (Private).

---

## 🔑 Environment Configuration (`.env`)
Create a `.env` file in the root directory. These keys allow Freddie to talk to Google and OpenAI.

```env
# --- AI & DATABASE ---
OPENAI_API_KEY=sk-xxxx...
DATABASE_URL=postgresql://postgres:postgres@db:5432/freddie_db

# --- GOOGLE OAUTH CREDENTIALS ---
GOOGLE_CLIENT_ID=xxxx...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx...
GOOGLE_REFRESH_TOKEN=1//xxxx... # This is the "Master Key"

# --- BUSINESS TARGETING (Kolapasi Anna Nagar) ---
GOOGLE_ACCOUNT_ID=[INSERT_ACCOUNT_ID_FROM_DASHBOARD_URL]
GOOGLE_LOCATION_ID=04021770670292508271 # Anna Nagar Store Code
```

---

## 🐳 Docker Management
| Action | Command |
| :--- | :--- |
| **Start/Rebuild** | `docker-compose up --build -d` |
| **View Live Logs** | `docker-compose logs -f api` |
| **Run Live Test** | `docker-compose exec api python trigger_live.py` |
| **Access Database** | Browse to `localhost:8080` (Adminer) |

---

## 🏦 For the Client: The "Bank Vault" Analogy
If the client asks why we aren't "Live" yet despite having email access, explain it this way:
* **The Email Login:** This is the **front door key** to the bank. We can walk in and look around (Read reviews).
* **Freddie (The API):** This is an **Armored Truck** coming to move money automatically.
* **The Case ID:** Even if you own the bank, the armored truck needs a **special permit** from the central office (Google) to enter the vault. We have applied for the permit and are waiting for the gate to open.

---

## 🛠️ Maintenance & Troubleshooting
### **1. Refreshing the Token**
The system auto-refreshes using the `GOOGLE_REFRESH_TOKEN`. If you ever get a **401 Unauthorized** that persists:
1. Go to [OAuth Playground](https://developers.google.com/oauthplayground/).
2. Use the Client ID/Secret from the `.env`.
3. Authorize `https://www.googleapis.com/auth/business.manage`.
4. Exchange the code and update the `GOOGLE_REFRESH_TOKEN` in `.env`.

### **2. 403 / 429 Errors**
**Do not change the code.** These errors mean Google's "Gate" is still closed. Once the Case ID is approved, these will automatically turn into `200 OK`.

### **3. Database Reset (To re-run tests)**
Freddie ignores reviews he has already processed. To force him to re-generate replies for a demo:
```powershell
docker-compose exec db psql -U postgres -d freddie_db -c "DELETE FROM review_logs;"
```

---

## 💻 The Demo Strategy (While Blocked)
If you need to show progress:
1. Run `trigger_live.py`. It will fetch reviews and generate AI replies.
2. It will fail to post to Google (403/429).
3. Open **Adminer** (`localhost:8080`) and show the `review_logs` table.
4. **Point to the `ai_reply` column.** This proves the AI is working perfectly and the responses are ready to be pushed the second Google approves the permit.

***
