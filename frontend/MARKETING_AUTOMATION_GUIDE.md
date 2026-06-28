# How to Build the Marketing Automations Backend

You have successfully added the **Marketing Automations** tab to the Kate AOS dashboard! 

Because these automations happen *in the background* (even when your computer is turned off), they cannot run inside this React frontend. They must run on a server. 

Since you are already using Firebase, the easiest and cheapest way to build this is using **Google Cloud Functions for Firebase**.

Here is the exact architecture you need to build to make those toggle switches work in real life:

---

## 1. Instant Lead Follow-up Call
**Goal:** When someone fills out the contact form, the AI calls them immediately.

**How to build it:**
1. Write a Firebase Cloud Function that listens for `onDocumentCreated` in the `leads` collection.
2. When a new lead is saved, the function grabs the `phone` number from the document.
3. The function uses the Twilio REST API to initiate an outbound call:
   ```javascript
   client.calls.create({
      to: lead.phone,
      from: yourTwilioNumber,
      url: 'https://your-cloud-run-server.com/twiml/outbound'
   });
   ```
4. When the user answers, Twilio connects to your Node.js bridge server (the one we discussed in `TWILIO_SETUP.md`), which connects them to the Gemini Live API.
5. You pass a custom system prompt to Gemini for this specific call: *"You are calling Jane Doe who just filled out a form on our website. Ask her how you can help and offer to transfer her to a human."*

---

## 2. Pre-Appointment Voice Reminders
**Goal:** Call clients 24 hours before their appointment.

**How to build it:**
1. You cannot use a database trigger for this because it happens based on *time*, not a database change.
2. Instead, you use **Google Cloud Scheduler** (which acts like a cron job).
3. Set the scheduler to run a Cloud Function every hour.
4. The Cloud Function queries the `appointments` collection: *"Find all appointments where `dateTime` is between 23 and 24 hours from right now."*
5. For every appointment it finds, it triggers the exact same Twilio outbound call logic as above.
6. The custom Gemini prompt for this call: *"You are calling Bob Jones to remind him of his Strategy Review tomorrow at 2:30 PM. Ask him to confirm."*

---

## 3. Reputation Marketing (Review Requests)
**Goal:** Send an SMS asking for a review after an appointment is finished.

**How to build it:**
1. Write a Firebase Cloud Function that listens for `onDocumentUpdated` in the `appointments` collection.
2. The function checks if the `status` field changed from "Scheduled" to "Completed".
3. If it did, the function uses the Twilio SMS API to send a text message:
   ```javascript
   client.messages.create({
      body: 'Hi Bob, thanks for visiting us today! If you had a great experience, please leave us a review here: https://g.page/r/your-link',
      from: yourTwilioNumber,
      to: appointment.phone
   });
   ```

### Summary
By combining **Firebase Cloud Functions** (to watch the database) with **Twilio** (to make the calls/texts) and **Gemini Live API** (to do the talking), you can completely automate your customer lifecycle!
