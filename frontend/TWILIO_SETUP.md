# Connecting Twilio to the Gemini Live API

You asked if we should connect Twilio to the agent now. 

**Good news:** I have just built the **Gemini Live API** directly into the **Front Desk Agent** dashboard! You can click "Start Voice Call" right now to talk to the AI using your computer's microphone. It can even book appointments into your database using its voice!

### Why can't we connect Twilio directly in the browser?
Twilio is a phone network. When someone dials your Twilio phone number, Twilio needs a **public server URL** to send the audio data to via WebSockets. A React app running in a browser cannot receive incoming WebSocket connections from Twilio.

### How to set up the Twilio Backend
To connect a real phone number, you need a tiny Node.js server to act as a bridge between Twilio and Gemini. 

Here is the exact code you need to host on Google Cloud Run (or any Node.js server) to make it work.

#### 1. Install Dependencies
```bash
npm install express ws @google/genai dotenv
```

#### 2. The Bridge Server (`server.js`)
```javascript
import express from 'express';
import { WebSocketServer } from 'ws';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

// Twilio requires an endpoint to tell it what to do when a call comes in
app.post('/twiml', (req, res) => {
    res.type('text/xml');
    res.send(`
        <Response>
            <Connect>
                <Stream url="wss://${req.headers.host}/media" />
            </Connect>
        </Response>
    `);
});

const server = app.listen(port, () => console.log(`Server running on port ${port}`));
const wss = new WebSocketServer({ server, path: '/media' });

wss.on('connection', async (ws) => {
    console.log('Twilio connected to bridge.');
    let streamSid = null;

    // Connect to Gemini Live API
    const session = await ai.live.connect({
        model: 'gemini-live-2.5-flash-native-audio',
        config: {
            responseModalities: ["AUDIO"],
            systemInstruction: "You are a helpful front desk receptionist. Keep answers brief and conversational.",
        }
    });

    // 1. Receive Audio from Gemini -> Send to Twilio
    session.onmessage = (message) => {
        const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audioBase64 && streamSid) {
            // Twilio expects a specific JSON format for media
            ws.send(JSON.stringify({
                event: 'media',
                streamSid: streamSid,
                media: { payload: audioBase64 }
            }));
        }
    };

    // 2. Receive Audio from Twilio -> Send to Gemini
    ws.on('message', (message) => {
        const msg = JSON.parse(message);
        if (msg.event === 'start') {
            streamSid = msg.start.streamSid;
            console.log('Call started:', streamSid);
        } else if (msg.event === 'media') {
            // Send the raw base64 audio payload to Gemini
            session.sendRealtimeInput({
                media: {
                    mimeType: 'audio/pcm;rate=8000', // Twilio uses 8000Hz mulaw by default
                    data: msg.media.payload
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('Twilio disconnected.');
        session.close();
    });
});
```

#### 3. Connect it to Twilio
1. Deploy that code to Google Cloud Run.
2. Go to your Twilio Console -> Phone Numbers -> Manage -> Active Numbers.
3. Click your phone number.
4. Under "A CALL COMES IN", select "Webhook" and paste your Cloud Run URL: `https://your-cloud-run-url.com/twiml`
5. Call the number! You are now talking to Gemini.
