// api/dashboard.js
import { apiCall } from './httpClient.js';

/**
 * Get dashboard stats based on role
 */
export async function getDashboardStats(role, orgId = null) {
  try {
    let endpoint = '/api/v1/dashboard/stats';

    if (role === 'SUPER_ADMIN') {
      endpoint = '/api/v1/dashboard/super-admin-stats';
    } else if (role === 'ADMIN' && orgId) {
      endpoint = `/api/v1/dashboard/admin-stats?orgId=${orgId}`;
    } else if (role === 'USER' && orgId) {
      endpoint = `/api/v1/dashboard/user-stats?orgId=${orgId}`;
    }

    const { res, data } = await apiCall(endpoint);

    if (res.ok && data?.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

export default { getDashboardStats };
