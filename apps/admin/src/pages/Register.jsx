import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@shared/context/AuthContext.jsx';
import { getPublicOrganizations } from '@shared/api/organization.js';

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: ''
  });
  const [publicOrgs, setPublicOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.organization) {
      setError('Please select an organization');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        organization: formData.organization,
        role: 'ADMIN'
      });

      if (!result.success) {
        setError(result.error || 'Registration failed');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
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
              <div className="logo-icon">A</div>
              <div className="logo-text" style={{ fontSize: '1.5rem' }}>FeatureFlow</div>
            </div>

            <h2 className="card-title">Admin Registration</h2>
            <p className="card-desc">Create an admin account for your organization</p>

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

              <div className="form-group">
                <label>Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm password"
                  required
                />
              </div>

              <button type="submit" className="btn" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Register Admin Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
              Already have an account? <Link to="/login">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
