// Super Admin Login — only for SUPER_ADMIN role
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, error: authError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/super-admin');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ username, password });
    setLoading(false);

    if (result.success) {
      if (result.user.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
      } else {
        setError('Access denied. This portal is for Super Admins only.');
      }
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="app-container">
      <div className="auth-wrapper">
        <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
          <div className="card-body">
            <div className="logo-section mb-4" style={{ justifyContent: 'center' }}>
              <div className="logo-icon">S</div>
              <div className="logo-text" style={{ fontSize: '1.5rem' }}>FeatureFlow</div>
            </div>

            <h2 className="card-title">SuperAdmin Portal</h2>
            <p className="card-desc">
              Host-level access · Manage all organizations
            </p>

            {(error || authError) && (
              <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
                <span>🔒 {error || authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  id="sa-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label>Password</label>
                <input
                  id="sa-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button id="sa-login-btn" type="submit" className="btn" disabled={loading}>
                {loading ? <><span className="spinner"></span> Signing in...</> : 'Sign In as SuperAdmin'}
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                <strong>Demo:</strong> superadmin / password123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
