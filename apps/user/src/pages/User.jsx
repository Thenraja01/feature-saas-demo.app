import React, { useState, useEffect } from 'react';
import { useAuth } from '@shared/context/AuthContext.jsx';
import { useTheme } from '@shared/context/ThemeContext.jsx';
import ThemeToggle from '@shared/components/ThemeToggle.jsx';
import { checkFeatureFlag } from '@shared/api/featureFlag.js';
import { getPublicOrganizations } from '@shared/api/organization.js';

export default function User() {
  const { user, organization, logout } = useAuth();
  const { checkThemeFlag } = useTheme();

  const [publicOrgs, setPublicOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(organization?._id || '');
  const [featureKey, setFeatureKey] = useState('');
  
  // Checking results
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [description, setDescription] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultType, setResultType] = useState(''); // 'enabled', 'disabled', 'not-found'
  const [networkError, setNetworkError] = useState('');

  useEffect(() => {
    fetchPublicOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      checkThemeFlag(selectedOrgId);
    }
  }, [selectedOrgId]);

  const fetchPublicOrganizations = async () => {
    try {
      const orgs = await getPublicOrganizations();
      setPublicOrgs(orgs);
    } catch (err) {
      setNetworkError('Failed to fetch organizations.');
    }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!selectedOrgId || !featureKey.trim()) return;

    setLoading(true);
    setChecked(false);
    setNetworkError('');
    setResultMsg('');

    try {
      const result = await checkFeatureFlag(selectedOrgId, featureKey.trim());
      
      setChecked(true);
      setIsEnabled(result.isEnabled);
      
      if (result.ok) {
        if (result.isEnabled) {
          setResultType('enabled');
          setResultMsg(`The feature "${featureKey}" is currently active!`);
          setDescription(result.data?.description || '');
        } else {
          setResultType('disabled');
          setResultMsg(`The feature "${featureKey}" is disabled for this organization.`);
          setDescription(result.data?.description || '');
        }
      } else {
        setResultType('not-found');
        setResultMsg(result.message || 'Feature flag not found.');
        setDescription('');
      }
    } catch (err) {
      setNetworkError(err.message || 'An error occurred while checking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <h1>Feature Checker</h1>
          <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
            Org: {organization?.name || 'End User'}
          </span>
        </div>
        <div className="header-right">
          <ThemeToggle />
          <span className="user-profile" style={{ marginRight: '1rem' }}>
            👤 {user?.username} (User)
          </span>
          <button className="btn btn-secondary btn-icon" onClick={logout} style={{ width: 'auto' }}>
            Logout
          </button>
        </div>
      </header>

      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Check Feature Status</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Select an organization and query a feature key to see if it is enabled.
            </p>
          </div>

          {networkError && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              {networkError}
            </div>
          )}

          <form onSubmit={handleCheck}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Organization</label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
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

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label>Feature Key</label>
              <input
                type="text"
                value={featureKey}
                onChange={(e) => setFeatureKey(e.target.value)}
                placeholder="e.g. theme_toggle, new_dashboard_ui"
                required
              />
            </div>

            <button type="submit" className="btn" disabled={loading} style={{ width: '100%', padding: '0.85rem' }}>
              {loading ? <span className="spinner"></span> : 'Check Status'}
            </button>
          </form>

          {/* Results section */}
          {checked && (
            <div className="result-container" style={{ marginTop: '2.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Result</h4>
              
              {resultType === 'enabled' && (
                <div style={{ padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--success-glow)', backgroundColor: 'var(--success-bg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✓</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--success)' }}>Enabled</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{resultMsg}</div>
                  {description && (
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      "{description}"
                    </div>
                  )}
                </div>
              )}

              {resultType === 'disabled' && (
                <div style={{ padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--danger-glow)', backgroundColor: 'var(--danger-bg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✕</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--danger)' }}>Disabled</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{resultMsg}</div>
                  {description && (
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      "{description}"
                    </div>
                  )}
                </div>
              )}

              {resultType === 'not-found' && (
                <div style={{ padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--warning-glow)', backgroundColor: 'var(--warning-bg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--warning)' }}>Not Found</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{resultMsg}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
