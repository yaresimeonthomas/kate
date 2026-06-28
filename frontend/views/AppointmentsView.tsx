import React, { useState, useEffect } from 'react';
import { Appointment } from '../types.ts';
import { getAppointments, addAppointment, updateAppointment, deleteAppointment } from '../services/db.ts';
import { Icon } from '../components/Icons.tsx';

export const AppointmentsView: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Form state
    const [clientName, setClientName] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [service, setService] = useState('');
    const [status, setStatus] = useState<Appointment['status']>('Scheduled');

    const loadAppointments = async () => {
        setIsLoading(true);
        const data = await getAppointments();
        setAppointments(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const openModal = (appt?: Appointment) => {
        if (appt) {
            setEditingAppt(appt);
            setClientName(appt.clientName);
            setDateTime(appt.dateTime);
            setService(appt.service);
            setStatus(appt.status);
        } else {
            setEditingAppt(null);
            setClientName('');
            setDateTime('');
            setService('');
            setStatus('Scheduled');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAppt) {
            await updateAppointment(editingAppt.id, { clientName, dateTime, service, status });
        } else {
            await addAppointment({ clientName, dateTime, service, status });
        }
        await loadAppointments();
        closeModal();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this appointment?')) {
            await deleteAppointment(id);
            await loadAppointments();
        }
    };

    return (
        <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                        <p className="text-sm text-gray-500">Manage bookings from Firestore</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={loadAppointments}
                            disabled={isLoading}
                            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            <Icon name="RefreshCw" size={18} className={isLoading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                        <button 
                            onClick={() => openModal()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <Icon name="Plus" size={18} />
                            New Appointment
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                <th className="p-4 font-medium">Client Name</th>
                                <th className="p-4 font-medium">Date & Time</th>
                                <th className="p-4 font-medium">Service</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">Loading appointments...</td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">No appointments found.</td>
                                </tr>
                            ) : (
                                appointments.map(appt => (
                                    <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900">{appt.clientName}</td>
                                        <td className="p-4 text-gray-600">{new Date(appt.dateTime).toLocaleString()}</td>
                                        <td className="p-4 text-gray-600">{appt.service}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                                appt.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => openModal(appt)} className="text-gray-400 hover:text-blue-600 p-1 mr-2">
                                                <Icon name="Edit2" size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(appt.id)} className="text-gray-400 hover:text-red-600 p-1">
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">{editingAppt ? 'Edit Appointment' : 'New Appointment'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <Icon name="X" size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                                <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                                <input required type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                                <input required type="text" value={service} onChange={e => setService(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
