export const NETWORK_ERROR_MSG =
  'Cannot reach the server. Start MongoDB, then run `npm run dev` in the server folder (port 5000).';

export async function apiFetch(path, options = {}) {
  const { token, body, headers: customHeaders, ...rest } = options;

  const headers = { ...customHeaders };
  if (body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(path, {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(NETWORK_ERROR_MSG);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) {
      throw new Error(NETWORK_ERROR_MSG);
    }
  }

  return { res, data };
}

export async function getPublicOrganizations() {
  const { res, data } = await apiFetch('/api/v1/organizations/public');
  if (res.ok && data?.success) return data.data;
  return [];
}

export async function checkFeatureFlag(orgId, key) {
  const params = new URLSearchParams({ orgId, key });
  const { res, data } = await apiFetch(`/api/v1/feature-flags/public/check?${params}`);
  return {
    ok: res.ok && data?.success,
    isEnabled: Boolean(data?.isEnabled),
    data: data?.data ?? null,
    message: data?.message ?? '',
  };
}
