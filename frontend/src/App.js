import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Assessment from './components/Assessment';
import AdminPanel from './components/AdminPanel';
import SovereigntyAudit from './components/SovereigntyAudit';
import InviteAssessment from './components/InviteAssessment';
import InviteAudit from './components/InviteAudit';

// Check if current URL is an invite link: /invite/{token}
const getInviteToken = () => {
  const match = window.location.pathname.match(/^\/invite\/([a-f0-9]{64})$/);
  return match ? match[1] : null;
};

function App() {
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [inviteData, setInviteData] = useState(null); // { token, type }

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // If this is an invite URL, validate token and determine type
  const inviteToken = getInviteToken();
  useEffect(() => {
    if (!inviteToken) return;
    const API = process.env.REACT_APP_API_URL || '/api';
    fetch(`${API}/invites/${inviteToken}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setInviteData({ token: inviteToken, type: data.inviteType || 'assessment' }))
      .catch(() => setInviteData({ token: inviteToken, type: 'assessment' })); // fallback
  }, [inviteToken]);

  if (inviteToken) {
    if (!inviteData) {
      return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Laden...</p></div>;
    }
    if (inviteData.type === 'audit') {
      return <InviteAudit token={inviteToken} />;
    }
    return <InviteAssessment token={inviteToken} />;
  }

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveModule('dashboard');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setActiveModule('dashboard');
  };

  if (!user) return <Login onLogin={handleLogin} />;
  if (user.role === 'admin') return <AdminPanel onLogout={handleLogout} />;

  if (activeModule === 'dashboard') {
    return (
      <Dashboard
        user={user}
        onSelect={(module) => setActiveModule(module)}
        onLogout={handleLogout}
      />
    );
  }

  if (activeModule === 'audit') {
    return (
      <SovereigntyAudit
        user={user}
        onBack={() => setActiveModule('dashboard')}
      />
    );
  }

  return (
    <Assessment
      user={user}
      onLogout={handleLogout}
      onHome={() => setActiveModule('dashboard')}
    />
  );
}

export default App;
