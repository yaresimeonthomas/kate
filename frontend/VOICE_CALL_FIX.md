# Why did the Voice Call end while I was speaking?

You mentioned that the voice call was ending prematurely while you were still speaking. 

This is a very common issue when building Web Audio applications in React, and it is caused by **Browser Garbage Collection**.

### The Problem
When you click "Start Voice Call", the app creates a `ScriptProcessorNode`. This is a tiny piece of code that takes the audio from your microphone, chops it into little pieces, and sends it to the Gemini Live API.

However, because React components re-render frequently, the browser sometimes looks at that `ScriptProcessorNode` and thinks, *"Oh, this variable isn't attached to anything permanent anymore. I'm going to delete it to save memory."* (This is called Garbage Collection).

When the browser deletes it, the audio stream silently stops. The Gemini API suddenly hears dead silence, assumes you hung up or lost connection, and closes the WebSocket, ending the call!

### The Fix
I have updated both the `UniversalChatWidget.tsx` and the `FrontDeskView.tsx` to store the audio nodes inside a React `useRef`. 

```typescript
// This tells the browser: "Do NOT delete this, I am still using it!"
audioNodesRef.current = { source, scriptProcessor };
```

By keeping a strong reference to the audio processor, the browser will no longer delete it while you are speaking, and your calls will stay connected until you explicitly click "End Call"!
