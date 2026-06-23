import { useState, useCallback } from 'react';
import { 
  getFeatureFlags, 
  createFeatureFlag, 
  updateFeatureFlag, 
  toggleFeatureFlag, 
  deleteFeatureFlag 
} from '../api/featureFlag.js';

export default function useFeatureFlags(orgId) {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFlags = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getFeatureFlags(orgId);
      setFlags(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch feature flags');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const addFlag = useCallback(async (flagData) => {
    if (!orgId) return null;
    setLoading(true);
    setError(null);
    try {
      const created = await createFeatureFlag(orgId, flagData);
      setFlags(prev => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.message || 'Failed to create feature flag');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const toggle = useCallback(async (id, currentVal) => {
    setError(null);
    try {
      const newVal = !currentVal;
      const res = await toggleFeatureFlag(id, newVal);
      if (res.success) {
        setFlags(prev => prev.map(f => f._id === id ? { ...f, isEnabled: newVal } : f));
        return true;
      } else {
        setError(res.message || 'Failed to toggle feature flag');
        return false;
      }
    } catch (err) {
      setError(err.message || 'Failed to toggle feature flag');
      throw err;
    }
  }, []);

  const update = useCallback(async (id, flagData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateFeatureFlag(id, flagData);
      setFlags(prev => prev.map(f => f._id === id ? updated : f));
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to update feature flag');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id) => {
    setError(null);
    try {
      const res = await deleteFeatureFlag(id);
      if (res.success) {
        setFlags(prev => prev.filter(f => f._id !== id));
        return true;
      } else {
        setError(res.message || 'Failed to delete feature flag');
        return false;
      }
    } catch (err) {
      setError(err.message || 'Failed to delete feature flag');
      throw err;
    }
  }, []);

  return {
    flags,
    loading,
    error,
    fetchFlags,
    addFlag,
    toggle,
    update,
    remove
  };
}
