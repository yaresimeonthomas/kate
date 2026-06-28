# Why did the AI stop responding after a while?

You noticed that the voice agent would respond quickly at first, but if you talked for a while, it would stop typing and just sit there. 

This is caused by a technical issue called **WebSocket Flooding**. Here is exactly what was happening and how I fixed it!

### The Problem: WebSocket Flooding
In the previous version, the `AudioWorklet` was capturing your microphone and sending the audio to Gemini in microscopic chunks (128 frames at a time). 

At a standard sample rate, 128 frames is about **8 milliseconds** of audio. This means your browser was firing off `postMessage` and sending a WebSocket packet to Google's servers **125 times per second**.

At first, the servers can handle this. But as the conversation goes on, the sheer volume of tiny messages overwhelms the WebSocket connection. The browser's internal buffer fills up, the connection chokes, and Gemini silently drops the call. That is why the text stopped appearing!

### The Fix: Adding an Audio Buffer
I updated the `AudioWorklet` code inside `UniversalChatWidget.tsx` to include a **4096-frame buffer**.

Now, instead of sending 125 microscopic messages per second, the `AudioWorklet` collects your audio into a bucket. Once the bucket is full (which takes about 250 milliseconds), it sends one normal-sized chunk to Gemini. 

This reduces the network traffic from 125 messages per second down to just **4 messages per second**. 

This completely eliminates the lag, prevents the WebSocket from flooding, and ensures your voice calls stay connected indefinitely!
