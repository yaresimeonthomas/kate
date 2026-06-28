import React, { useState, useEffect } from 'react';
import { AgentConfig } from '../types.ts';
import { Icon } from './Icons.tsx';

interface SystemPromptEditorProps {
    agent: AgentConfig;
    prompt: string;
    onSave: (newPrompt: string) => void;
}

export const SystemPromptEditor: React.FC<SystemPromptEditorProps> = ({ agent, prompt, onSave }) => {
    const [localPrompt, setLocalPrompt] = useState(prompt);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setLocalPrompt(prompt);
    }, [prompt]);

    const handleSave = () => {
        onSave(localPrompt);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Icon name="TerminalSquare" size={20} className="text-gray-500" />
                        System Instructions
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Define how {agent.name} should behave, its persona, and constraints. Changes will reset the current conversation.
                    </p>
                </div>
                <div className="p-6">
                    <textarea
                        value={localPrompt}
                        onChange={(e) => setLocalPrompt(e.target.value)}
                        className="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                        placeholder="Enter system instructions here..."
                    />
                    <div className="mt-6 flex justify-end items-center gap-4">
                        {isSaved && <span className="text-sm text-green-600 flex items-center gap-1"><Icon name="CheckCircle2" size={16}/> Saved successfully</span>}
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Icon name="Save" size={16} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
