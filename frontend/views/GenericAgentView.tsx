import React, { useState, useEffect } from 'react';
import { AgentConfig, Message } from '../types.ts';
import { AgentHeader } from '../components/AgentHeader.tsx';
import { ChatInterface } from '../components/ChatInterface.tsx';
import { SystemPromptEditor } from '../components/SystemPromptEditor.tsx';
import { sendMessageWithHistory } from '../services/gemini.ts';
import { getMessages, saveMessage, clearMessages } from '../services/db.ts';

interface GenericAgentViewProps {
    agent: AgentConfig;
    systemPrompt: string;
    onUpdatePrompt: (newPrompt: string) => void;
    initialMessage?: string;
}

export const GenericAgentView: React.FC<GenericAgentViewProps> = ({ agent, systemPrompt, onUpdatePrompt, initialMessage }) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'prompt'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchMessagesSilent = async () => {
        const history = await getMessages(agent.id);
        setMessages(history);
    };

    useEffect(() => {
        const loadHistory = async () => {
            setIsLoading(true);
            const history = await getMessages(agent.id);
            
            if (history.length === 0 && initialMessage) {
                const initMsg: Message = { id: Date.now().toString(), role: 'model', text: initialMessage, timestamp: Date.now() };
                await saveMessage(agent.id, initMsg);
                setMessages([initMsg]);
            } else {
                setMessages(history);
            }
            setIsLoading(false);
        };

        loadHistory();
    }, [agent.id, initialMessage]);

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
    }, [agent.id, messages, systemPrompt]);

    const handleSendMessageText = async (text: string) => {
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
        const updatedMessages = [...messages, userMsg];
        
        setMessages(updatedMessages);
        setIsLoading(true);
        window.dispatchEvent(new CustomEvent('chat-loading', { detail: { agentId: agent.id, isLoading: true } }));
        await saveMessage(agent.id, userMsg);

        const responseText = await sendMessageWithHistory(updatedMessages, systemPrompt);
        
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
        
        if (initialMessage) {
            const initMsg: Message = { id: Date.now().toString(), role: 'model', text: initialMessage, timestamp: Date.now() };
            await saveMessage(agent.id, initMsg);
            setMessages([initMsg]);
        } else {
            setMessages([]);
        }
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
                />
            ) : (
                <SystemPromptEditor 
                    agent={agent} 
                    prompt={systemPrompt} 
                    onSave={handleSavePrompt} 
                />
            )}
        </div>
    );
};
