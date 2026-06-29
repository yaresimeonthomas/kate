import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Mic, Send, Loader2 } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { api, setupVoiceConnection } from '../services/api';
import { Message } from '../types';

export const ChatWidget: React.FC<{ activeAgentId?: string, activeAgentName?: string }> = ({ 
  activeAgentId = 'business_manager', 
  activeAgentName = 'Business Manager' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopVoiceRef = useRef<() => void>();

  useEffect(() => {
    if (!currentUser || !isOpen) return;

    const q = query(
      collection(db, `messages/${currentUser.uid}/${activeAgentId}/history`),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [currentUser, activeAgentId, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !currentUser) return;
    
    const userMsg = input.trim();
    setInput('');
    setIsTyping(true);

    // Optimistic UI update
    const historyRef = collection(db, `messages/${currentUser.uid}/${activeAgentId}/history`);
    await addDoc(historyRef, {
      text: userMsg,
      sender: 'user',
      timestamp: Date.now()
    });

    // Call Cloud Run API
    const response = await api.chat(currentUser.uid, activeAgentId, 'session-1', userMsg, 'You are a helpful assistant.');
    
    await addDoc(historyRef, {
      text: response.text || "I'm sorry, I couldn't process that.",
      sender: 'agent',
      timestamp: Date.now()
    });

    setIsTyping(false);
  };

  const toggleVoice = async () => {
    if (isVoiceActive) {
      if (stopVoiceRef.current) stopVoiceRef.current();
      setIsVoiceActive(false);
    } else {
      if (!currentUser) return;
      setIsVoiceActive(true);
      stopVoiceRef.current = await setupVoiceConnection(currentUser.uid, activeAgentId, async (transcript) => {
        const historyRef = collection(db, `messages/${currentUser.uid}/${activeAgentId}/history`);
        await addDoc(historyRef, {
          text: transcript,
          sender: 'agent',
          timestamp: Date.now()
        });
      });
    }
  };

  // Cleanup voice on close
  useEffect(() => {
    if (!isOpen && isVoiceActive && stopVoiceRef.current) {
      stopVoiceRef.current();
      setIsVoiceActive(false);
    }
  }, [isOpen, isVoiceActive]);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[80px] md:bottom-8 right-4 md:right-8 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-transform hover:scale-105 z-50"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[380px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
            </div>
            <div>
              <h3 className="font-semibold">{activeAgentName}</h3>
              <span className="text-xs text-green-400 font-medium px-2 py-0.5 bg-green-400/10 rounded-full">ONLINE</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button 
            className={`flex-1 py-3 text-sm font-medium ${mode === 'chat' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setMode('chat')}
          >
            Chat
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium ${mode === 'voice' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setMode('voice')}
          >
            Voice
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {mode === 'chat' ? (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border shadow-sm text-slate-800 rounded-bl-none'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm p-3 rounded-xl rounded-bl-none flex space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isVoiceActive ? 'bg-indigo-100 scale-110' : 'bg-slate-100'}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isVoiceActive ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}>
                  <Mic size={40} className="text-white" />
                </div>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-slate-800">{isVoiceActive ? 'Listening...' : 'Tap to speak'}</h4>
                <p className="text-sm text-slate-500 mt-2">Powered by Gemini Multimodal Live API</p>
              </div>
              <button 
                onClick={toggleVoice}
                className={`px-8 py-4 rounded-full font-semibold text-white transition-colors ${isVoiceActive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {isVoiceActive ? 'End Call' : 'Start Voice Call'}
              </button>
            </div>
          )}
        </div>

        {/* Input Area (Chat only) */}
        {mode === 'chat' && (
          <div className="p-4 bg-white border-t">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 text-sm transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
