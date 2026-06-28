import React, { useState, useEffect } from 'react';
import { ContactLead } from '../types.ts';
import { getLeads, deleteLead } from '../services/db.ts';
import { Icon } from '../components/Icons.tsx';

export const LeadsView: React.FC = () => {
    const [leads, setLeads] = useState<ContactLead[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadLeads = async () => {
        setIsLoading(true);
        const data = await getLeads();
        setLeads(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadLeads();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this lead?')) {
            await deleteLead(id);
            await loadLeads();
        }
    };

    return (
        <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Website Leads</h1>
                        <p className="text-sm text-gray-500">Contact form submissions from your landing pages</p>
                    </div>
                    <button 
                        onClick={loadLeads}
                        disabled={isLoading}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <Icon name="RefreshCw" size={18} className={isLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">Contact Info</th>
                                <th className="p-4 font-medium">Message</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">Loading leads...</td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">No leads found.</td>
                                </tr>
                            ) : (
                                leads.map(lead => (
                                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-gray-600 whitespace-nowrap">{new Date(lead.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium text-gray-900">{lead.name}</td>
                                        <td className="p-4 text-gray-600">
                                            <div className="flex flex-col gap-1">
                                                <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline flex items-center gap-1 text-sm"><Icon name="Mail" size={12}/> {lead.email}</a>
                                                {lead.phone && <a href={`tel:${lead.phone}`} className="text-gray-500 hover:text-indigo-600 transition flex items-center gap-1 text-sm"><Icon name="Phone" size={12}/> {lead.phone}</a>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 max-w-md truncate" title={lead.message}>{lead.message}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleDelete(lead.id)} className="text-gray-400 hover:text-red-600 p-1">
                                                <Icon name="Trash2" size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
