# Kate AOS - Multi-Agent SaaS Dashboard

This application uses **Google Firebase Firestore** as its primary database for storing Appointments, Leads, and Social Media Posts. The codebase is fully wired to communicate with Firestore and Google Cloud Vertex AI.

## 🚀 The Future Vision & Roadmap
Want to know how to turn this into a fully automated SaaS platform with an Onboarding Agent, public-facing websites, and native Gemini phone calls? 

**👉 [Read the VISION_AND_ROADMAP.md file](./VISION_AND_ROADMAP.md) for the complete architectural guide.**

## 🌐 Ready to go live?
If you are experiencing audio drops or microphone permission issues in the preview environment, it is time to deploy the app to a real domain.

**👉 [Read the FINAL_DEPLOYMENT_STEPS.md file](./FINAL_DEPLOYMENT_STEPS.md) for step-by-step instructions on exporting this code and hosting it on Firebase.**

---

## Database Connection Status
✅ **Firebase is Connected!** 
Your specific `firebaseConfig` has been hardcoded into `services/db.ts`. The application will automatically connect to your `kate-aos-pwa` project.

## Agent Memory (Persistent Chat History)
✅ **Yes, every agent now stores information to Firestore!**
All four agents (Business Manager, Social Media, Web Design, and Front Desk) have been updated to save their conversation history directly to your Firestore database. 

## Step 1: Configure API Keys

### Local Development (Using `.env`)
If you are running this on your computer, create a `.env` file in the root of your project and add your keys like this:

```env
# Google Cloud Vertex AI Key (Yes, use the wordpressais-gemini-key!)
API_KEY="your-google-cloud-api-key"

# Zernio API Keys for Social Media Publishing
ZERNIO_API_KEY="sk_your_zernio_api_key_here"
ZERNIO_ACCOUNT_ID="acc_your_zernio_account_id_here"
```

### ☁️ Cloud Run Deployment
If you are hosting this on Google Cloud Run, you do **NOT** use a `.env` file. 
Instead, you inject the variables directly into the Cloud Run container:
1. Go to your Cloud Run service in the Google Cloud Console.
2. Click **Edit & Deploy New Revision**.
3. Scroll down to the **Variables & Secrets** tab.
4. Click **+ Add Variable**.
5. Name: `API_KEY`, Value: `your-gemini-key-here`.
6. Click **Deploy**. 

## Step 2: Run the App
Start your development server or deploy to Cloud Run. 

The application will automatically create the necessary collections (`appointments`, `leads`, `posts`, and `messages`) in your Firestore database as you interact with the dashboard!

## Important Security Note
Because your Firebase configuration is hardcoded in `services/db.ts`, ensure your **Firestore Security Rules** are properly configured in the Firebase Console to prevent unauthorized read/write access to your database in a production environment.
