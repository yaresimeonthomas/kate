# How to Deploy Kate AOS to Your Own Domain

You are 100% correct. Web Audio APIs, microphone permissions, and WebSockets are notoriously strict. When running inside an embedded preview environment or a cloud IDE, browsers often throttle the connection or aggressively garbage-collect audio nodes, causing the exact voice drops you are experiencing.

Deploying this to a real domain with a secure HTTPS connection is the absolute best way to test the true performance of the Gemini Live Voice Agent.

Since you already have a Firebase project (`kate-aos-pwa`) set up for your database, the easiest, fastest, and **free** way to host this is using **Firebase Hosting**.

Here is the step-by-step guide to getting this live on your domain today:

## Step 1: Set up a local build environment
Right now, these files are running in an AI preview environment that magically compiles TypeScript (`.tsx`) into browser-readable JavaScript on the fly. To host it yourself, you need to build it.

1. Download and install [Node.js](https://nodejs.org/) on your computer.
2. Open your computer's Terminal (Mac) or Command Prompt (Windows).
3. Run this command to create a new React project using Vite:
   ```bash
   npm create vite@latest kate-aos -- --template react-ts
   ```
4. Move into the new folder:
   ```bash
   cd kate-aos
   ```
5. Install the required packages:
   ```bash
   npm install firebase @google/genai lucide-react
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

## Step 2: Copy your files over
1. Replace the contents of the generated `src` folder with all the `.tsx` and `.ts` files from this project (App.tsx, constants.ts, types.ts, the `components` folder, the `views` folder, and the `services` folder).
2. Open the `tailwind.config.js` file that was generated and update the `content` array so Tailwind knows where to look for your classes:
   ```javascript
   export default {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```
3. Create a `.env` file in the root folder and add your API keys:
   ```env
   VITE_API_KEY="your-google-cloud-api-key"
   VITE_ZERNIO_API_KEY="sk_your_zernio_key"
   VITE_ZERNIO_ACCOUNT_ID="acc_your_zernio_account"
   ```
   *(Note: You will need to update `services/gemini.ts` and `services/db.ts` to use `import.meta.env.VITE_API_KEY` instead of `process.env.API_KEY` since Vite uses a different syntax for environment variables).*

## Step 3: Build the App
Run this command to compile all your React and TypeScript code into highly optimized, browser-ready HTML and JavaScript:
```bash
npm run build
```
This will create a `dist` folder. This folder contains your actual, finished website!

## Step 4: Deploy to Firebase Hosting
1. Install the Firebase command-line tools:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in to your Google account:
   ```bash
   firebase login
   ```
3. Initialize Firebase in your project folder:
   ```bash
   firebase init hosting
   ```
   * It will ask you a few questions:
   * **Select a default Firebase project:** Choose `kate-aos-pwa`.
   * **What do you want to use as your public directory?** Type `dist` and hit Enter.
   * **Configure as a single-page app?** Type `y` (Yes).
   * **Set up automatic builds and deploys with GitHub?** Type `n` (No).
   * **File dist/index.html already exists. Overwrite?** Type `n` (No).

4. **Launch it!**
   ```bash
   firebase deploy
   ```

Firebase will upload your `dist` folder and give you a live, secure HTTPS URL (e.g., `https://kate-aos-pwa.web.app`). 

## Step 5: Connect Your Custom Domain
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Open your `kate-aos-pwa` project.
3. Click on **Hosting** in the left sidebar.
4. Click the **Add custom domain** button.
5. Enter your domain (e.g., `dashboard.yourdomain.com`) and follow the instructions to add the TXT/A records to your domain registrar (like GoDaddy or Namecheap).

Once the DNS propagates, your app will be live on your own domain, with a rock-solid HTTPS connection, and the Voice AI will perform significantly better!
