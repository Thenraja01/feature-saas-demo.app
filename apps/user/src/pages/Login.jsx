import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@shared/context/AuthContext.jsx';
import { getPublicOrganizations } from '@shared/api/organization.js';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    organization: ''
  });
  const [publicOrgs, setPublicOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/user');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchPublicOrganizations();
  }, []);

  const fetchPublicOrganizations = async () => {
    try {
      const orgs = await getPublicOrganizations();
      setPublicOrgs(orgs);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.organization) {
      setError('Please select your organization');
      return;
    }

    setLoading(true);

    try {
      const credentials = {
        username: formData.username,
        password: formData.password,
        organization: formData.organization,
        role: 'USER'
      };
      
      const result = await login(credentials);
      if (!result.success) {
        setError(result.error || 'Login failed');
      } else {
        navigate('/user');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="auth-wrapper">
        <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
          <div className="card-body">
            <div className="logo-section mb-4" style={{ justifyContent: 'center' }}>
              <div className="logo-icon">U</div>
              <div className="logo-text" style={{ fontSize: '1.5rem' }}>FeatureFlow</div>
            </div>

            <h2 className="card-title">User Portal</h2>
            <p className="card-desc">Sign in to check and request features</p>

            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
                <span>🔒 {error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Organization</label>
                <select
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  required
                >
                  <option value="">Select Organization</option>
                  {publicOrgs.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                />
              </div>

              <button type="submit" className="btn" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
              Don't have an account? <Link to="/register">Register</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
