import React, { useState, useEffect } from 'react';
import { apiFetch, getPublicOrganizations, NETWORK_ERROR_MSG } from '../api/client';
import { useTheme, THEME_FLAG_KEY } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function User() {
  const [publicOrgs, setPublicOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [featureKey, setFeatureKey] = useState('');
  const [networkError, setNetworkError] = useState('');

  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [description, setDescription] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultType, setResultType] = useState('');

  const { checkThemeFlag, themeToggleEnabled } = useTheme();

  useEffect(() => {
    fetchPublicOrganizations();
  }, []);

  useEffect(() => {
    checkThemeFlag(selectedOrgId);
  }, [selectedOrgId, checkThemeFlag]);

  const fetchPublicOrganizations = async () => {
    try {
      setNetworkError('');
      const orgs = await getPublicOrganizations();
      setPublicOrgs(orgs);
    } catch (err) {
      setNetworkError(err.message || NETWORK_ERROR_MSG);
    }
  };

  const handleCheckFlag = async (e) => {
    e.preventDefault();
    if (!selectedOrgId) {
      alert('Please select an organization.');
      return;
    }
    if (!featureKey.trim()) {
      alert('Please enter a feature key.');
      return;
    }

    setLoading(true);
    setChecked(false);
    setResultType('');

    try {
      setNetworkError('');
      const params = new URLSearchParams({ orgId: selectedOrgId, key: featureKey.trim() });
      const { res, data } = await apiFetch(`/api/v1/feature-flags/public/check?${params}`);

      setChecked(true);
      if (res.ok && data.success) {
        setIsEnabled(data.isEnabled);
        setDescription(data.data.description || 'No description provided.');
        if (data.isEnabled) {
          setResultType('enabled');
          setResultMsg(`Feature "${featureKey}" is active.`);
        } else {
          setResultType('disabled');
          setResultMsg(`Feature "${featureKey}" is disabled.`);
        }
      } else {
        setIsEnabled(false);
        setResultType('not-found');
        setResultMsg(data.message || `Feature flag "${featureKey}" does not exist.`);
        setDescription('');
      }
    } catch (err) {
      setNetworkError(err.message || NETWORK_ERROR_MSG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo-section">
          <div className="logo-icon">U</div>
          <div className="logo-text">ClientPortal</div>
          <span className="logo-badge">End User Access</span>
        </div>
        <div className="user-info">
          <ThemeToggle />
          <span className="logo-badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
            Read Only
          </span>
        </div>
      </header>

      {networkError && (
        <div className="alert alert-danger"><span>{networkError}</span></div>
      )}

      <div className="auth-wrapper" style={{ padding: '1rem 0' }}>
        <div className="card" style={{ maxWidth: '520px' }}>
          <h2 className="card-title text-center">Feature Flag Checker</h2>
          <p className="card-desc text-center">
            Submit a query to evaluate the enabled status of a product feature key for your organization tenant.
          </p>

          <form onSubmit={handleCheckFlag}>
            <div className="form-group">
              <label>Select Your Organization</label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                required
              >
                <option value="">-- Choose Organization --</option>
                {publicOrgs.map(org => (
                  <option key={org._id} value={org._id}>{org.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Feature Key</label>
              <input
                type="text"
                value={featureKey}
                onChange={(e) => setFeatureKey(e.target.value)}
                placeholder="e.g. beta_dashboard"
                required
              />
            </div>

            <button type="submit" className="btn mt-4" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span> Checking Flag...
                </>
              ) : 'Evaluate Status'}
            </button>
          </form>

          {selectedOrgId && themeToggleEnabled && (
            <div className="feature-demo-card">
              <h4>Live feature: Theme Toggle</h4>
              <p>
                The <code>{THEME_FLAG_KEY}</code> flag is enabled for this organization.
                Use the theme button above to switch between light and dark mode.
              </p>
              <ThemeToggle />
            </div>
          )}

          {checked && (
            <div className="status-display-wrapper">
              {resultType === 'enabled' && (
                <div className="status-badge-lg enabled">
                  <div className="status-icon-big">✦</div>
                  <div className="status-text-title">Enabled</div>
                  <div className="status-text-subtitle">{resultMsg}</div>
                  {description && (
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem', fontStyle: 'italic' }}>
                      "{description}"
                    </div>
                  )}
                </div>
              )}
              {resultType === 'disabled' && (
                <div className="status-badge-lg disabled">
                  <div className="status-icon-big">✕</div>
                  <div className="status-text-title">Disabled</div>
                  <div className="status-text-subtitle">{resultMsg}</div>
                  {description && (
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem', fontStyle: 'italic' }}>
                      "{description}"
                    </div>
                  )}
                </div>
              )}
              {resultType === 'not-found' && (
                <div className="status-badge-lg not-found">
                  <div className="status-icon-big">⚠</div>
                  <div className="status-text-title">Not Found</div>
                  <div className="status-text-subtitle">{resultMsg}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
