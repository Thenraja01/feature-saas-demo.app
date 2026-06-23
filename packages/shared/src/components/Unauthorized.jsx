import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Unauthorized() {
  const { logout } = useAuth();
  
  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>
          You don't have permission to access this page.
        </p>
        <button onClick={logout} className="btn" style={{ width: '100%' }}>
          Logout & Sign In Again
        </button>
      </div>
    </div>
  );
}
