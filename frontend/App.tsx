import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { ChatWidget } from './components/ChatWidget';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { LeadsPage } from './pages/LeadsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AgentViewPage } from './pages/AgentViewPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode, requireOnboarding?: boolean }> = ({ children, requireOnboarding = true }) => {
  const { currentUser, businessContext, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  
  if (!currentUser) return <Navigate to="/" />;
  
  if (requireOnboarding && !businessContext) return <Navigate to="/onboarding" />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { currentUser, businessContext } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          currentUser ? (businessContext ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />) : <AuthPage />
        } />
        
        <Route path="/onboarding" element={
          <ProtectedRoute requireOnboarding={false}>
            <OnboardingPage />
          </ProtectedRoute>
        } />

        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/agent/:id" element={<AgentViewPage />} />
              </Routes>
              <ChatWidget />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
