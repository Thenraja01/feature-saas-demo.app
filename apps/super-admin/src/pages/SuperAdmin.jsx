// SuperAdmin.jsx — Create & manage all organizations
import React, { useState, useEffect } from 'react';
import { useAuth } from '@shared/context/AuthContext.jsx';
import useOrganizations from '@shared/hooks/useOrganizations.js';

export default function SuperAdmin() {
  const { user, logout } = useAuth();
  
  const {
    organizations,
    loading,
    error,
    fetchOrgs,
    addOrg,
    removeOrg
  } = useOrganizations();

  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  useEffect(() => {
    if (error) {
      showFeedback(error, 'danger');
    }
  }, [error]);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    try {
      await addOrg(newOrgName.trim(), newOrgDesc.trim());
      showFeedback(`Organization "${newOrgName}" created!`);
      setNewOrgName('');
      setNewOrgDesc('');
    } catch (err) {
      // Hook sets error state which triggers showFeedback via useEffect
    }
  };

  const handleDeleteOrg = async (id, name) => {
    if (!confirm(`Delete organization "${name}"?\nAll associated feature flags will be permanently deleted.`)) return;

    try {
      const deleted = await removeOrg(id);
      if (deleted) {
        showFeedback(`Deleted "${name}"`);
      }
    } catch (err) {
      // Hook sets error state
    }
  };

  const showFeedback = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setSuccessMsg('');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  const totalOrgs = organizations.length;
  const totalUsers = organizations.reduce((sum, o) => sum + (o.userCount || 0), 0);
  const totalFlags = organizations.reduce((sum, o) => sum + (o.flagCount || 0), 0);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <h1>SuperAdmin Panel</h1>
          <span className="badge" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}>
            Host Panel
          </span>
        </div>
        <div className="header-right">
          <span className="user-profile">
            👤 {user?.username}
          </span>
          <button
            className="btn btn-secondary"
            onClick={logout}
            style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="main-content">
        {successMsg && <div className="alert alert-success"><span>✓ {successMsg}</span></div>}
        {errorMsg && <div className="alert alert-danger"><span>✕ {errorMsg}</span></div>}

        <div className="dashboard-grid">
          {/* Create Form */}
          <div className="card">
            <div className="card-header">
              <h3>Create Organization</h3>
            </div>
            <form onSubmit={handleCreateOrg}>
              <div className="card-body">
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Register a new tenant organization on the platform.
                </p>
                <div className="form-group">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={e => setNewOrgName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newOrgDesc}
                    onChange={e => setNewOrgDesc(e.target.value)}
                    rows="3"
                    placeholder="Core enterprise tenant description..."
                  />
                </div>
              </div>
              <div className="card-footer">
                <button type="submit" className="btn" style={{ width: 'auto', padding: '0.65rem 1.75rem' }}>
                  + Create Organization
                </button>
              </div>
            </form>
          </div>

          {/* Org Table */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
              <h3>Registered Organizations</h3>
              <button
                className="btn btn-secondary"
                onClick={fetchOrgs}
                style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.82rem' }}
              >
                ↻ Refresh
              </button>
            </div>
            
            {/* Stats Row */}
            <div style={{ display: 'flex', gap: '1.5rem', padding: '1.25rem 1.75rem', backgroundColor: 'var(--border-light)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>{totalOrgs}</div>
                <div className="stat-label" style={{ fontSize: '0.7rem' }}>Organizations</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{totalUsers}</div>
                <div className="stat-label" style={{ fontSize: '0.7rem' }}>End Users</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{totalFlags}</div>
                <div className="stat-label" style={{ fontSize: '0.7rem' }}>System Flags</div>
              </div>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Organization</th>
                      <th>Description</th>
                      <th className="text-center">Users</th>
                      <th className="text-center">Flags</th>
                      <th>Created</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && organizations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center" style={{ color: 'var(--text-muted)', padding: '3rem 0' }}>
                          <span className="spinner"></span> Loading...
                        </td>
                      </tr>
                    ) : organizations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center" style={{ color: 'var(--text-muted)', padding: '3rem 0', fontSize: '0.9rem' }}>
                          No organizations yet. Create one to get started!
                        </td>
                      </tr>
                    ) : (
                      organizations.map(org => (
                        <tr key={org._id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{org.name}</td>
                          <td style={{ color: 'var(--text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                            {org.description || '—'}
                          </td>
                          <td className="text-center">
                            <span className="badge" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}>
                              {org.userCount || 0}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-glow)' }}>
                              {org.flagCount || 0}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {new Date(org.createdAt).toLocaleDateString()}
                          </td>
                          <td className="text-right">
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDeleteOrg(org._id, org.name)}
                              style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
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
          </div>
        </div>
      </div>
    </div>
  );
}
