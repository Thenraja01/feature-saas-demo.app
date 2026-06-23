import { useState, useCallback } from 'react';
import { 
  getOrganizations, 
  createOrganization, 
  deleteOrganization 
} from '../api/organization.js';

export default function useOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrganizations();
      setOrganizations(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  const addOrg = useCallback(async (name, description) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createOrganization(name, description);
      setOrganizations(prev => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.message || 'Failed to create organization');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeOrg = useCallback(async (id) => {
    setError(null);
    try {
      const res = await deleteOrganization(id);
      if (res.success) {
        setOrganizations(prev => prev.filter(org => org._id !== id));
        return true;
      } else {
        setError(res.message || 'Failed to delete organization');
        return false;
      }
    } catch (err) {
      setError(err.message || 'Failed to delete organization');
      throw err;
    }
  }, []);

  return {
    organizations,
    loading,
    error,
    fetchOrgs,
    addOrg,
    removeOrg
  };
}
