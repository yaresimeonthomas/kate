import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Settings, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../AuthContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/leads', icon: Users, label: 'Leads' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[220px] bg-slate-900 text-white h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Kate <span className="text-indigo-500">AOS</span></h1>
          <p className="text-xs text-slate-400 mt-1 truncate">{userData?.businessName || 'Business'}</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-4 py-3 w-full text-left text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-slate-900 flex justify-around items-center px-2 z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-indigo-500' : 'text-slate-400'
              }`}
            >
              <Icon size={24} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
