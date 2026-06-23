import React, { useState, useEffect } from 'react';
import { apiFetch, getPublicOrganizations, NETWORK_ERROR_MSG } from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('org_admin_token') || null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  
  // Public orgs list for dropdowns
  const [publicOrgs, setPublicOrgs] = useState([]);
  
  // Auth Form Fields
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // User Session State
  const [loggedInUser, setLoggedInUser] = useState(null); // { username, role, organization: { id, name } }
  
  // Feature Flags list state
  const [flags, setFlags] = useState([]);
  const [newFlagKey, setNewFlagKey] = useState('');
  const [newFlagDesc, setNewFlagDesc] = useState('');
  const [newFlagEnabled, setNewFlagEnabled] = useState(false);
  
  // Modal Edit Flag State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFlagId, setEditFlagId] = useState('');
  const [editFlagKey, setEditFlagKey] = useState('');
  const [editFlagDesc, setEditFlagDesc] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { checkThemeFlag } = useTheme();

  useEffect(() => {
    fetchPublicOrganizations();
  }, []);

  useEffect(() => {
    if (token) {
      validateSession();
    }
  }, [token]);

  useEffect(() => {
    const orgId = loggedInUser?.organization?._id || loggedInUser?.organization;
    if (orgId) {
      checkThemeFlag(orgId);
    }
  }, [loggedInUser, checkThemeFlag]);

  const fetchPublicOrganizations = async () => {
    try {
      const orgs = await getPublicOrganizations();
      setPublicOrgs(orgs);
    } catch (err) {
      console.error('Error fetching organizations list:', err);
    }
  };

  const validateSession = async () => {
    try {
      const { res, data } = await apiFetch('/api/v1/auth/me', { token });
      if (res.ok && data.success && (data.data.role === 'ADMIN' || data.data.role === 'SUPER_ADMIN')) {
        setLoggedInUser(data.data);
        fetchFeatureFlags();
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
      handleLogout();
    }
  };

  const fetchFeatureFlags = async () => {
    setLoading(true);
    try {
      const { res, data } = await apiFetch('/api/v1/feature-flags?limit=100', { token });
      if (res.ok && data.success) {
        setFlags(data.data);
      } else {
        showFeedback(data.message || 'Failed to fetch feature flags', 'danger');
      }
    } catch (err) {
      showFeedback(err.message || NETWORK_ERROR_MSG, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedOrgId) {
      setErrorMsg('Please select an organization.');
      return;
    }
    setAuthLoading(true);
    setErrorMsg('');
    try {
      const { res, data } = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: { username, password, organization: selectedOrgId },
      });
      if (res.ok && data.success) {
        const user = data.data.user;
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          localStorage.setItem('org_admin_token', data.data.token);
          setToken(data.data.token);
          // session validation will set loggedInUser and load flags
          showFeedback('Logged in successfully!');
        } else {
          setErrorMsg('Access Denied: This portal requires Admin privileges.');
        }
      } else {
        setErrorMsg(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setErrorMsg(err.message || NETWORK_ERROR_MSG);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!selectedOrgId) {
      setErrorMsg('Please select an organization.');
      return;
    }
    setAuthLoading(true);
    setErrorMsg('');
    try {
      const { res, data } = await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: { username, email: email || null, password, role: 'ADMIN', organization: selectedOrgId },
      });
      if (res.ok && data.success) {
        localStorage.setItem('org_admin_token', data.data.token);
        setToken(data.data.token);
        showFeedback('Registration complete and logged in!');
      } else {
        setErrorMsg(data.message || 'Registration failed. Try another username.');
      }
    } catch (err) {
      setErrorMsg(err.message || NETWORK_ERROR_MSG);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateFlag = async (e) => {
    e.preventDefault();
    if (!newFlagKey.trim()) return;

    try {
      const { res, data } = await apiFetch('/api/v1/feature-flags', {
        method: 'POST',
        token,
        body: { key: newFlagKey, description: newFlagDesc, isEnabled: newFlagEnabled },
      });
      if (res.ok && data.success) {
        showFeedback(`Feature flag "${newFlagKey}" created successfully!`);
        setNewFlagKey('');
        setNewFlagDesc('');
        setNewFlagEnabled(false);
        fetchFeatureFlags();
      } else {
        showFeedback(data.message || 'Failed to create feature flag', 'danger');
      }
    } catch (err) {
      showFeedback(err.message || NETWORK_ERROR_MSG, 'danger');
    }
  };

  const handleToggleFlag = async (id, currentStatus) => {
    const nextStatus = !currentStatus;
    // optimistic update
    setFlags(prev => prev.map(f => f._id === id ? { ...f, isEnabled: nextStatus } : f));
    
    try {
      const { res, data } = await apiFetch(`/api/v1/feature-flags/${id}/toggle`, {
        method: 'PATCH',
        token,
        body: { isEnabled: nextStatus },
      });
      if (!res.ok || !data.success) {
        // rollback
        setFlags(prev => prev.map(f => f._id === id ? { ...f, isEnabled: currentStatus } : f));
        showFeedback(data.message || 'Failed to toggle flag', 'danger');
      }
    } catch (err) {
      setFlags(prev => prev.map(f => f._id === id ? { ...f, isEnabled: currentStatus } : f));
      showFeedback(err.message || NETWORK_ERROR_MSG, 'danger');
    }
  };

  const handleDeleteFlag = async (id, key) => {
    if (!confirm(`Are you sure you want to delete feature flag "${key}"?`)) {
      return;
    }
    try {
      const { res, data } = await apiFetch(`/api/v1/feature-flags/${id}`, {
        method: 'DELETE',
        token,
      });
      if (res.ok && data.success) {
        showFeedback(`Flag "${key}" deleted.`);
        fetchFeatureFlags();
      } else {
        showFeedback(data.message || 'Failed to delete flag', 'danger');
      }
    } catch (err) {
      showFeedback(err.message || NETWORK_ERROR_MSG, 'danger');
    }
  };

  const openEditModal = (flag) => {
    setEditFlagId(flag._id);
    setEditFlagKey(flag.key);
    setEditFlagDesc(flag.description);
    setIsEditOpen(true);
  };

  const handleUpdateFlag = async (e) => {
    e.preventDefault();
    try {
      const { res, data } = await apiFetch(`/api/v1/feature-flags/${editFlagId}`, {
        method: 'PUT',
        token,
        body: { key: editFlagKey, description: editFlagDesc },
      });
      if (res.ok && data.success) {
        showFeedback(`Feature flag updated!`);
        setIsEditOpen(false);
        fetchFeatureFlags();
      } else {
        showFeedback(data.message || 'Failed to update feature flag', 'danger');
      }
    } catch (err) {
      showFeedback(err.message || NETWORK_ERROR_MSG, 'danger');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setLoggedInUser(null);
    setFlags([]);
    localStorage.removeItem('org_admin_token');
  };

  const showFeedback = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  // Stats calculation
  const totalFlags = flags.length;
  const activeFlags = flags.filter(f => f.isEnabled).length;
  const inactiveFlags = totalFlags - activeFlags;

  // Render Auth Mode
  if (!loggedInUser) {
    return (
      <div className="app-container">
        {errorMsg && <div className="alert alert-danger"><span>{errorMsg}</span></div>}
        <div className="auth-wrapper">
          {authMode === 'login' ? (
            <div className="card" id="login-card">
              <h2 className="card-title text-center">Admin Login</h2>
              <p className="card-desc text-center">Manage your organization's feature flags</p>
              
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Select Organization</label>
                  <select 
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Tenant --</option>
                    {publicOrgs.map(org => (
                      <option key={org._id} value={org._id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    required 
                  />
                </div>
                <button type="submit" className="btn mt-4" disabled={authLoading}>
                  {authLoading ? <span className="spinner"></span> : 'Log In'}
                </button>
              </form>
              <p className="text-center mt-4" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                New organization admin? <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('signup'); setErrorMsg(''); }}>Sign Up</a>
              </p>
            </div>
          ) : (
            <div className="card" id="signup-card">
              <h2 className="card-title text-center">Admin Registration</h2>
              <p className="card-desc text-center">Sign up to manage organization feature flags</p>
              
              <form onSubmit={handleSignup}>
                <div className="form-group">
                  <label>Select Organization</label>
                  <select 
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Tenant --</option>
                    {publicOrgs.map(org => (
                      <option key={org._id} value={org._id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username (min 3 chars)" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Email (Optional)</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@org.com" 
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars, uppercase, digit" 
                    required 
                  />
                </div>
                <button type="submit" className="btn mt-4" disabled={authLoading}>
                  {authLoading ? <span className="spinner"></span> : 'Register Admin'}
                </button>
              </form>
              <p className="text-center mt-4" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('login'); setErrorMsg(''); }}>Log In</a>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard Page
  return (
    <div className="app-container">
      <header>
        <div className="logo-section">
          <div className="logo-icon">A</div>
          <div className="logo-text">AdminPortal</div>
          <span className="logo-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-glow)' }}>
            {loggedInUser.organization?.name || 'Assigned Org'}
          </span>
        </div>
        <div className="user-info">
          <span className="username-tag">{loggedInUser.username}</span>
          <button className="btn btn-secondary btn-icon" onClick={handleLogout} style={{ width: 'auto', padding: '0.4rem 1rem' }}>
            Logout
          </button>
        </div>
      </header>

      {successMsg && <div className="alert alert-success"><span>{successMsg}</span></div>}
      {errorMsg && <div className="alert alert-danger"><span>{errorMsg}</span></div>}

      <div className="dashboard-grid">
        <aside className="side-panel">
          <h3 className="mb-4">Create Flag</h3>
          <p className="card-desc" style={{ marginBottom: '1.5rem' }}>Configure a new feature flag key for integration.</p>
          
          <form onSubmit={handleCreateFlag}>
            <div className="form-group">
              <label>Feature Key</label>
              <input 
                type="text" 
                value={newFlagKey}
                onChange={(e) => setNewFlagKey(e.target.value)}
                placeholder="e.g. beta_dashboard" 
                required 
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                Alphanumeric and underscores.
              </small>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={newFlagDesc}
                onChange={(e) => setNewFlagDesc(e.target.value)}
                rows="3" 
                placeholder="Explain what feature this controls..."
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <label style={{ marginBottom: 0 }}>Enable by default?</label>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={newFlagEnabled}
                  onChange={(e) => setNewFlagEnabled(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <button type="submit" className="btn mt-4">
              Add Feature Flag
            </button>
          </form>
        </aside>

        <main className="main-content">
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Total Flags</span>
              <span className="stat-value">{totalFlags}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Active (Enabled)</span>
              <span className="stat-value" style={{ color: 'var(--success)' }}>{activeFlags}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Inactive (Disabled)</span>
              <span className="stat-value" style={{ color: 'var(--danger)' }}>{inactiveFlags}</span>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header">
              <h3>Feature Flag Configurations</h3>
              <button className="btn btn-secondary btn-icon" onClick={fetchFeatureFlags} style={{ width: 'auto', padding: '0.4rem 1rem' }}>
                Refresh List
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Feature Key</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th className="text-center">Toggle</th>
                    <th>Last Modified</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center" style={{ color: 'var(--text-muted)', padding: '3rem 0' }}>
                        <span className="spinner"></span> Loading configuration flags...
                      </td>
                    </tr>
                  ) : flags.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center" style={{ color: 'var(--text-muted)', padding: '3rem 0' }}>
                        No feature flags defined yet. Create one on the left!
                      </td>
                    </tr>
                  ) : (
                    flags.map(flag => (
                      <tr key={flag._id}>
                        <td style={{ fontWeight: 600, color: '#fff', fontFamily: 'monospace', fontSize: '0.95rem' }}>{flag.key}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{flag.description || 'No description'}</td>
                        <td>
                          <span className={`badge badge-${flag.isEnabled ? 'success' : 'danger'}`}>
                            {flag.isEnabled ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-center">
                          <label className="switch">
                            <input 
                              type="checkbox" 
                              checked={flag.isEnabled} 
                              onChange={() => handleToggleFlag(flag._id, flag.isEnabled)}
                            />
                            <span className="slider"></span>
                          </label>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(flag.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="text-right">
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary btn-icon" 
                              onClick={() => openEditModal(flag)}
                              style={{ width: 'auto', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-secondary btn-danger btn-icon" 
                              onClick={() => handleDeleteFlag(flag._id, flag.key)}
                              style={{ width: 'auto', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* EDIT MODAL */}
      <div className={`modal-backdrop ${isEditOpen ? 'open' : ''}`}>
        <div className="modal">
          <div className="modal-header">
            <h3>Edit Feature Flag</h3>
            <button className="btn btn-secondary btn-icon" onClick={() => setIsEditOpen(false)} style={{ width: 'auto', border: 'none', fontSize: '1.25rem', padding: '0.2rem 0.5rem', background: 'transparent' }}>
              &times;
            </button>
          </div>
          <form onSubmit={handleUpdateFlag}>
            <div className="modal-body">
              <div className="form-group">
                <label>Feature Key</label>
                <input 
                  type="text" 
                  value={editFlagKey}
                  onChange={(e) => setEditFlagKey(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={editFlagDesc}
                  onChange={(e) => setEditFlagDesc(e.target.value)}
                  rows="3" 
                  required 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)} style={{ width: 'auto' }}>
                Cancel
              </button>
              <button type="submit" className="btn" style={{ width: 'auto' }}>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
