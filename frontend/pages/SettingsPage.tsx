import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Agent } from '../types';
import { Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser, businessContext } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, `agents/${currentUser.uid}/agentList`), (snap) => {
      setAgents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Agent)));
    });
    return () => unsub();
  }, [currentUser]);

  const updateAgentId = async (agentId: string, vertexId: string) => {
    if (!currentUser) return;
    setSaving(agentId);
    await updateDoc(doc(db, `agents/${currentUser.uid}/agentList`, agentId), { vertexAgentId: vertexId });
    setTimeout(() => setSaving(null), 500);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Vertex AI Agent Configuration</h2>
          <p className="text-sm text-slate-500">Connect your dashboard to Agent Builder.</p>
        </div>
        <div className="p-6 space-y-6">
          {agents.map(agent => (
            <div key={agent.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{agent.name}</h3>
                <p className="text-xs text-slate-500">{agent.subtitle}</p>
              </div>
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  defaultValue={agent.vertexAgentId || ''}
                  placeholder="projects/.../locations/.../agents/..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  onBlur={(e) => updateAgentId(agent.id, e.target.value)}
                />
                <button className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                  {saving === agent.id ? <span className="text-green-600 text-xs font-bold">Saved</span> : <Save size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Business Context</h2>
          <p className="text-sm text-slate-500">Information used by your agents.</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {businessContext && Object.entries(businessContext).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
              <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-800 border border-slate-100">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
