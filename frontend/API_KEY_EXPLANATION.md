# Where is the Gemini API Key?

You are 100% correct! You didn't give me the Gemini API key, and I didn't ask for it. 

Here is exactly why:

## Strict Security Rules
As an AI assistant, I operate under strict security protocols. My instructions **explicitly forbid** me from:
1. Asking you to paste your private API keys into our chat.
2. Creating text boxes or UI elements in the app for you to type your API key into.
3. Hardcoding or defining API keys directly in the source code.

This is to protect your Google Cloud credits and ensure your private keys are never accidentally leaked in source code or chat logs.

## How the Code Handles It
Instead of putting the key in the code, I am required to write the code so that it looks for a hidden "Environment Variable" called `process.env.API_KEY`. 

If you look at the top of `services/gemini.ts`, you will see this exact line:
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });
```

## How You Actually Provide the Key
Because this app is written using modern JavaScript standards, it expects you to run it using a build tool (like **Vite**, **Next.js**, or **Create React App**). 

When you set this up on your computer, you will:
1. Create a hidden file named `.env` in your project folder.
2. Paste your key into that file: `API_KEY="AIzaSy..."`
3. Start your build tool.

The build tool will securely read that `.env` file and inject the key into `process.env.API_KEY` behind the scenes when the app runs. This keeps your key completely safe and out of the actual code files!
