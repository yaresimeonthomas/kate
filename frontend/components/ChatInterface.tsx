import React, { useState, useRef, useEffect } from 'react';
import { Message, AgentConfig } from '../types.ts';
import { Icon } from './Icons.tsx';

interface ChatInterfaceProps {
    agent: AgentConfig;
    messages: Message[];
    onSendMessage: (text: string) => void;
    isLoading: boolean;
    children?: React.ReactNode; // For injecting extra panels (like Web Design preview)
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ agent, messages, onSendMessage, isLoading, children }) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <div className="flex flex-1 overflow-hidden bg-gray-50">
            <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full bg-white shadow-sm border-x border-gray-100">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                msg.role === 'user' ? 'bg-blue-100 text-blue-600' : `${agent.colorClass} text-white`
                            }`}>
                                {msg.role === 'user' ? <Icon name="User" size={16} /> : <span className="text-sm font-bold">{agent.name.charAt(0)}</span>}
                            </div>
                            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                                msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                            }`}>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${agent.colorClass} text-white`}>
                                <span className="text-sm font-bold">{agent.name.charAt(0)}</span>
                            </div>
                            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="p-4 bg-white border-t border-gray-100">
                    <form onSubmit={handleSubmit} className="relative flex items-center">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={`Message ${agent.name}...`}
                            className="w-full bg-gray-50 border border-gray-200 rounded-full pl-6 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                        >
                            <Icon name="Send" size={16} />
                        </button>
                    </form>
                    <div className="text-center mt-2">
                        <span className="text-[10px] text-gray-400">Powered by Google Gemini</span>
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
};
