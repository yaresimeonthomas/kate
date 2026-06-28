import React from 'react';
import { AgentId, AgentConfig } from '../types.ts';
import { AGENTS } from '../constants.ts';
import { Icon } from './Icons.tsx';

interface SidebarProps {
    activeView: string;
    onSelectView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onSelectView }) => {
    return (
        <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 flex-shrink-0">
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    K
                </div>
                <h1 className="text-xl font-bold text-white tracking-wide">Kate AOS</h1>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-2">
                    <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Your Agents</p>
                </div>
                <nav className="space-y-1 px-2 mb-8">
                    {AGENTS.map((agent) => (
                        <button
                            key={agent.id}
                            onClick={() => onSelectView(agent.id)}
                            className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                                activeView === agent.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'
                            }`}
                        >
                            <div className={`mt-0.5 p-1.5 rounded-md ${agent.colorClass} bg-opacity-20 text-${agent.colorClass.replace('bg-', '')}`}>
                                <Icon name={agent.iconName} size={18} className={activeView === agent.id ? 'text-white' : ''} />
                            </div>
                            <div>
                                <div className="font-medium text-sm">{agent.name}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{agent.subtitle}</div>
                            </div>
                        </button>
                    ))}
                </nav>

                <div className="px-4 mb-2">
                    <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">System</p>
                </div>
                <nav className="space-y-1 px-2">
                    <button
                        onClick={() => onSelectView(AgentId.APPOINTMENTS)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                            activeView === AgentId.APPOINTMENTS ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                        <Icon name="Calendar" size={18} />
                        <span className="text-sm font-medium">Appointments</span>
                    </button>
                    <button
                        onClick={() => onSelectView(AgentId.LEADS)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                            activeView === AgentId.LEADS ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                        <Icon name="Users" size={18} />
                        <span className="text-sm font-medium">Website Leads</span>
                    </button>
                    <button
                        onClick={() => onSelectView(AgentId.MARKETING)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                            activeView === AgentId.MARKETING ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'
                        }`}
                    >
                        <Icon name="Megaphone" size={18} />
                        <span className="text-sm font-medium">Marketing Automations</span>
                    </button>
                </nav>
            </div>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => onSelectView(AgentId.SETTINGS)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                        activeView === AgentId.SETTINGS ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'
                    }`}
                >
                    <Icon name="Settings" size={18} />
                    <span className="text-sm font-medium">Dashboard Settings</span>
                </button>
            </div>
        </div>
    );
};
