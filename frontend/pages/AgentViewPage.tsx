import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Lead, Post } from '../types';
import { PhoneCall, Globe, Share2, Check, X, Play } from 'lucide-react';
import { api } from '../services/api';

export const AgentViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, businessContext } = useAuth();

  if (!currentUser) return null;

  // Render specific views based on agent ID
  if (id === 'front_desk') return <FrontDeskView userId={currentUser.uid} />;
  if (id === 'web_design') return <WebDesignView userId={currentUser.uid} businessContext={businessContext} />;
  if (id === 'social_media') return <SocialMediaView userId={currentUser.uid} />;

  return (
    <div className="p-10 flex items-center justify-center h-full">
      <div className="text-center text-slate-500">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Standard Workspace</h2>
        <p>Use the universal chat widget to interact with this agent.</p>
      </div>
    </div>
  );
};

const FrontDeskView = ({ userId }: { userId: string }) => {
  const [calls, setCalls] = useState<Lead[]>([]);

  useEffect(() => {
    const q = query(collection(db, `leads/${userId}/leadList`), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)).filter(l => l.source === 'phone');
      setCalls(data);
    });
    return () => unsub();
  }, [userId]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex items-center space-x-4">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
          <PhoneCall size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Receptionist Panel</h1>
          <p className="text-slate-500 text-sm">Twilio + Gemini Live Call Logs</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Recent Calls</h3>
          <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Listening on Twilio Webhook</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {calls.length === 0 ? (
            <div className="text-center text-slate-400 py-10">No calls recorded yet.</div>
          ) : calls.map(call => (
            <div key={call.id} className="border rounded-xl p-4 hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-slate-900">{call.name || 'Unknown Caller'}</h4>
                  <p className="text-sm text-slate-500">{call.phone} • {call.duration || '0:00'}</p>
                </div>
                <span className="text-xs text-slate-400">{new Date(call.submittedAt).toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 mb-4 max-h-32 overflow-y-auto">
                <span className="font-semibold text-slate-900 block mb-1">Transcript:</span>
                {call.transcript || call.message}
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-100">Book Appointment</button>
                <button className="px-4 py-2 bg-slate-50 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100">Draft Follow Up</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WebDesignView = ({ userId, businessContext }: { userId: string, businessContext: any }) => {
  const [publishing, setPublishing] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');

  const handlePublish = async () => {
    setPublishing(true);
    // In reality, this would grab the generated HTML from the agent's state
    const mockHtml = `<html><body><h1>${businessContext?.businessName}</h1></body></html>`;
    const res = await api.publishSite(userId, mockHtml, businessContext?.businessName || 'site');
    setLiveUrl(res.url);
    setPublishing(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b bg-white flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <Globe size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Website Builder</h1>
            <p className="text-slate-500 text-sm">Auto-deploy to Firebase Hosting</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {liveUrl && <a href={liveUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">{liveUrl}</a>}
          <button 
            onClick={handlePublish}
            disabled={publishing}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {publishing ? <span className="animate-pulse">Deploying...</span> : <><Play size={16} /> <span>Publish Live</span></>}
          </button>
        </div>
      </div>
      <div className="flex-1 bg-slate-200 p-8 flex items-center justify-center">
        {/* Mock Iframe Preview */}
        <div className="w-full max-w-4xl h-full bg-white rounded-t-xl shadow-2xl overflow-hidden flex flex-col">
          <div className="h-8 bg-slate-100 border-b flex items-center px-4 space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex-1 p-10 text-center flex flex-col items-center justify-center">
            <h1 className="text-5xl font-bold text-slate-900 mb-4">{businessContext?.businessName || 'Your Business'}</h1>
            <p className="text-xl text-slate-600 max-w-lg">{businessContext?.differentiator || 'We provide the best services in town.'}</p>
            <button className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-full font-semibold">Book Now</button>
            <p className="mt-10 text-sm text-slate-400">Use the chat widget to ask the Web Design Agent to modify this template.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialMediaView = ({ userId }: { userId: string }) => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const q = query(collection(db, `posts/${userId}/postList`));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });
    return () => unsub();
  }, [userId]);

  const handleApprove = async (id: string, content: string) => {
    await updateDoc(doc(db, `posts/${userId}/postList`, id), { status: 'Approved' });
    await api.publishPost(userId, content);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex items-center space-x-4">
        <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center">
          <Share2 size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Approval Queue</h1>
          <p className="text-slate-500 text-sm">Review drafts before sending to Zernio API</p>
        </div>
      </div>

      <div className="grid gap-4">
        {posts.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center text-slate-500 border border-slate-200">
            No posts in queue. Ask the Social Media Agent to draft some content!
          </div>
        ) : posts.map(post => (
          <div key={post.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div className="flex-1 pr-6">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${
                  post.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {post.status}
                </span>
              </div>
              <p className="text-slate-800 whitespace-pre-wrap">{post.content}</p>
            </div>
            {post.status === 'Draft' && (
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => handleApprove(post.id!, post.content)}
                  className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200"
                >
                  <Check size={20} />
                </button>
                <button className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200">
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
