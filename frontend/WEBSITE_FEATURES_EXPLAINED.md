# Website Features Explained

You asked to make sure the Contact Form and Appointment Booking blocks are on the website, functioning, and removable. 

**Good news: They are already there and fully functional!**

Here is exactly how they work:

### 1. They are already on the website
If you open the Web Design Agent and scroll down the preview page, you will see two sections:
* **`booking-block`**: A Calendly-style calendar where users can pick a date and time.
* **`contact-block`**: A standard "Get in Touch" form.

### 2. They are fully functional
Because the website preview runs inside an `<iframe>`, it normally can't talk to your database. To fix this, I wrote a custom JavaScript bridge inside the template.
* When you submit the **Contact Form**, the script securely beams the data to your React app, which saves it to the `leads` collection in Firestore. You can view these in the **Website Leads** tab on the dashboard.
* When you submit the **Booking Calendar**, it beams the data to your React app, which saves it to the `appointments` collection in Firestore. You can view these in the **Appointments** tab.

### 3. How to remove them (and add them back!)
I have updated the AI's logic so that it can safely remove and restore these blocks without breaking the page.

* **To remove a block:** Open the chat and say *"Remove the contact block"* or *"Delete the booking block"*. The AI will hide the block from the page.
* **To add it back:** Because the AI hides the block instead of permanently deleting its ID, you can simply say *"Add the contact block back"* and the AI will restore the HTML for that section!
