import React, { useState } from 'react';
import { Icon } from '../components/Icons.tsx';

export const MarketingView: React.FC = () => {
    const [instantLeadCall, setInstantLeadCall] = useState(false);
    const [apptReminders, setApptReminders] = useState(false);
    const [reviewRequests, setReviewRequests] = useState(false);

    return (
        <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Marketing Automations</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure automated voice and SMS workflows powered by Twilio and Gemini Live API.</p>
                </div>

                <div className="space-y-6">
                    
                    {/* Instant Lead Follow-up */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start gap-6">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icon name="Zap" size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Instant Lead Follow-up Call</h3>
                                    <p className="text-sm text-gray-500 mt-1">When a user submits the contact form on your website, the AI Receptionist will immediately call their phone number to qualify the lead or live transfer them to you.</p>
                                </div>
                                <button 
                                    onClick={() => setInstantLeadCall(!instantLeadCall)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${instantLeadCall ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${instantLeadCall ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {instantLeadCall && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex gap-3">
                                    <Icon name="Info" size={18} className="flex-shrink-0 mt-0.5" />
                                    <p><strong>Active:</strong> Ensure your Twilio webhook is configured in Google Cloud Functions to handle the <code>onDocumentCreated</code> trigger for the <code>leads</code> collection.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pre-Appointment Reminders */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start gap-6">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icon name="CalendarClock" size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Pre-Appointment Voice Reminders</h3>
                                    <p className="text-sm text-gray-500 mt-1">The AI Receptionist will call clients 24 hours before their scheduled appointment to confirm attendance or offer to reschedule.</p>
                                </div>
                                <button 
                                    onClick={() => setApptReminders(!apptReminders)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${apptReminders ? 'bg-purple-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${apptReminders ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {apptReminders && (
                                <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-800 flex gap-3">
                                    <Icon name="Info" size={18} className="flex-shrink-0 mt-0.5" />
                                    <p><strong>Active:</strong> Google Cloud Scheduler is now checking the <code>appointments</code> collection hourly for upcoming meetings.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reputation Marketing */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start gap-6">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Icon name="Star" size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Reputation Marketing (Review Requests)</h3>
                                    <p className="text-sm text-gray-500 mt-1">Automatically send an SMS via Twilio asking for a Google Review immediately after an appointment status is changed to "Completed".</p>
                                </div>
                                <button 
                                    onClick={() => setReviewRequests(!reviewRequests)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${reviewRequests ? 'bg-green-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${reviewRequests ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {reviewRequests && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg text-sm text-green-800 flex gap-3">
                                    <Icon name="Info" size={18} className="flex-shrink-0 mt-0.5" />
                                    <p><strong>Active:</strong> Listening for <code>onUpdate</code> events on the <code>appointments</code> collection where status equals "Completed".</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
