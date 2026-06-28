# Why isn't the database saving?

If the AI is talking to you and saying "I booked the appointment," **your Gemini API key is in the right place and working perfectly!** 

The reason nothing is showing up in the database is because of **Firebase Security Rules**. 

By default, when you create a new Firebase Firestore database, Google locks it down completely. It sets a rule that says "Nobody is allowed to read or write to this database." Because our app runs in the browser, Firebase is blocking the app from saving the appointments and messages.

### How to fix it (Takes 30 seconds):

1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Open your **kate-aos-pwa** project.
3. In the left sidebar, click on **Firestore Database**.
4. At the top of the database page, click on the **Rules** tab.
5. You will see code that looks something like this:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if false; // <--- THIS IS THE PROBLEM
       }
     }
   }
   ```
6. Change the word `false` to `true`. It should look like this:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
7. Click the blue **Publish** button.

*Note: Setting it to `true` is called "Test Mode". It allows your app to work while you are building it. Before you launch a real company on this, you would change those rules to only allow logged-in users to read/write.*

### What I changed in the code:
I have updated the database file (`services/db.ts`) to specifically look for this "Permission Denied" error. If it happens again, it will now pop up an alert on your screen telling you that Firebase blocked the save! I also added a "Refresh" button to the Appointments page so you can easily check for new bookings.
