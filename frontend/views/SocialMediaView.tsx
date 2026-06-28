import React, { useState, useEffect } from 'react';
import { AgentConfig, Message, SocialPost } from '../types.ts';
import { AgentHeader } from '../components/AgentHeader.tsx';
import { ChatInterface } from '../components/ChatInterface.tsx';
import { SystemPromptEditor } from '../components/SystemPromptEditor.tsx';
import { generateSocialPostWithHistory } from '../services/gemini.ts';
import { getPosts, addPost, updatePostStatus, publishToZernio, getMessages, saveMessage, clearMessages } from '../services/db.ts';
import { Icon } from '../components/Icons.tsx';

interface SocialMediaViewProps {
    agent: AgentConfig;
    systemPrompt: string;
    onUpdatePrompt: (newPrompt: string) => void;
}

export const SocialMediaView: React.FC<SocialMediaViewProps> = ({ agent, systemPrompt, onUpdatePrompt }) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'prompt'>('chat');
    const [subTab, setSubTab] = useState<'preview' | 'queue'>('preview');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [currentPreview, setCurrentPreview] = useState<{text: string, imagePrompt: string} | null>(null);
    const [posts, setPosts] = useState<SocialPost[]>([]);

    const fetchMessagesSilent = async () => {
        const history = await getMessages(agent.id);
        setMessages(history);
    };

    const loadData = async () => {
        setIsLoading(true);
        const [postsData, history] = await Promise.all([
            getPosts(),
            getMessages(agent.id)
        ]);
        
        setPosts(postsData);
        
        if (history.length === 0) {
            const initMsg: Message = { id: Date.now().toString(), role: 'model', text: 'Hi! I can help you create social media posts. Tell me what you want to post about.', timestamp: Date.now() };
            await saveMessage(agent.id, initMsg);
            setMessages([initMsg]);
        } else {
            setMessages(history);
        }
        setIsLoading(false);
    };

    useEffect(() => {
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
    }, [agent.id, messages, systemPrompt]);

    const handleSendMessageText = async (text: string) => {
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
        const updatedMessages = [...messages, userMsg];
        
        setMessages(updatedMessages);
        setIsLoading(true);
        window.dispatchEvent(new CustomEvent('chat-loading', { detail: { agentId: agent.id, isLoading: true } }));
        await saveMessage(agent.id, userMsg);

        setSubTab('preview');
        const result = await generateSocialPostWithHistory(updatedMessages, text, systemPrompt);
        
        if (result) {
            setCurrentPreview(result);
            const modelMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'model', 
                text: `I've drafted a post for you. Check the Content Preview panel to review it.`, 
                timestamp: Date.now() 
            };
            setMessages(prev => [...prev, modelMsg]);
            await saveMessage(agent.id, modelMsg);
        } else {
            const errorMsg: Message = { 
                id: (Date.now() + 1).toString(), 
                role: 'model', 
                text: `Sorry, I couldn't generate the post. Please try again.`, 
                timestamp: Date.now() 
            };
            setMessages(prev => [...prev, errorMsg]);
            await saveMessage(agent.id, errorMsg);
        }
        setIsLoading(false);
        window.dispatchEvent(new CustomEvent('chat-loading', { detail: { agentId: agent.id, isLoading: false } }));
    };

    const handleSendMessage = async (text: string) => {
        handleSendMessageText(text);
    };

    const handleSaveDraft = async () => {
        if (currentPreview) {
            await addPost({
                text: currentPreview.text,
                imageUrl: `https://picsum.photos/seed/${Math.random()}/600/400`,
                status: 'Draft'
            });
            const updatedPosts = await getPosts();
            setPosts(updatedPosts);
            setCurrentPreview(null);
            setSubTab('queue');
            
            const modelMsg: Message = { id: Date.now().toString(), role: 'model', text: `Post saved to Approval Queue.`, timestamp: Date.now() };
            setMessages(prev => [...prev, modelMsg]);
            await saveMessage(agent.id, modelMsg);
        }
    };

    const handleApprove = async (id: string) => {
        // Optimistically mark as approved
        await updatePostStatus(id, 'Approved');
        const updatedPosts = await getPosts();
        setPosts(updatedPosts);
        
        const postToPublish = updatedPosts.find(p => p.id === id);
        if (postToPublish) {
            const success = await publishToZernio(postToPublish);
            if (success) {
                await updatePostStatus(id, 'Published');
                setPosts(await getPosts());
            } else {
                alert("Failed to publish to Zernio. Check the console for details.");
                // Revert to draft if it failed
                await updatePostStatus(id, 'Draft');
                setPosts(await getPosts());
            }
        }
    };

    const handleReject = async (id: string) => {
        await updatePostStatus(id, 'Rejected');
        setPosts(await getPosts());
    };

    const handleSavePrompt = async (newPrompt: string) => {
        onUpdatePrompt(newPrompt);
        await clearMessages(agent.id);
        
        const initMsg: Message = { id: Date.now().toString(), role: 'model', text: 'System prompt updated. How can I help you create content today?', timestamp: Date.now() };
        await saveMessage(agent.id, initMsg);
        setMessages([initMsg]);
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
                    <div className="w-96 border-l border-gray-200 bg-gray-50 flex flex-col flex-shrink-0">
                        <div className="flex border-b border-gray-200 bg-white">
                            <button 
                                onClick={() => setSubTab('preview')}
                                className={`flex-1 py-3 text-sm font-medium border-b-2 ${subTab === 'preview' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500'}`}
                            >
                                Content Preview
                            </button>
                            <button 
                                onClick={() => setSubTab('queue')}
                                className={`flex-1 py-3 text-sm font-medium border-b-2 flex items-center justify-center gap-2 ${subTab === 'queue' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500'}`}
                            >
                                Approval Queue
                                {posts.filter(p => p.status === 'Draft').length > 0 && (
                                    <span className="bg-pink-100 text-pink-600 text-xs py-0.5 px-2 rounded-full">
                                        {posts.filter(p => p.status === 'Draft').length}
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {subTab === 'preview' && (
                                <div>
                                    {currentPreview ? (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="h-48 bg-gray-200 flex items-center justify-center p-4 text-center relative">
                                                <Icon name="Image" size={32} className="text-gray-400 absolute" />
                                                <p className="text-xs text-gray-500 relative z-10 bg-white/80 p-2 rounded">
                                                    Image Idea: {currentPreview.imagePrompt}
                                                </p>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{currentPreview.text}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                                                <button 
                                                    onClick={handleSaveDraft}
                                                    className="bg-pink-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-pink-700 transition"
                                                >
                                                    Save to Queue
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 mt-20">
                                            <Icon name="LayoutTemplate" size={48} />
                                            <p className="text-sm">Ask the agent to generate a post to see a preview here.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {subTab === 'queue' && (
                                <div className="space-y-4">
                                    {posts.length === 0 ? (
                                        <p className="text-center text-sm text-gray-500 mt-10">No posts in queue.</p>
                                    ) : (
                                        posts.map(post => (
                                            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                <img src={post.imageUrl} alt="Post visual" className="w-full h-32 object-cover" />
                                                <div className="p-3">
                                                    <p className="text-sm text-gray-800 line-clamp-3 mb-2">{post.text}</p>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                                            post.status === 'Draft' ? 'bg-yellow-100 text-yellow-700' :
                                                            post.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                                                            post.status === 'Published' ? 'bg-green-100 text-green-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {post.status}
                                                        </span>
                                                        {post.status === 'Draft' && (
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleReject(post.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                                                    <Icon name="X" size={16} />
                                                                </button>
                                                                <button onClick={() => handleApprove(post.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                                                                    <Icon name="Check" size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </ChatInterface>
            ) : (
                <SystemPromptEditor agent={agent} prompt={systemPrompt} onSave={handleSavePrompt} />
            )}
        </div>
    );
};
