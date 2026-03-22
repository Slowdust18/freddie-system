# 🤖 Freddie AI: Technical Hand-off & Project Status Report

## 📌 Project Overview
Freddie is a multi-tenant SaaS platform built to automate Google Business Profile review responses using OpenAI's GPT models. The core engineering is **100% complete**, containerized, and tested.

## 🚦 Current Status: [STALLED - GOOGLE REVIEW REQUIRED]
The project is currently in a "Mandatory Administrative Review" phase with Google. 
* **The Problem:** The API Quota for "Requests per minute" is currently set to **0**.
* **The Reason:** Google restricts "Write" actions (replying to reviews) for "External" and "Unverified" apps until manual business verification is completed.
* **The Evidence:** Verified via Google Cloud Console > APIs & Services > Quotas.

---

## 🏗️ Technical Architecture
The system is built as a microservice architecture using Docker:
* **API Service (Python):** Handles review fetching logic, OpenAI integration, and Google API calls.
* **Database (Postgres):** Stores review logs to prevent duplicate replies and manages tenant data.
* **Adminer:** Web-based database management UI (available at `http://localhost:8080`).

### **Environment Variables (.env)**
The system requires the following keys to function:
* `OPENAI_API_KEY`: The "Brain" for generating responses.
* `GOOGLE_CLIENT_ID` / `SECRET`: OAuth credentials from the Google Cloud Console.
* `GOOGLE_REFRESH_TOKEN`: The permanent master key that allows Freddie to act on behalf of the business.

---

## ✅ Completed Milestones
- [x] **Backend Engine:** Logic to fetch reviews via Place ID and Location ID is fully functional.
- [x] **AI Integration:** Context-aware reply generation using OpenAI is integrated.
- [x] **Dockerization:** Full environment setup (`docker-compose.yml`) is ready for deployment.
- [x] **Production Status:** OAuth Consent Screen has been moved from "Testing" to "In Production".
- [x] **Domain Assets:** `freddiebusiness.com` has been registered for the SaaS front-end.

---

## 📝 Remaining "Administrative" Roadmap
To go live, a Business Administrator must complete these non-coding steps:

1.  **Search Console Verification:** Complete the **DNS TXT record** verification for `freddiebusiness.com`. Google will not lift the quota until they verify ownership of this domain.
2.  **Privacy Policy:** Host a formal privacy policy at `https://freddiebusiness.com/privacy`. This is a hard requirement for Google API approval.
3.  **Quota Appeal:** Once the domain is verified, go to the Google Cloud Quotas page, select "Requests per minute," and click **Edit Quotas** to request an increase from 0 to 60.
4.  **Brand Verification:** Submit the app for official Google Brand Verification to remove the "Unverified App" warning for new customers.

---

## 🚀 How to Run (Post-Approval)
Once Google lifts the 0 quota:
1.  **Start Services:** `docker-compose up -d`
2.  **Trigger AI Processing:** `docker-compose exec api python trigger_live.py`
3.  **Monitor Output:** `docker-compose logs -f api`

---

## 🆘 Troubleshooting for Successor
* **Error 429 (Resource Exhausted):** The Quota is still 0. This is a Google permission issue, not a code bug.
* **Error 401 (Unauthorized):** The Refresh Token has been revoked or the session expired. Re-authenticate via OAuth Playground.
* **Error 403 (Forbidden):** The Google Account used does not have "Manager" or "Owner" permissions for the specific Location ID.

---
**Hand-off Date:** March 2026  
**Developer Note:** The code is production-ready. The remaining hurdles are strictly administrative and tied to Google's manual review process.
