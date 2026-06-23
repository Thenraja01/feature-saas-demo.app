import React, { useState } from 'react';
import SuperAdmin from './pages/SuperAdmin';
import Admin from './pages/Admin';
import User from './pages/User';
import ThemeToggle from './components/ThemeToggle';
import './styles/App.css';

export default function App() {
  const [activePortal, setActivePortal] = useState('user');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav className="portal-switcher">
        <span className="portal-switcher-title">✦ Feature Flag SaaS</span>
        <div className="portal-tabs">
          <ThemeToggle />
          <button
            className={`portal-tab ${activePortal === 'user' ? 'active' : ''}`}
            onClick={() => setActivePortal('user')}
          >
            End User
          </button>
          <button
            className={`portal-tab ${activePortal === 'org-admin' ? 'active' : ''}`}
            onClick={() => setActivePortal('org-admin')}
          >
            Org Admin
          </button>
          <button
            className={`portal-tab ${activePortal === 'super-admin' ? 'active' : ''}`}
            onClick={() => setActivePortal('super-admin')}
          >
            Super Admin
          </button>
        </div>
      </nav>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {activePortal === 'super-admin' && <SuperAdmin />}
        {activePortal === 'org-admin' && <Admin />}
        {activePortal === 'user' && <User />}
      </div>
    </div>
  );
}
