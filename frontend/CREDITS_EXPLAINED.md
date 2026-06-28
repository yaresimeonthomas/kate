# Does the Gemini Live API use my $300 / $1000 Google Cloud Credits?

**YES! Absolutely.**

Here is how the billing works in the Google ecosystem:

1. **Google AI Studio (Free Tier / Pay-as-you-go):** This is the standard developer portal. It does *not* connect to your Google Cloud credits.
2. **Google Cloud Vertex AI:** This is the enterprise platform. Because you generated your API key inside the **Google Cloud Console** (for the `kate-aos-pwa` project), you are using Vertex AI.

### How your credits are applied:
Because your API key is tied to your Google Cloud project, **every single API call** (including the text agents, the web designer, and the new Gemini Multimodal Live API for voice calls) is billed directly to your Google Cloud Billing Account. 

Since you have the $300 free trial (or the $1,000 startup credits) applied to that billing account, **Google will automatically deduct the cost from your free credits first.** You will not be charged real money until those credits run out!

This makes it the perfect environment to build and scale your auto-pilot SaaS platform with zero upfront cost.
