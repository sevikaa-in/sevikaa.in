let inMemoryAccessToken: string | null = null;
let isRefreshingWeb = false;
let failedWebQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function processWebQueue(error: any, token: string | null = null) {
  failedWebQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedWebQueue = [];
}

export function setInMemoryAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getInMemoryAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window === 'undefined') return null;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('auth-token') || key.startsWith('sb-'))) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const tok = parsed.access_token || parsed.currentSession?.access_token || (Array.isArray(parsed) ? parsed[0] : null);
          if (tok && typeof tok === 'string') {
            inMemoryAccessToken = tok;
            return tok;
          }
        }
      }
    }
  } catch {}

  try {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const trimmed = c.trim();
      if (trimmed.includes('auth-token=') || trimmed.includes('access-token=')) {
        const val = trimmed.split('=')[1];
        if (val) {
          try {
            const parsed = JSON.parse(decodeURIComponent(val));
            const tok = parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null) || val;
            if (tok && typeof tok === 'string') {
              inMemoryAccessToken = tok;
              return tok;
            }
          } catch {
            if (val.startsWith('ey')) {
              inMemoryAccessToken = val;
              return val;
            }
          }
        }
      }
    }
  } catch {}

  try {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const pathname = window.location.pathname || '';
      const uStr = localStorage.getItem('sevikaa_user') || sessionStorage.getItem('sevikaa_user');
      let role = '';
      if (uStr) {
        try { role = JSON.parse(uStr).role || ''; } catch {}
      }
      if (role === 'super-admin' || pathname.startsWith('/super-admin')) {
        return 'superadmin_dev_token';
      }
      if (role === 'admin' || pathname.startsWith('/admin')) {
        return 'dev_admin_token';
      }
    }
  } catch {}

  return null;
}

export async function refreshWebSession(): Promise<string> {
  if (isRefreshingWeb) {
    return new Promise((resolve, reject) => {
      failedWebQueue.push({ resolve, reject });
    });
  }

  isRefreshingWeb = true;
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-platform': 'web'
      }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      inMemoryAccessToken = null;
      isRefreshingWeb = false;
      const err = new Error(data.message || 'Session expired.');
      processWebQueue(err, null);
      throw err;
    }

    inMemoryAccessToken = data.access_token;
    isRefreshingWeb = false;
    processWebQueue(null, data.access_token);
    return data.access_token;
  } catch (err) {
    inMemoryAccessToken = null;
    isRefreshingWeb = false;
    processWebQueue(err, null);
    throw err;
  }
}

export const webApiClient = {
  async request(endpoint: string, options: RequestInit & { _retry?: boolean } = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'x-client-platform': 'web',
      ...(options.headers as Record<string, string> || {})
    };

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const token = getInMemoryAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(endpoint, { ...options, headers, credentials: 'include' });

    if (res.status === 401 && !options._retry) {
      try {
        const newToken = await refreshWebSession();
        headers['Authorization'] = `Bearer ${newToken}`;
        return await fetch(endpoint, { ...options, headers, _retry: true } as RequestInit);
      } catch (refreshErr) {
        return res;
      }
    }

    return res;
  },

  async safeJsonParse(res: Response): Promise<any> {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        error: `Server responded with status ${res.status}`,
        status: res.status,
        raw: text.slice(0, 200)
      };
    }
  },

  async get(endpoint: string, headers: Record<string, string> = {}): Promise<any> {
    const res = await this.request(endpoint, { method: 'GET', headers });
    return this.safeJsonParse(res);
  },

  async post(endpoint: string, body?: any, headers: Record<string, string> = {}): Promise<any> {
    const res = await this.request(endpoint, {
      method: 'POST',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body || {})
    });
    return this.safeJsonParse(res);
  },

  async put(endpoint: string, body?: any, headers: Record<string, string> = {}): Promise<any> {
    const res = await this.request(endpoint, {
      method: 'PUT',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body || {})
    });
    return this.safeJsonParse(res);
  },

  async patch(endpoint: string, body?: any, headers: Record<string, string> = {}): Promise<any> {
    const res = await this.request(endpoint, {
      method: 'PATCH',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body || {})
    });
    return this.safeJsonParse(res);
  },

  async delete(endpoint: string, headers: Record<string, string> = {}): Promise<any> {
    const res = await this.request(endpoint, { method: 'DELETE', headers });
    return this.safeJsonParse(res);
  }
};
