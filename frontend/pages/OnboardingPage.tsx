import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Send, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const QUESTIONS = [
  { key: 'businessName', text: "Hi! I'm Kate, your Onboarding Agent. What is your business name and what do you do?" },
  { key: 'services', text: "Great! What are your main services and prices?" },
  { key: 'hours', text: "Got it. What are your business hours?" },
  { key: 'location', text: "What city are you located in?" },
  { key: 'idealCustomer', text: "Who is your ideal customer?" },
  { key: 'brandVoice', text: "What is your brand personality — professional, friendly, casual, or fun?" },
  { key: 'platforms', text: "What social media platforms do you use?" },
  { key: 'phone', text: "What is your phone number for the front desk?" },
  { key: 'differentiator', text: "What makes your business different from competitors?" },
  { key: 'commonQuestions', text: "Finally, what are your most common customer questions?" }
];

const DEFAULT_AGENTS = [
  { id: "business_manager", name: "Business Manager", subtitle: "Strategic Oversight & Operations", icon: "briefcase", color: "purple", tier: "starter", status: "online" },
  { id: "social_media", name: "Social Media Agent", subtitle: "Content & Engagement", icon: "share", color: "pink", tier: "growth", status: "online" },
  { id: "web_design", name: "Web Design Agent", subtitle: "Landing Page Builder", icon: "layout", color: "green", tier: "growth", status: "online" },
  { id: "front_desk", name: "Front Desk Agent", subtitle: "Voice AI & Inquiries", icon: "phone", color: "orange", tier: "pro", status: "online" }
];

export const OnboardingPage: React.FC = () => {
  const { currentUser, refreshContext } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<{sender: 'agent'|'user', text: string}[]>([
    { sender: 'agent', text: QUESTIONS[0].text }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const currentQ = QUESTIONS[currentIndex];
    const newAnswers = { ...answers, [currentQ.key]: input };
    setAnswers(newAnswers);
    
    setChat(prev => [...prev, { sender: 'user', text: input }]);
    setInput('');

    if (currentIndex < QUESTIONS.length - 1) {
      setTimeout(() => {
        setChat(prev => [...prev, { sender: 'agent', text: QUESTIONS[currentIndex + 1].text }]);
        setCurrentIndex(currentIndex + 1);
      }, 600);
    } else {
      await finishOnboarding(newAnswers);
    }
  };

  const finishOnboarding = async (finalAnswers: Record<string, string>) => {
    if (!currentUser) return;
    setIsProcessing(true);
    setChat(prev => [...prev, { sender: 'agent', text: "Perfect! I'm setting up your AI agents and building your workspace now. This will just take a moment..." }]);

    try {
      // Save business context
      await setDoc(doc(db, 'business_context', currentUser.uid), finalAnswers);
      
      // Seed default agents
      const agentsRef = collection(db, `agents/${currentUser.uid}/agentList`);
      for (const agent of DEFAULT_AGENTS) {
        await setDoc(doc(agentsRef, agent.id), agent);
      }

      // Trigger Cloud Run to create Vertex AI agents
      await api.createAgents(finalAnswers);

      await refreshContext();
      navigate('/dashboard');
    } catch (error) {
      console.error("Onboarding error:", error);
      setChat(prev => [...prev, { sender: 'agent', text: "Oops, something went wrong saving your setup. Please try refreshing." }]);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-3xl mx-auto shadow-xl bg-white">
      <div className="p-6 border-b bg-slate-900 text-white">
        <h1 className="text-2xl font-bold">Welcome to Kate AOS</h1>
        <p className="text-slate-400 text-sm mt-1">Let's configure your AI workforce.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}>
              <p className="text-[15px] leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none flex space-x-2">
              <Loader2 className="animate-spin text-indigo-600" size={20} />
              <span className="text-sm text-slate-600">Configuring agents...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isProcessing}
            placeholder="Type your answer..."
            className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-4 text-base transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
