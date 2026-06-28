import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { Message } from '../types.ts';
import { addAppointment } from './db.ts';

// The API key MUST be provided by the environment/bundler via process.env.API_KEY
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

// Define the tool that allows the AI to book appointments
export const bookAppointmentDeclaration: FunctionDeclaration = {
    name: 'bookAppointment',
    description: 'Book a new appointment for a client. Use this when a user asks to schedule or book an appointment.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            clientName: { type: Type.STRING, description: 'Name of the client' },
            dateTime: { type: Type.STRING, description: 'Date and time in ISO format (e.g., 2023-11-15T10:00)' },
            service: { type: Type.STRING, description: 'The service requested' }
        },
        required: ['clientName', 'dateTime', 'service']
    }
};

// Define the tool that allows the AI to transfer calls
export const transferCallDeclaration: FunctionDeclaration = {
    name: 'transferCall',
    description: 'Transfer the current phone call to a human, a specific department, or a staff member.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            departmentOrPerson: { type: Type.STRING, description: 'The name of the department or person to transfer to (e.g., "billing", "sales", "Sarah")' },
            reason: { type: Type.STRING, description: 'A brief reason for the transfer based on the conversation.' }
        },
        required: ['departmentOrPerson']
    }
};

export const sendMessageWithHistory = async (
    history: Message[],
    systemInstruction: string
): Promise<string> => {
    try {
        const contents: any[] = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        let response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ functionDeclarations: [bookAppointmentDeclaration, transferCallDeclaration] }]
            }
        });

        // Check if the model decided to call our tools
        if (response.functionCalls && response.functionCalls.length > 0) {
            const functionResponses: any[] = [];
            
            for (const call of response.functionCalls) {
                if (call.name === 'bookAppointment') {
                    const args = call.args as any;
                    console.log("🛠️ AI TOOL TRIGGERED: bookAppointment", args);
                    
                    try {
                        // 1. Execute the actual database write
                        await addAppointment({
                            clientName: args.clientName || 'Unknown Client',
                            dateTime: args.dateTime || new Date().toISOString(),
                            service: args.service || 'General Consultation',
                            status: 'Scheduled'
                        });
                        
                        console.log("✅ Database write successful!");
                        
                        // 2. Prepare the response to send back to the model
                        functionResponses.push({
                            functionResponse: {
                                id: call.id, // Pass the ID back so Gemini knows which call this answers
                                name: call.name,
                                response: { result: "Appointment successfully booked and saved to the Firestore database." }
                            }
                        });
                    } catch (err) {
                        console.error("❌ Database write failed:", err);
                        functionResponses.push({
                            functionResponse: {
                                id: call.id,
                                name: call.name,
                                response: { error: "Failed to save to database due to an internal error." }
                            }
                        });
                    }
                } else if (call.name === 'transferCall') {
                    const args = call.args as any;
                    console.log("🛠️ AI TOOL TRIGGERED: transferCall", args);
                    
                    // In the frontend mock, we just acknowledge it. 
                    // In the real Twilio backend, this is where you trigger the <Dial> TwiML.
                    functionResponses.push({
                        functionResponse: {
                            id: call.id,
                            name: call.name,
                            response: { result: `Call transfer initiated to ${args.departmentOrPerson}.` }
                        }
                    });
                }
            }

            if (functionResponses.length > 0) {
                // Append the model's exact output (which contains the functionCall parts)
                if (response.candidates && response.candidates[0].content) {
                    contents.push(response.candidates[0].content);
                }
                
                // Append the system's function response to the history
                contents.push({
                    role: 'user',
                    parts: functionResponses
                });

                // 3. Call the model again so it can generate a natural language confirmation
                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: contents,
                    config: {
                        systemInstruction: systemInstruction,
                        tools: [{ functionDeclarations: [bookAppointmentDeclaration, transferCallDeclaration] }]
                    }
                });
            }
        }

        return response.text || '';
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return `Error communicating with AI: ${error.message || 'Unknown error'}`;
    }
};

export const generateSocialPostWithHistory = async (
    history: Message[],
    prompt: string,
    systemInstruction: string
): Promise<{ text: string, imagePrompt: string } | null> => {
    try {
        const contents = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));
        
        contents.push({
            role: 'user',
            parts: [{ text: prompt }]
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: {
                            type: Type.STRING,
                            description: 'The text content of the social media post.'
                        },
                        imagePrompt: {
                            type: Type.STRING,
                            description: 'A short description of an image that would accompany this post.'
                        }
                    },
                    required: ['text', 'imagePrompt']
                }
            }
        });

        const jsonStr = response.text?.trim();
        if (jsonStr) {
            return JSON.parse(jsonStr);
        }
        return null;
    } catch (error) {
        console.error("Error generating social post:", error);
        return null;
    }
};

export const modifyWebTemplateWithHistory = async (
    history: Message[],
    prompt: string,
    currentHtml: string,
    systemInstruction: string
): Promise<{ blockId: string, newHtml: string } | null> => {
    try {
        const contents = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        const fullPrompt = `
User Request: ${prompt}

Current HTML Template:
\`\`\`html
${currentHtml}
\`\`\`

Identify which block needs to be changed based on the user request.
Return the blockId and the complete new HTML for that specific block.
`;
        contents.push({
            role: 'user',
            parts: [{ text: fullPrompt }]
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        blockId: {
                            type: Type.STRING,
                            description: 'The ID of the HTML block to modify (e.g., hero-block, features-block)'
                        },
                        newHtml: {
                            type: Type.STRING,
                            description: 'The complete, updated HTML code for this specific block.'
                        }
                    },
                    required: ['blockId', 'newHtml']
                }
            }
        });

        const jsonStr = response.text?.trim();
        if (jsonStr) {
            return JSON.parse(jsonStr);
        }
        return null;
    } catch (error) {
        console.error("Error modifying template:", error);
        return null;
    }
};
