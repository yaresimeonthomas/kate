import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { AgentId } from './types.ts';
import { AGENTS } from './constants.ts';
import { GenericAgentView } from './views/GenericAgentView.tsx';
import { SocialMediaView } from './views/SocialMediaView.tsx';
import { WebDesignView } from './views/WebDesignView.tsx';
import { FrontDeskView } from './views/FrontDeskView.tsx';
import { AppointmentsView } from './views/AppointmentsView.tsx';
import { LeadsView } from './views/LeadsView.tsx';
import { MarketingView } from './views/MarketingView.tsx';
import { UniversalChatWidget } from './components/UniversalChatWidget.tsx';

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<string>(AgentId.BUSINESS);
    
    // Store system prompts for all agents
    const [prompts, setPrompts] = useState<Record<string, string>>(() => {
        const initialPrompts: Record<string, string> = {};
        AGENTS.forEach(agent => {
            initialPrompts[agent.id] = agent.defaultPrompt;
        });
        return initialPrompts;
    });

    const handleUpdatePrompt = (agentId: string, newPrompt: string) => {
        setPrompts(prev => ({ ...prev, [agentId]: newPrompt }));
    };

    const renderMainContent = () => {
        const activeAgent = AGENTS.find(a => a.id === activeView);

        if (activeAgent) {
            const commonProps = {
                agent: activeAgent,
                systemPrompt: prompts[activeAgent.id],
                onUpdatePrompt: (p: string) => handleUpdatePrompt(activeAgent.id, p)
            };

            switch (activeAgent.id) {
                case AgentId.BUSINESS:
                    return <GenericAgentView {...commonProps} initialMessage="Hello. I am your Business Manager agent. How can we optimize operations or review strategy today? I can also help you book appointments." />;
                case AgentId.SOCIAL:
                    return <SocialMediaView {...commonProps} />;
                case AgentId.WEB:
                    return <WebDesignView {...commonProps} onNavigateHome={() => setActiveView(AgentId.BUSINESS)} />;
                case AgentId.FRONT_DESK:
                    return <FrontDeskView {...commonProps} />;
                default:
                    return <GenericAgentView {...commonProps} />;
            }
        }

        if (activeView === AgentId.APPOINTMENTS) {
            return <AppointmentsView />;
        }
        
        if (activeView === AgentId.LEADS) {
            return <LeadsView />;
        }

        if (activeView === AgentId.MARKETING) {
            return <MarketingView />;
        }

        if (activeView === AgentId.SETTINGS) {
            return (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-500">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Settings</h2>
                        <p>Settings panel configuration goes here.</p>
                    </div>
                </div>
            );
        }

        return <div className="flex-1 bg-gray-50">View not found</div>;
    };

    // Hide sidebar completely when Web Design view is active to give it full screen
    const isFullScreenView = activeView === AgentId.WEB;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white font-sans relative">
            {!isFullScreenView && <Sidebar activeView={activeView} onSelectView={setActiveView} />}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {renderMainContent()}
            </main>
            
            {/* Universal Floating Chat/Voice Widget */}
            <UniversalChatWidget activeView={activeView} prompts={prompts} />
        </div>
    );
};

export default App;
