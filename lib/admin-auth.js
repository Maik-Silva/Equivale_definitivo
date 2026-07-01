function getAdminToken() {
  if (typeof window === 'undefined') return null;

  try {
    const possibleKeys = ['adminToken', 'token', 'accessToken', 'jwt', 'authToken'];
    for (const key of possibleKeys) {
      const value = window.localStorage.getItem(key);
      if (value) return value;
    }

    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )(?:adminToken|token|accessToken|jwt|authToken)=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
  } catch (error) {
    // ignore unavailable storage or cookie access
  }

  return null;
}

function getAdminApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-e77b.up.railway.app').replace(/\/$/, '');
}

function getAdminHeaders(extra = {}) {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

module.exports = {
  getAdminToken,
  getAdminApiBaseUrl,
  getAdminHeaders,
};
