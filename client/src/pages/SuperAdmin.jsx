import React, { useState, useEffect } from 'react';
import { apiFetch, NETWORK_ERROR_MSG } from '../api/client';

export default function SuperAdmin() {
  const [token, setToken] = useState(localStorage.getItem('super_admin_token') || null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  // Organization state
  const [orgs, setOrgs] = useState([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (token) {
      validateSession();
    }
  }, [token]);

  const validateSession = async () => {
    try {
      const { res, data } = await apiFetch('/api/v1/auth/me', { token });
      if (res.ok && data.success && data.data.role === 'SUPER_ADMIN') {
        setLoggedInUser(data.data.username);
        fetchOrganizations();
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
      handleLogout();
    }
  };

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const { res, data } = await apiFetch('/api/v1/organizations?limit=100', { token });
      if (res.ok && data.success) {
        setOrgs(data.data);
      } else {
        showFeedback(data.message || 'Failed to fetch organizations', 'danger');
      }
    } catch (err) {
      showFeedback(err.message || NETWORK_ERROR_MSG, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg('');
    try {
      const { res, data } = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: { username, password, organization: null },
      });
      if (res.ok && data.success) {
        const user = data.data.user;
        if (user.role === 'SUPER_ADMIN') {
          localStorage.setItem('super_admin_token', data.data.token);
          setToken(data.data.token);
          setLoggedInUser(user.username);
          showFeedback('Logged in successfully!');
        } else {
          setErrorMsg('Error: This account is not a Super Admin.');
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

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    try {
      const { res, data } = await apiFetch('/api/v1/organizations', {
        method: 'POST',
        token,
        body: { name: newOrgName, description: newOrgDesc },
      });
      if (res.ok && data.success) {
        showFeedback(`Organization "${newOrgName}" created!`);
        setNewOrgName('');
        setNewOrgDesc('');
        fetchOrganizations();
      } else {
        showFeedback(data.message || 'Failed to create organization', 'danger');
      }
    } catch (err) {
      showFeedback(err.message || NETWORK_ERROR_MSG, 'danger');
    }
  };

  const handleDeleteOrg = async (id, name) => {
    if (!confirm(`Are you sure you want to delete organization "${name}"?\nAll associated feature flags will be permanently deleted. This action is irreversible.`)) {
      return;
    }
    try {
      const { res, data } = await apiFetch(`/api/v1/organizations/${id}`, {
        method: 'DELETE',
        token,
      });
      if (res.ok && data.success) {
        showFeedback(data.message || `Deleted organization "${name}"`);
        fetchOrganizations();
      } else {
        showFeedback(data.message || 'Failed to delete organization', 'danger');
      }
    } catch (err) {
      showFeedback(err.message || NETWORK_ERROR_MSG, 'danger');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setLoggedInUser(null);
    localStorage.removeItem('super_admin_token');
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

  // Stats
  const totalOrgs = orgs.length;
  const totalUsers = orgs.reduce((sum, o) => sum + (o.userCount || 0), 0);
  const totalFlags = orgs.reduce((sum, o) => sum + (o.flagCount || 0), 0);

  // Return Auth Page if not logged in
  if (!loggedInUser) {
    return (
      <div class="app-container">
        {errorMsg && <div className="alert alert-danger"><span>{errorMsg}</span></div>}
        <div className="auth-wrapper">
          <div className="card">
            <div className="logo-section mb-4" style={{ justifyContent: 'center' }}>
              <div className="logo-icon">S</div>
              <div className="logo-text" style={{ fontSize: '1.5rem' }}>SaaS Control Panel</div>
            </div>
            <h2 className="card-title text-center">Super Admin Login</h2>
            <p class="card-desc text-center">Sign in using static environment credentials</p>
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. superadmin" 
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
                {authLoading ? <span className="spinner"></span> : 'Authenticate'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Page
  return (
    <div className="app-container">
      <header>
        <div className="logo-section">
          <div className="logo-icon">S</div>
          <div className="logo-text">SuperAdmin</div>
          <span className="logo-badge">Host Panel</span>
        </div>
        <div className="user-info">
          <span className="username-tag">{loggedInUser}</span>
          <button className="btn btn-secondary btn-icon" onClick={handleLogout} style={{ width: 'auto', padding: '0.4rem 1rem' }}>
            Logout
          </button>
        </div>
      </header>

      {successMsg && <div className="alert alert-success"><span>{successMsg}</span></div>}
      {errorMsg && <div className="alert alert-danger"><span>{errorMsg}</span></div>}

      <div className="dashboard-grid">
        <aside className="side-panel">
          <h3 className="mb-4">Host Action</h3>
          <p className="card-desc" style={{ marginBottom: '1.5rem' }}>Register a new organization tenant on the platform.</p>
          
          <form onSubmit={handleCreateOrg}>
            <div className="form-group">
              <label>Organization Name</label>
              <input 
                type="text" 
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="e.g. Acme Corp" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={newOrgDesc}
                onChange={(e) => setNewOrgDesc(e.target.value)}
                rows="3" 
                placeholder="Core enterprise tenant description..."
              />
            </div>
            <button type="submit" className="btn mt-4">
              Create Organization
            </button>
          </form>
        </aside>

        <main className="main-content">
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Total Organizations</span>
              <span className="stat-value">{totalOrgs}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total End Users</span>
              <span className="stat-value">{totalUsers}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">System Feature Flags</span>
              <span className="stat-value">{totalFlags}</span>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header">
              <h3>Registered Tenant Organizations</h3>
              <button className="btn btn-secondary btn-icon" onClick={fetchOrganizations} style={{ width: 'auto', padding: '0.4rem 1rem' }}>
                Refresh Data
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Organization Name</th>
                    <th>Description</th>
                    <th className="text-center">Users</th>
                    <th className="text-center">Flags</th>
                    <th>Created At</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center" style={{ color: 'var(--text-muted)', padding: '3rem 0' }}>
                        <span className="spinner"></span> Loading organizations data...
                      </td>
                    </tr>
                  ) : orgs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center" style={{ color: 'var(--text-muted)', padding: '3rem 0' }}>
                        No organizations registered yet. Create one on the left!
                      </td>
                    </tr>
                  ) : (
                    orgs.map(org => (
                      <tr key={org._id}>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{org.name}</td>
                        <td style={{ color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {org.description || 'No description provided'}
                        </td>
                        <td className="text-center">
                          <span className="badge" style={{ backgroundColor: 'hsla(250, 70%, 60%, 0.12)', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}>
                            {org.userCount || 0}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                            {org.flagCount || 0}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(org.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="text-right">
                          <button 
                            className="btn btn-secondary btn-danger btn-icon" 
                            onClick={() => handleDeleteOrg(org._id, org.name)}
                            style={{ width: 'auto', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                          >
                            Delete
                          </button>
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
    </div>
  );
}
