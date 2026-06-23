// api/featureFlag.js
import { apiCall } from './httpClient.js';
import { getSafeMessage } from './config.js';

/**
 * Check feature flag status (public endpoint)
 */
export async function checkFeatureFlag(orgId, key) {
  try {
    const { res, data } = await apiCall('/api/v1/feature-flags/public/check', {
      params: { orgId, key },
    });

    return {
      ok: res.ok && data?.success,
      isEnabled: Boolean(data?.isEnabled),
      data: data?.data ?? null,
      message: data?.message || (res.ok ? 'Success' : 'Failed to check feature flag'),
    };
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return {
      ok: false,
      isEnabled: false,
      data: null,
      message: error.message || 'Failed to check feature flag',
    };
  }
}

/**
 * Get feature flags (requires auth)
 */
export async function getFeatureFlags(orgId = null, params = {}) {
  try {
    const url = orgId ? `/api/v1/feature-flags?orgId=${orgId}` : '/api/v1/feature-flags';
    const { res, data } = await apiCall(url, {
      params: { limit: 100, ...params },
    });

    if (res.ok && data?.success) {
      return data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    throw error;
  }
}

/**
 * Create feature flag
 */
export async function createFeatureFlag(orgId, flagData) {
  try {
    const { res, data } = await apiCall('/api/v1/feature-flags', {
      method: 'POST',
      body: { ...flagData, organization: orgId },
    });

    if (res.ok && data?.success) {
      return data.data;
    }
    throw new Error(getSafeMessage(data, 'Failed to create feature flag'));
  } catch (error) {
    console.error('Error creating feature flag:', error);
    throw error;
  }
}

/**
 * Update feature flag
 */
export async function updateFeatureFlag(id, flagData) {
  try {
    const { res, data } = await apiCall(`/api/v1/feature-flags/${id}`, {
      method: 'PUT',
      body: flagData,
    });

    if (res.ok && data?.success) {
      return data.data;
    }
    throw new Error(getSafeMessage(data, 'Failed to update feature flag'));
  } catch (error) {
    console.error('Error updating feature flag:', error);
    throw error;
  }
}

/**
 * Toggle feature flag
 */
export async function toggleFeatureFlag(id, isEnabled) {
  try {
    const { res, data } = await apiCall(`/api/v1/feature-flags/${id}/toggle`, {
      method: 'PATCH',
      body: { isEnabled },
    });

    return {
      success: res.ok && data?.success,
      data: data?.data,
      message: getSafeMessage(data, 'Failed to toggle feature flag')
    };
  } catch (error) {
    console.error('Error toggling feature flag:', error);
    throw error;
  }
}

/**
 * Delete feature flag
 */
export async function deleteFeatureFlag(id) {
  try {
    const { res, data } = await apiCall(`/api/v1/feature-flags/${id}`, {
      method: 'DELETE',
    });

    return {
      success: res.ok && data?.success,
      message: getSafeMessage(data, 'Failed to delete feature flag')
    };
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    throw error;
  }
}

export default {
  checkFeatureFlag,
  getFeatureFlags,
  createFeatureFlag,
  updateFeatureFlag,
  toggleFeatureFlag,
  deleteFeatureFlag,
};
