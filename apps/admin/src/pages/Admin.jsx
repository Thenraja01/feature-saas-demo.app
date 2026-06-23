import React, { useState, useEffect } from 'react';
import { useAuth } from '@shared/context/AuthContext.jsx';
import { useTheme } from '@shared/context/ThemeContext.jsx';
import ThemeToggle from '@shared/components/ThemeToggle.jsx';
import useFeatureFlags from '@shared/hooks/useFeatureFlags.js';
import { getDashboardStats } from '@shared/api/dashboard.js';

export default function Admin() {
  const { user, organization, logout } = useAuth();
  const { checkThemeFlag } = useTheme();

  const orgId = organization?._id;

  const {
    flags,
    loading,
    error,
    fetchFlags,
    addFlag,
    toggle,
    update,
    remove
  } = useFeatureFlags(orgId);

  const [stats, setStats] = useState(null);
  
  // Forms & Modals
  const [newFlag, setNewFlag] = useState({ key: '', description: '', isEnabled: false });
  const [editFlag, setEditFlag] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Statuses
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (orgId) {
      fetchFlags();
      fetchStats();
      checkThemeFlag(orgId);
    }
  }, [orgId, fetchFlags]);

  useEffect(() => {
    if (error) {
      showFeedback(error, 'danger');
    }
  }, [error]);

  const showFeedback = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setErrorMsg('');
    } else {
      setErrorMsg(msg);
      setSuccessMsg('');
    }
    setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 4000);
  };

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats('ADMIN', orgId);
      setStats(data);
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newFlag.key.trim()) return;

    try {
      await addFlag({
        key: newFlag.key.trim(),
        description: newFlag.description.trim(),
        isEnabled: newFlag.isEnabled
      });
      setNewFlag({ key: '', description: '', isEnabled: false });
      showFeedback('Feature flag created successfully!');
      fetchStats();
    } catch (err) {
      // Error state handled in useEffect
    }
  };

  const handleToggle = async (id, currentVal) => {
    try {
      const success = await toggle(id, currentVal);
      if (success) {
        showFeedback(`Flag status updated!`);
        fetchStats();
        // Check theme toggle status if the flag matches
        const clickedFlag = flags.find(f => f._id === id);
        if (clickedFlag && clickedFlag.key === 'theme_toggle') {
          checkThemeFlag(orgId);
        }
      }
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the flag "${name}"?`)) return;

    try {
      const success = await remove(id);
      if (success) {
        showFeedback('Feature flag deleted successfully!');
        fetchStats();
      }
    } catch (err) {
      // Error handled by hook
    }
  };

  const openEditModal = (flag) => {
    setEditFlag({ ...flag });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editFlag.key.trim()) return;

    try {
      await update(editFlag._id, {
        key: editFlag.key.trim(),
        description: editFlag.description.trim(),
      });
      setIsEditOpen(false);
      showFeedback('Feature flag updated successfully!');
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <h1>Admin Portal</h1>
          <span className="badge" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary-glow)' }}>
            {organization?.name || 'Loading...'}
          </span>
        </div>
        <div className="header-right">
          <ThemeToggle />
          <span className="user-profile">
            👤 {user?.username}
          </span>
          <button className="btn btn-secondary" onClick={logout} style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </header>

      <div className="main-content">
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* Stats Grid */}
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '1.75rem 1.5rem' }}>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {stats?.totalFlags ?? flags.length}
              </div>
              <div className="stat-label">Total Flags</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '1.75rem 1.5rem' }}>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {stats?.activeFlags ?? flags.filter(f => f.isEnabled).length}
              </div>
              <div className="stat-label">Active Flags</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '1.75rem 1.5rem' }}>
              <div className="stat-value">
                {stats?.totalUsers ?? 0}
              </div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Create Flag Form */}
          <div className="card">
            <div className="card-header">
              <h3>Create Feature Flag</h3>
            </div>
            <form onSubmit={handleCreate}>
              <div className="card-body">
                <div className="form-group">
                  <label>Feature Key</label>
                  <input
                    type="text"
                    value={newFlag.key}
                    onChange={(e) => setNewFlag(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="e.g. new_dashboard_ui"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newFlag.description}
                    onChange={(e) => setNewFlag(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Explain what this flag controls..."
                    rows="3"
                    required
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="newFlagEnabled"
                    checked={newFlag.isEnabled}
                    onChange={(e) => setNewFlag(prev => ({ ...prev, isEnabled: e.target.checked }))}
                    style={{ width: 'auto', accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="newFlagEnabled" style={{ userSelect: 'none', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Enable flag by default</label>
                </div>
              </div>
              <div className="card-footer">
                <button type="submit" className="btn" style={{ width: 'auto', padding: '0.65rem 1.75rem' }}>
                  + Create Flag
                </button>
              </div>
            </form>
          </div>

          {/* Flags List */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header">
              <h3>Manage Feature Flags</h3>
              <button
                className="btn btn-secondary"
                onClick={fetchFlags}
                style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.82rem' }}
              >
                ↻ Refresh
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {loading && flags.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <div className="spinner"></div>
                </div>
              ) : flags.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No feature flags found for this organization.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Description</th>
                        <th className="text-center">Status</th>
                        <th>Created</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flags.map((flag) => (
                        <tr key={flag._id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{flag.key}</td>
                          <td style={{ color: 'var(--text-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {flag.description}
                          </td>
                          <td className="text-center">
                            <button
                              onClick={() => handleToggle(flag._id, flag.isEnabled)}
                              className={`btn ${flag.isEnabled ? 'btn-success' : 'btn-secondary'}`}
                              style={{ width: 'auto', padding: '0.3rem 0.85rem', fontSize: '0.78rem', borderRadius: '20px' }}
                            >
                              {flag.isEnabled ? '● Enabled' : '○ Disabled'}
                            </button>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {new Date(flag.createdAt).toLocaleDateString()}
                          </td>
                          <td className="text-right">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button
                                className="btn btn-secondary"
                                onClick={() => openEditModal(flag)}
                                style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                              >
                                ✎ Edit
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDelete(flag._id, flag.key)}
                                style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && editFlag && (
        <div className="modal-backdrop open">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Feature Flag</h3>
              <button 
                onClick={() => setIsEditOpen(false)} 
                style={{ width: 'auto', border: 'none', fontSize: '1.4rem', padding: '0', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Feature Key</label>
                  <input
                    type="text"
                    value={editFlag.key}
                    onChange={(e) => setEditFlag(prev => ({ ...prev, key: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editFlag.description}
                    onChange={(e) => setEditFlag(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)} style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn" style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
