import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Appointment } from '../types';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';

export const AppointmentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, `appointments/${currentUser.uid}/appointmentList`), orderBy('date', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment)));
    });
    return () => unsub();
  }, [currentUser]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 mt-1">Manage your bookings.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 flex items-center space-x-2">
          <Plus size={20} />
          <span className="hidden md:inline">New Appointment</span>
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500">
              <th className="p-4 font-medium">Client</th>
              <th className="p-4 font-medium">Service</th>
              <th className="p-4 font-medium">Date & Time</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">No appointments found.</td></tr>
            )}
            {appointments.map(apt => (
              <tr key={apt.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-medium text-slate-900">{apt.name}</div>
                  <div className="text-sm text-slate-500">{apt.phone}</div>
                </td>
                <td className="p-4 text-slate-700">{apt.service}</td>
                <td className="p-4 text-slate-700">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon size={16} className="text-slate-400" />
                    <span>{apt.date} at {apt.time}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                    apt.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {apt.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {appointments.length === 0 && (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border">No appointments found.</div>
        )}
        {appointments.map(apt => (
          <div key={apt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-900">{apt.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                apt.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                apt.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {apt.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{apt.service}</p>
            <div className="flex items-center space-x-2 text-sm text-slate-500 bg-slate-50 p-2 rounded-lg">
              <CalendarIcon size={16} />
              <span>{apt.date} • {apt.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
