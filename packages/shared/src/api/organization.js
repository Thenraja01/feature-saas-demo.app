// api/organization.js
import { apiCall } from './httpClient.js';
import { getSafeMessage } from './config.js';

/**
 * Get public organizations (no auth required)
 */
export async function getPublicOrganizations() {
  try {
    const { res, data } = await apiCall('/api/v1/organizations/public');

    if (res.ok && data?.success) {
      return data.data || [];
    }

    if (res.ok && Array.isArray(data)) {
      return data;
    }

    if (res.ok && data?.data && Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching public organizations:', error);
    return [];
  }
}

/**
 * Get organizations (requires auth)
 */
export async function getOrganizations(params = {}) {
  try {
    const { res, data } = await apiCall('/api/v1/organizations', {
      params: { limit: 100, ...params },
    });

    if (res.ok && data?.success) {
      return data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
}

/**
 * Create organization
 */
export async function createOrganization(name, description) {
  try {
    const { res, data } = await apiCall('/api/v1/organizations', {
      method: 'POST',
      body: { name, description },
    });

    if (res.ok && data?.success) {
      return data.data;
    }
    throw new Error(getSafeMessage(data, 'Failed to create organization'));
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
}

/**
 * Delete organization
 */
export async function deleteOrganization(id) {
  try {
    const { res, data } = await apiCall(`/api/v1/organizations/${id}`, {
      method: 'DELETE',
    });

    return {
      success: res.ok && data?.success,
      message: getSafeMessage(data, 'Failed to delete organization')
    };
  } catch (error) {
    console.error('Error deleting organization:', error);
    throw error;
  }
}

export default {
  getPublicOrganizations,
  getOrganizations,
  createOrganization,
  deleteOrganization,
};
