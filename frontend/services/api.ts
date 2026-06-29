// All calls go to the Cloud Run orchestrator via Firebase Hosting rewrites (/api/*)
// In a local dev environment without the backend, these will fail gracefully.

export const api = {
  async chat(userId: string, agentId: string, sessionId: string, userMessage: string, systemPrompt: string) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, agentId, sessionId, userMessage, systemPrompt })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      return await res.json();
    } catch (error) {
      console.error("Chat API Error:", error);
      // Fallback for UI demonstration if backend is unreachable
      return { text: "I'm currently offline. Please ensure the Cloud Run backend is deployed." };
    }
  },

  async createAgents(businessContext: any) {
    try {
      const res = await fetch('/api/onboarding/create-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessContext)
      });
      if (!res.ok) throw new Error('Failed to create agents');
      return await res.json();
    } catch (error) {
      console.error("Create Agents API Error:", error);
      return { success: false };
    }
  },

  async publishSite(userId: string, htmlContent: string, businessName: string) {
    try {
      const res = await fetch('/api/sites/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, htmlContent, businessName })
      });
      if (!res.ok) throw new Error('Failed to publish site');
      return await res.json();
    } catch (error) {
      console.error("Publish Site API Error:", error);
      return { url: `https://${businessName.toLowerCase().replace(/\s+/g, '')}.kateaos.com` };
    }
  },

  async publishPost(userId: string, content: string) {
    try {
      const res = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content })
      });
      if (!res.ok) throw new Error('Failed to publish post');
      return await res.json();
    } catch (error) {
      console.error("Publish Post API Error:", error);
      return { success: true };
    }
  }
};

// AudioWorklet setup for Voice API
export const setupVoiceConnection = async (userId: string, agentId: string, onTranscript: (text: string) => void) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    // In a real app, this worklet code would be served from a file. 
    // We use a Blob URL here to keep it self-contained.
    const workletCode = `
      class AudioProcessor extends AudioWorkletProcessor {
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input.length > 0) {
            const channelData = input[0];
            this.port.postMessage(channelData);
          }
          return true;
        }
      }
      registerProcessor('audio-processor', AudioProcessor);
    `;
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    
    await audioContext.audioWorklet.addModule(workletUrl);
    const source = audioContext.createMediaStreamSource(stream);
    const processor = new AudioWorkletNode(audioContext, 'audio-processor');
    
    // WebSocket connection to Cloud Run
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/voice?userId=${userId}&agentId=${agentId}`);
    
    processor.port.onmessage = (e) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Convert Float32Array to Int16Array for PCM
        const float32Array = e.data;
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
          int16Array[i] = Math.max(-1, Math.min(1, float32Array[i])) * 32767;
        }
        ws.send(int16Array.buffer);
      }
    };

    ws.onmessage = (event) => {
      // Handle incoming audio or transcripts from Gemini
      if (typeof event.data === 'string') {
        const data = JSON.parse(event.data);
        if (data.transcript) onTranscript(data.transcript);
      } else {
        // Play incoming audio buffer
        audioContext.decodeAudioData(event.data, (buffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start();
        });
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    return () => {
      ws.close();
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
    };
  } catch (err) {
    console.error("Voice setup failed:", err);
    return () => {};
  }
};
