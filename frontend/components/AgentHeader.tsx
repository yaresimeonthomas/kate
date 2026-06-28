import React from 'react';
import { AgentConfig } from '../types.ts';

interface AgentHeaderProps {
    agent: AgentConfig;
    activeTab: 'chat' | 'prompt';
    onTabChange: (tab: 'chat' | 'prompt') => void;
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({ agent, activeTab, onTabChange }) => {
    return (
        <div className="border-b border-gray-200 bg-white px-8 pt-8 pb-0">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ${agent.colorClass}`}>
                        <span className="text-xl font-bold">{agent.name.charAt(0)}</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
                        <p className="text-sm text-gray-500">{agent.subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium border border-green-100">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    ONLINE • Live Sync On
                </div>
            </div>
            
            <div className="flex gap-6">
                <button
                    onClick={() => onTabChange('chat')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Chat Interface
                </button>
                <button
                    onClick={() => onTabChange('prompt')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'prompt' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    System Prompt
                </button>
            </div>
        </div>
    );
};
