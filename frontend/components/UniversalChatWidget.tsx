import React, { useState, useEffect, useRef } from 'react';
import { AgentConfig, Message, AgentId } from '../types.ts';
import { AGENTS } from '../constants.ts';
import { Icon } from './Icons.tsx';
import { getMessages, saveMessage, addAppointment } from '../services/db.ts';
import { sendMessageWithHistory, ai, bookAppointmentDeclaration, transferCallDeclaration } from '../services/gemini.ts';
import { LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createBlob } from '../services/audio.ts';

interface UniversalChatWidgetProps {
    activeView: string;
    prompts: Record<string, string>;
}

export const UniversalChatWidget: React.FC<UniversalChatWidgetProps> = ({ activeView, prompts }) => {
    // Map non-agent pages to the most relevant agent
    let mappedAgentId = activeView as AgentId;
    if (!AGENTS.find(a => a.id === mappedAgentId)) {
        if (activeView === AgentId.APPOINTMENTS) mappedAgentId = AgentId.FRONT_DESK;
        else if (activeView === AgentId.LEADS) mappedAgentId = AgentId.WEB;
        else mappedAgentId = AgentId.BUSINESS;
    }
    
    const currentAgent = AGENTS.find(a => a.id === mappedAgentId) || AGENTS[0];
    const systemPrompt = prompts[currentAgent.id];

    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'chat' | 'voice'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice State
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const isLiveActiveRef = useRef(false); // Ref for callbacks to read the latest state
    const [liveTranscript, setLiveTranscript] = useState<string>('');
    const sessionRef = useRef<any>(null);
    const audioContextsRef = useRef<{ input?: AudioContext, output?: AudioContext }>({});
    const audioNodesRef = useRef<{ source?: MediaStreamAudioSourceNode, workletNode?: AudioWorkletNode, dummyGain?: GainNode }>({});
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);

    const fetchMessagesSilent = async () => {
        const history = await getMessages(currentAgent.id);
        setMessages(history);
    };

    useEffect(() => {
        fetchMessagesSilent();
        // Stop call if agent changes to prevent context confusion
        if (isLiveActive) stopLiveCall();
    }, [currentAgent.id]);

    useEffect(() => {
        const handleChatUpdated = (e: any) => {
            if (e.detail === currentAgent.id) fetchMessagesSilent();
        };
        const handleLoading = (e: any) => {
            if (e.detail.agentId === currentAgent.id) setIsLoading(e.detail.isLoading);
        };
        window.addEventListener('chat-updated', handleChatUpdated);
        window.addEventListener('chat-loading', handleLoading);
        return () => {
            window.removeEventListener('chat-updated', handleChatUpdated);
            window.removeEventListener('chat-loading', handleLoading);
        };
    }, [currentAgent.id]);

    useEffect(() => {
        if (isOpen && mode === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading, isOpen, mode]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const imgKey = `UPLOADED_IMG_${Math.floor(Math.random() * 10000)}`;
            // Dispatch event so WebDesignView can catch the image map update
            window.dispatchEvent(new CustomEvent('widget-image-upload', { detail: { key: imgKey, data: base64String } }));
            setInputValue(prev => prev + (prev ? ' ' : '') + `[Use image URL: ${imgKey}] `);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsDataURL(file);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const text = inputValue.trim();
        setInputValue('');

        // Dispatch event to let the active view intercept and handle the message (e.g., Web Design or Social Media)
        const detail = { agentId: currentAgent.id, text, handled: false };
        window.dispatchEvent(new CustomEvent('widget-send-message', { detail }));

        // If no view intercepted it, handle it generically here
        if (!detail.handled) {
            const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
            await saveMessage(currentAgent.id, userMsg);
            setIsLoading(true);
            const responseText = await sendMessageWithHistory([...messages, userMsg], systemPrompt);
            const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
            await saveMessage(currentAgent.id, modelMsg);
            setIsLoading(false);
        }
    };

    // --- Live API Logic (Upgraded to AudioWorklet & Auto-Reconnect) ---
    const startLiveCall = async () => {
        try {
            setIsLiveActive(true);
            isLiveActiveRef.current = true;
            setIsReconnecting(false);
            setLiveTranscript('Connecting to Gemini Live API...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            
            await inputAudioContext.resume();
            await outputAudioContext.resume();
            
            audioContextsRef.current = { input: inputAudioContext, output: outputAudioContext };
            
            const outputNode = outputAudioContext.createGain();
            outputNode.connect(outputAudioContext.destination);
            nextStartTimeRef.current = outputAudioContext.currentTime;

            // 1. Setup AudioWorklet with a 4096-frame buffer
            const workletCode = `
                class PCMProcessor extends AudioWorkletProcessor {
                    constructor() {
                        super();
                        this.buffer = new Float32Array(4096);
                        this.offset = 0;
                    }
                    process(inputs, outputs, parameters) {
                        const input = inputs[0];
                        if (input && input.length > 0) {
                            const channelData = input[0];
                            for (let i = 0; i < channelData.length; i++) {
                                this.buffer[this.offset++] = channelData[i];
                                if (this.offset >= 4096) {
                                    this.port.postMessage(this.buffer);
                                    this.buffer = new Float32Array(4096);
                                    this.offset = 0;
                                }
                            }
                        }
                        return true;
                    }
                }
                registerProcessor('pcm-processor', PCMProcessor);
            `;
            const blob = new Blob([workletCode], { type: 'application/javascript' });
            const workletUrl = URL.createObjectURL(blob);
            
            await inputAudioContext.audioWorklet.addModule(workletUrl);
            const workletNode = new AudioWorkletNode(inputAudioContext, 'pcm-processor');

            const source = inputAudioContext.createMediaStreamSource(stream);
            source.connect(workletNode);
            
            const dummyGain = inputAudioContext.createGain();
            dummyGain.gain.value = 0;
            workletNode.connect(dummyGain);
            dummyGain.connect(inputAudioContext.destination);

            audioNodesRef.current = { source, workletNode, dummyGain };

            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            // 2. Session Connection Logic (Wrapped in a function for auto-reconnect)
            const connectSession = async () => {
                if (!isLiveActiveRef.current) return;

                try {
                    const sessionPromise = ai.live.connect({
                        model: 'gemini-live-2.5-flash-native-audio',
                        callbacks: {
                            onopen: () => {
                                setIsReconnecting(false);
                                setLiveTranscript('Connected! Start speaking...');
                            },
                            onmessage: async (message: LiveServerMessage) => {
                                if (message.serverContent?.outputTranscription) {
                                    currentOutputTranscription += message.serverContent.outputTranscription.text;
                                    setLiveTranscript(`Agent: ${currentOutputTranscription}`);
                                } else if (message.serverContent?.inputTranscription) {
                                    currentInputTranscription += message.serverContent.inputTranscription.text;
                                    setLiveTranscript(`You: ${currentInputTranscription}`);
                                }

                                if (message.serverContent?.turnComplete) {
                                    currentInputTranscription = '';
                                    currentOutputTranscription = '';
                                }

                                if (message.toolCall) {
                                    for (const fc of message.toolCall.functionCalls) {
                                        if (fc.name === 'bookAppointment') {
                                            const args = fc.args as any;
                                            setLiveTranscript(`Agent is booking appointment for ${args.clientName}...`);
                                            try {
                                                await addAppointment({
                                                    clientName: args.clientName || 'Voice Caller',
                                                    dateTime: args.dateTime || new Date().toISOString(),
                                                    service: args.service || 'Voice Booking',
                                                    status: 'Scheduled'
                                                });
                                                sessionPromise.then((session) => {
                                                    session.sendToolResponse({
                                                        functionResponses: [{
                                                            id: fc.id,
                                                            name: fc.name,
                                                            response: { result: "Appointment successfully booked in Firestore." }
                                                        }]
                                                    });
                                                });
                                            } catch (e) {
                                                sessionPromise.then((session) => {
                                                    session.sendToolResponse({
                                                        functionResponses: [{
                                                            id: fc.id,
                                                            name: fc.name,
                                                            response: { error: "Failed to book appointment." }
                                                        }]
                                                    });
                                                });
                                            }
                                        } else if (fc.name === 'transferCall') {
                                            const args = fc.args as any;
                                            setLiveTranscript(`Agent is transferring call to ${args.departmentOrPerson}...`);
                                            sessionPromise.then((session) => {
                                                session.sendToolResponse({
                                                    functionResponses: [{
                                                        id: fc.id,
                                                        name: fc.name,
                                                        response: { result: `Call transfer initiated to ${args.departmentOrPerson}.` }
                                                    }]
                                                });
                                            });
                                        }
                                    }
                                }

                                const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                                if (base64EncodedAudioString) {
                                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                                    const audioBuffer = await decodeAudioData(
                                        decode(base64EncodedAudioString),
                                        outputAudioContext,
                                        24000,
                                        1,
                                    );
                                    const source = outputAudioContext.createBufferSource();
                                    source.buffer = audioBuffer;
                                    source.connect(outputNode);
                                    source.addEventListener('ended', () => {
                                        sourcesRef.current.delete(source);
                                    });

                                    source.start(nextStartTimeRef.current);
                                    nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                                    sourcesRef.current.add(source);
                                }

                                if (message.serverContent?.interrupted) {
                                    for (const source of sourcesRef.current.values()) {
                                        try { source.stop(); } catch(e) {}
                                        sourcesRef.current.delete(source);
                                    }
                                    if (audioContextsRef.current.output) {
                                        nextStartTimeRef.current = audioContextsRef.current.output.currentTime;
                                    }
                                }
                            },
                            onerror: (e: ErrorEvent) => {
                                console.error('Live API Error:', e);
                                // Let onclose handle the reconnect
                            },
                            onclose: () => {
                                console.log('Live API Closed');
                                // Auto-Reconnect Logic
                                if (isLiveActiveRef.current) {
                                    console.log('Connection dropped. Auto-reconnecting...');
                                    setIsReconnecting(true);
                                    setLiveTranscript('Reconnecting to server...');
                                    setTimeout(connectSession, 1000);
                                }
                            },
                        },
                        config: {
                            responseModalities: [Modality.AUDIO],
                            systemInstruction: systemPrompt,
                            tools: [{ functionDeclarations: [bookAppointmentDeclaration, transferCallDeclaration] }],
                            inputAudioTranscription: {},
                            outputAudioTranscription: {}
                        },
                    });

                    sessionRef.current = sessionPromise;

                    // Route the AudioWorklet data to the NEW session
                    workletNode.port.onmessage = (event) => {
                        if (!isLiveActiveRef.current) return;
                        const inputData = event.data;
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        }).catch(() => {}); // Ignore errors if session is closing
                    };

                } catch (err) {
                    console.error("Failed to connect session:", err);
                    if (isLiveActiveRef.current) {
                        setIsReconnecting(true);
                        setTimeout(connectSession, 2000); // Retry on failure
                    }
                }
            };

            // Start the first session
            await connectSession();

        } catch (error) {
            console.error("Failed to start live call:", error);
            setIsLiveActive(false);
            isLiveActiveRef.current = false;
            setIsReconnecting(false);
            setLiveTranscript('Microphone access denied or API error.');
        }
    };

    const stopLiveCall = () => {
        setIsLiveActive(false);
        isLiveActiveRef.current = false;
        setIsReconnecting(false);
        setLiveTranscript('');
        
        if (sessionRef.current) {
            sessionRef.current.then((session: any) => {
                if(session.close) session.close();
            }).catch(() => {});
            sessionRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioNodesRef.current.source) audioNodesRef.current.source.disconnect();
        if (audioNodesRef.current.workletNode) audioNodesRef.current.workletNode.disconnect();
        if (audioNodesRef.current.dummyGain) audioNodesRef.current.dummyGain.disconnect();
        audioNodesRef.current = {};

        if (audioContextsRef.current.input) audioContextsRef.current.input.close();
        if (audioContextsRef.current.output) audioContextsRef.current.output.close();
        audioContextsRef.current = {};
        
        for (const source of sourcesRef.current.values()) {
            try { source.stop(); } catch(e) {}
        }
        sourcesRef.current.clear();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isLiveActiveRef.current) stopLiveCall();
        };
    }, []);

    return (
        <>
            {/* Slide-out Drawer */}
            <div 
                className={`fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex flex-col gap-3 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${currentAgent.colorClass}`}>
                                <Icon name={currentAgent.iconName} size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold">Talking to: {currentAgent.name}</h3>
                                <p className="text-[10px] text-slate-300">Online</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition-colors">
                            <Icon name="X" size={20} />
                        </button>
                    </div>
                    {/* Toggle */}
                    <div className="flex bg-slate-800 rounded-lg p-1">
                        <button onClick={() => setMode('chat')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'chat' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Chat</button>
                        <button onClick={() => setMode('voice')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${mode === 'voice' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>Voice</button>
                    </div>
                </div>

                {/* Body */}
                {mode === 'chat' ? (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                                        msg.role === 'user' ? 'bg-blue-100 text-blue-600' : `${currentAgent.colorClass} text-white`
                                    }`}>
                                        {msg.role === 'user' ? <Icon name="User" size={12} /> : <span className="text-xs font-bold">{currentAgent.name.charAt(0)}</span>}
                                    </div>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                    }`}>
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${currentAgent.colorClass} text-white`}>
                                        <span className="text-xs font-bold">{currentAgent.name.charAt(0)}</span>
                                    </div>
                                    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                            <form onSubmit={handleSendMessage} className="relative flex items-center">
                                {currentAgent.id === AgentId.WEB && (
                                    <>
                                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute left-2 p-2 text-gray-400 hover:text-indigo-600 transition-colors z-10" title="Upload Image">
                                            <Icon name="Image" size={18} />
                                        </button>
                                    </>
                                )}
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type a message..."
                                    className={`w-full bg-gray-100 border-transparent rounded-full pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all ${currentAgent.id === AgentId.WEB ? 'pl-10' : 'pl-4'}`}
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isLoading}
                                    className="absolute right-1.5 p-2 text-indigo-600 hover:bg-indigo-50 rounded-full disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                                >
                                    <Icon name="Send" size={18} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 bg-slate-50 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-500"></div>
                        
                        <div className="mb-6 relative">
                            {isLiveActive && !isReconnecting && (
                                <>
                                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 scale-150"></div>
                                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-pulse opacity-40 scale-110"></div>
                                </>
                            )}
                            {isReconnecting && (
                                <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin scale-125"></div>
                            )}
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white relative z-10 transition-colors duration-300 ${isLiveActive ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50' : 'bg-slate-800'}`}>
                                <Icon name={isLiveActive ? "Mic" : "MicOff"} size={32} />
                            </div>
                        </div>
                        
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">Voice Mode</h3>
                        <p className="text-sm text-gray-500 mb-8">Talk directly to the {currentAgent.name}.</p>
                        
                        {isLiveActive ? (
                            <button 
                                onClick={stopLiveCall}
                                className="w-full bg-red-100 text-red-700 py-3 rounded-xl font-bold hover:bg-red-200 transition flex items-center justify-center gap-2"
                            >
                                <Icon name="PhoneOff" size={20} /> End Call
                            </button>
                        ) : (
                            <button 
                                onClick={startLiveCall}
                                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-md"
                            >
                                <Icon name="Phone" size={20} /> Start Voice Call
                            </button>
                        )}

                        {isLiveActive && liveTranscript && (
                            <div className="mt-6 w-full bg-white border border-gray-200 shadow-sm rounded-xl p-4 text-left h-32 overflow-y-auto">
                                <p className={`text-sm italic ${isReconnecting ? 'text-orange-500 font-medium animate-pulse' : 'text-gray-700'}`}>
                                    {liveTranscript}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Floating Action Button (FAB) */}
            <button 
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all duration-300 z-40 ${currentAgent.colorClass} ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
                title="Open Chat"
            >
                <Icon name="MessageSquare" size={28} />
                {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'model' && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </button>
        </>
    );
};
