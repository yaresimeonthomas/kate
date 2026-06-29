import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Lead } from '../types';
import { Users, Mail, Phone } from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, `leads/${currentUser.uid}/leadList`), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
    });
    return () => unsub();
  }, [currentUser]);

  const markContacted = async (id: string) => {
    if (!currentUser) return;
    await updateDoc(doc(db, `leads/${currentUser.uid}/leadList`, id), { status: 'Contacted' });
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Leads</h1>
        <p className="text-slate-500 mt-1">Inquiries from web and phone.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leads.length === 0 && (
          <div className="col-span-full p-10 text-center text-slate-400 bg-white rounded-2xl border">No leads yet.</div>
        )}
        {leads.map(lead => (
          <div key={lead.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${lead.source === 'phone' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                  {lead.source === 'phone' ? <Phone size={16} /> : <Users size={16} />}
                </div>
                <h3 className="font-bold text-slate-900">{lead.name}</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${lead.status === 'New' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                {lead.status}
              </span>
            </div>
            
            <div className="space-y-1 mb-4 text-sm text-slate-600">
              {lead.email && <div className="flex items-center space-x-2"><Mail size={14} /> <span>{lead.email}</span></div>}
              {lead.phone && <div className="flex items-center space-x-2"><Phone size={14} /> <span>{lead.phone}</span></div>}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 flex-1 mb-4">
              {lead.message || lead.transcript}
            </div>

            <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">{new Date(lead.submittedAt).toLocaleDateString()}</span>
              {lead.status === 'New' && (
                <button 
                  onClick={() => markContacted(lead.id!)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Mark Contacted
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
