import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AgentConfig, Message } from '../types.ts';
import { AgentHeader } from '../components/AgentHeader.tsx';
import { SystemPromptEditor } from '../components/SystemPromptEditor.tsx';
import { modifyWebTemplateWithHistory } from '../services/gemini.ts';
import { getMessages, saveMessage, clearMessages, addLead, addAppointment } from '../services/db.ts';
import { DEFAULT_WEB_TEMPLATE, INJECTED_SCRIPT } from '../constants.ts';
import { Icon } from '../components/Icons.tsx';

interface WebDesignViewProps {
    agent: AgentConfig;
    systemPrompt: string;
    onUpdatePrompt: (newPrompt: string) => void;
    onNavigateHome?: () => void;
}

export const WebDesignView: React.FC<WebDesignViewProps> = ({ agent, systemPrompt, onUpdatePrompt, onNavigateHome }) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'prompt'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentHtml, setCurrentHtml] = useState(DEFAULT_WEB_TEMPLATE);
    
    // Image upload state
    const [imageMap, setImageMap] = useState<Record<string, string>>({});
    
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Listen for messages from the iframe (Contact Form & Calendar)
    useEffect(() => {
        const handleIframeMessage = async (event: MessageEvent) => {
            if (event.data?.type === 'SUBMIT_CONTACT') {
                console.log("Received contact form submission from iframe:", event.data.payload);
                await addLead({
                    name: event.data.payload.name || 'Unknown',
                    email: event.data.payload.email || 'No email',
                    phone: event.data.payload.phone || '',
                    message: event.data.payload.message || 'No message',
                });
            } else if (event.data?.type === 'BOOK_APPOINTMENT') {
                console.log("Received appointment booking from iframe:", event.data.payload);
                await addAppointment({
                    clientName: event.data.payload.name || 'Website Visitor',
                    dateTime: event.data.payload.dateTime,
                    service: event.data.payload.service || 'Website Booking',
                    status: 'Scheduled'
                });
            }
        };

        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, []);

    const fetchMessagesSilent = async () => {
        const history = await getMessages(agent.id);
        setMessages(history);
    };

    useEffect(() => {
        const loadHistory = async () => {
            setIsLoading(true);
            const history = await getMessages(agent.id);
            
            if (history.length === 0) {
                const initMsg: Message = { 
                    id: Date.now().toString(), 
                    role: 'model', 
                    text: 'Hello! I am your Web Design Agent. I have loaded the default landing page template. You can see the Section IDs labeled on the page. Tell me which block you want to change (e.g., "Change the hero-block background to dark blue" or "Remove the contact-block"). You can also upload images using the icon below.', 
                    timestamp: Date.now() 
                };
                await saveMessage(agent.id, initMsg);
                setMessages([initMsg]);
            } else {
                setMessages(history);
            }
            setIsLoading(false);
        };

        loadHistory();
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
    }, [agent.id, messages, currentHtml, systemPrompt]);

    // Listen for image uploads from the Universal Widget
    useEffect(() => {
        const handleImageUpload = (e: any) => {
            setImageMap(prev => ({ ...prev, [e.detail.key]: e.detail.data }));
        };
        window.addEventListener('widget-image-upload', handleImageUpload);
        return () => window.removeEventListener('widget-image-upload', handleImageUpload);
    }, []);

    // Render HTML with injected base64 images AND the interactive script
    const renderHtml = useMemo(() => {
        let html = currentHtml;
        
        // 1. Inject Images
        Object.entries(imageMap).forEach(([key, value]) => {
            html = html.split(key).join(value);
        });
        
        // 2. Inject the interactive script right before the closing body tag
        const scriptTag = `\n<script>\n${INJECTED_SCRIPT}\n</script>\n`;
        if (html.includes('</body>')) {
            html = html.replace('</body>', `${scriptTag}</body>`);
        } else {
            html += scriptTag;
        }
        
        return html;
    }, [currentHtml, imageMap]);

    const handleSendMessageText = async (text: string) => {
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
        const updatedMessages = [...messages, userMsg];
        
        setMessages(updatedMessages);
        setIsLoading(true);
        window.dispatchEvent(new CustomEvent('chat-loading', { detail: { agentId: agent.id, isLoading: true } }));
        await saveMessage(agent.id, userMsg);

        const result = await modifyWebTemplateWithHistory(updatedMessages, text, currentHtml, systemPrompt);
        
        if (result && result.blockId && result.newHtml !== undefined) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(currentHtml, 'text/html');
            const blockToReplace = doc.getElementById(result.blockId);
            
            if (blockToReplace) {
                let actionText = "";
                if (result.newHtml.trim() === "") {
                    // Hide the block instead of removing it so it can be restored later
                    blockToReplace.outerHTML = `<section id="${result.blockId}" style="display: none;"></section>`;
                    actionText = `I've removed the ${result.blockId}.`;
                } else {
                    blockToReplace.outerHTML = result.newHtml;
                    actionText = `I've updated the ${result.blockId}.`;
                }
                
                const updatedHtml = doc.documentElement.outerHTML;
                setCurrentHtml(updatedHtml);
                
                const modelMsg: Message = { 
                    id: (Date.now() + 1).toString(), 
                    role: 'model', 
                    text: `${actionText} You should see the changes on the page now.`, 
                    timestamp: Date.now() 
                };
                setMessages(prev => [...prev, modelMsg]);
                await saveMessage(agent.id, modelMsg);
            } else {
                const errorMsg: Message = { 
                    id: (Date.now() + 1).toString(), 
                    role: 'model', 
                    text: `I tried to update a block called '${result.blockId}', but I couldn't find it in the template.`, 
                    timestamp: Date.now() 
                };
                setMessages(prev => [...prev, errorMsg]);
                await saveMessage(agent.id, errorMsg);
            }
        } else {
            const errorMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'model', 
                text: `I couldn't process that change or no changes were needed. Please try rephrasing.`, 
                timestamp: Date.now() 
            };
            setMessages(prev => [...prev, errorMsg]);
            await saveMessage(agent.id, errorMsg);
        }
        setIsLoading(false);
        window.dispatchEvent(new CustomEvent('chat-loading', { detail: { agentId: agent.id, isLoading: false } }));
    };

    const handleSavePrompt = async (newPrompt: string) => {
        onUpdatePrompt(newPrompt);
        await clearMessages(agent.id);
        
        const initMsg: Message = { id: Date.now().toString(), role: 'model', text: 'System prompt updated. How can I help you modify the template today?', timestamp: Date.now() };
        await saveMessage(agent.id, initMsg);
        setMessages([initMsg]);
        setActiveTab('chat');
    };

    const handleResetTemplate = async () => {
        if (confirm("Are you sure you want to reset the template? This will undo all your design changes.")) {
            setCurrentHtml(DEFAULT_WEB_TEMPLATE);
            setImageMap({}); // Clear uploaded images
            const resetMsg: Message = { id: Date.now().toString(), role: 'model', text: 'Template reset to default.', timestamp: Date.now() };
            setMessages(prev => [...prev, resetMsg]);
            await saveMessage(agent.id, resetMsg);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {activeTab === 'prompt' && (
                <AgentHeader agent={agent} activeTab={activeTab} onTabChange={setActiveTab} />
            )}
            
            {activeTab === 'chat' ? (
                <div className="relative flex-1 overflow-hidden bg-gray-200 flex flex-col">
                    
                    {/* Solid Top Toolbar */}
                    <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={onNavigateHome} 
                                className="text-slate-600 hover:text-slate-900 flex items-center gap-2 font-medium text-sm transition-colors"
                            >
                                <Icon name="ArrowLeft" size={16} /> Back to Dashboard
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleResetTemplate} 
                                className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100"
                            >
                                <Icon name="RotateCcw" size={14} /> Reset Template
                            </button>
                            <button 
                                onClick={() => setActiveTab('prompt')} 
                                className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100"
                            >
                                <Icon name="Settings" size={14} /> System Prompt
                            </button>
                        </div>
                    </div>

                    {/* Full Screen Iframe */}
                    <div className="flex-1 relative">
                        {isLoading && (
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-3 z-20">
                                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium text-slate-700">Applying changes...</span>
                            </div>
                        )}
                        <iframe
                            ref={iframeRef}
                            srcDoc={renderHtml}
                            title="Live Preview"
                            className="w-full h-full border-none bg-white"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                        />
                    </div>
                </div>
            ) : (
                <SystemPromptEditor agent={agent} prompt={systemPrompt} onSave={handleSavePrompt} />
            )}
        </div>
    );
};
