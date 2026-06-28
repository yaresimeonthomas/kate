import React, { useState, useEffect } from 'react';
import { AgentConfig, Message, CallLog } from '../types.ts';
import { AgentHeader } from '../components/AgentHeader.tsx';
import { ChatInterface } from '../components/ChatInterface.tsx';
import { SystemPromptEditor } from '../components/SystemPromptEditor.tsx';
import { sendMessageWithHistory } from '../services/gemini.ts';
import { getVapiCallLogs, getMessages, saveMessage, clearMessages } from '../services/db.ts';
import { Icon } from '../components/Icons.tsx';

interface FrontDeskViewProps {
    agent: AgentConfig;
    systemPrompt: string;
    onUpdatePrompt: (newPrompt: string) => void;
}

export const FrontDeskView: React.FC<FrontDeskViewProps> = ({ agent, systemPrompt, onUpdatePrompt }) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'prompt'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

    const fetchMessagesSilent = async () => {
        const history = await getMessages(agent.id);
        setMessages(history);
    };

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [logs, history] = await Promise.all([
                getVapiCallLogs(),
                getMessages(agent.id)
            ]);
            
            setCallLogs(logs);
            
            if (history.length === 0) {
                const initMsg: Message = { id: Date.now().toString(), role: 'model', text: 'Hello. I am your Front Desk Agent. I can handle text inquiries here, or you can use the floating widget in the bottom right to talk to me live via voice!', timestamp: Date.now() };
                await saveMessage(agent.id, initMsg);
                setMessages([initMsg]);
            } else {
                setMessages(history);
            }
            setIsLoading(false);
        };
        
        loadData();
    }, [agent.id]);

    // Listen for DB updates from the Universal Widget
    useEffect(() => {
        const handleChatUpdated = (e: any) => {
            if (e.detail === agent.id) fetchMessagesSilent();
        };
        window.addEventListener('chat-updated', handleChatUpdated);
        return () => window.removeEventListener('chat-updated', handleChatUpdated);
    }, [agent.id]);

    // Intercept messages sent from the Universal Widget
    useEffect(() => {
        const handleWidgetMessage = (e: any) => {
            if (e.detail.agentId === agent.id) {
                e.detail.handled = true;
                handleSendMessageText(e.detail.text);
            }
        };
        window.addEventListener('widget-send-message', handleWidgetMessage);
        return () => window.removeEventListener('widget-send-message', handleWidgetMessage);
    }, [agent.id, messages, systemPrompt, selectedCall]);

    const handleSendMessageText = async (text: string) => {
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
        const updatedMessages = [...messages, userMsg];
        
        setMessages(updatedMessages);
        setIsLoading(true);
        window.dispatchEvent(new CustomEvent('chat-loading', { detail: { agentId: agent.id, isLoading: true } }));
        await saveMessage(agent.id, userMsg);

        let contextPrompt = text;
        if (selectedCall) {
            contextPrompt = `[Context: User is asking about call from ${selectedCall.callerName}. Transcript: "${selectedCall.transcript}"]\n\nUser Request: ${text}`;
        }

        const historyForApi = [...updatedMessages];
        historyForApi[historyForApi.length - 1] = { ...userMsg, text: contextPrompt };

        const responseText = await sendMessageWithHistory(historyForApi, systemPrompt);
        
        const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
        setMessages(prev => [...prev, modelMsg]);
        await saveMessage(agent.id, modelMsg);
        
        setIsLoading(false);
        window.dispatchEvent(new CustomEvent('chat-loading', { detail: { agentId: agent.id, isLoading: false } }));
    };

    const handleSendMessage = async (text: string) => {
        handleSendMessageText(text);
    };

    const handleSavePrompt = async (newPrompt: string) => {
        onUpdatePrompt(newPrompt);
        await clearMessages(agent.id);
        
        const initMsg: Message = { id: Date.now().toString(), role: 'model', text: 'System prompt updated. How can I assist you today?', timestamp: Date.now() };
        await saveMessage(agent.id, initMsg);
        setMessages([initMsg]);
    };

    const handleAskAboutCall = (call: CallLog) => {
        setSelectedCall(call);
        handleSendMessage(`Can you summarize the call with ${call.callerName} and suggest a follow-up action?`);
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <AgentHeader agent={agent} activeTab={activeTab} onTabChange={setActiveTab} />
            
            {activeTab === 'chat' ? (
                <ChatInterface 
                    agent={agent} 
                    messages={messages} 
                    onSendMessage={handleSendMessage} 
                    isLoading={isLoading}
                >
                    <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col flex-shrink-0">
                        {/* Vapi Call Logs Panel */}
                        <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-2">
                            <Icon name="History" size={18} className="text-orange-500" />
                            <h3 className="font-semibold text-gray-800">Past Call Logs</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {callLogs.map(call => (
                                <div 
                                    key={call.id} 
                                    className={`bg-white p-3 rounded-lg shadow-sm border cursor-pointer transition-colors ${selectedCall?.id === call.id ? 'border-orange-400 ring-1 ring-orange-400' : 'border-gray-200 hover:border-orange-300'}`}
                                    onClick={() => setSelectedCall(call)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-sm text-gray-900">{call.callerName}</span>
                                        <span className="text-xs text-gray-500">{call.duration}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">{call.phoneNumber} • {call.timestamp}</div>
                                    <p className="text-xs text-gray-700 line-clamp-2 mb-3 bg-gray-50 p-2 rounded">
                                        {call.summary}
                                    </p>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleAskAboutCall(call); }}
                                        className="w-full text-xs bg-orange-50 text-orange-700 py-1.5 rounded font-medium hover:bg-orange-100 transition"
                                    >
                                        Ask Agent to Review
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChatInterface>
            ) : (
                <SystemPromptEditor agent={agent} prompt={systemPrompt} onSave={handleSavePrompt} />
            )}
        </div>
    );
};
