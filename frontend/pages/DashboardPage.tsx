import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Agent } from '../types';
import { Briefcase, Share2, Layout as LayoutIcon, Phone, Lock, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const iconMap: Record<string, any> = {
  briefcase: Briefcase,
  share: Share2,
  layout: LayoutIcon,
  phone: Phone
};

const colorMap: Record<string, string> = {
  purple: 'bg-purple-100 text-purple-600',
  pink: 'bg-pink-100 text-pink-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600'
};

export const DashboardPage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, `agents/${currentUser.uid}/agentList`), (snapshot) => {
      const loadedAgents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
      setAgents(loadedAgents);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const isLocked = (agentTier: string) => {
    if (!userData) return true;
    const tiers = { starter: 1, growth: 2, pro: 3 };
    return tiers[agentTier as keyof typeof tiers] > tiers[userData.tier as keyof typeof tiers];
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Your AI Workforce</h1>
        <p className="text-slate-500 mt-2">Manage and interact with your specialized agents.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {agents.map(agent => {
          const Icon = iconMap[agent.icon] || Briefcase;
          const locked = isLocked(agent.tier);

          return (
            <div key={agent.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              {locked && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Lock className="text-slate-500" size={24} />
                  </div>
                  <h4 className="font-semibold text-slate-900">Pro Feature</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Upgrade to unlock this agent.</p>
                  <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 w-full">
                    Upgrade Plan
                  </button>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[agent.color] || 'bg-slate-100 text-slate-600'}`}>
                  <Icon size={24} />
                </div>
                <div className="flex items-center space-x-1.5 bg-green-50 px-2.5 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">Online</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900">{agent.name}</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6 h-10">{agent.subtitle}</p>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => navigate(`/agent/${agent.id}`)}
                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  Open Workspace
                </button>
                <button 
                  onClick={() => navigate('/settings')}
                  className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
