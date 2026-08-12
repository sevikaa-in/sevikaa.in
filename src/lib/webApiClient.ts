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
  return inMemoryAccessToken;
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

    if (inMemoryAccessToken) {
      headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
    }

    let res = await fetch(endpoint, { ...options, headers });

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

  async get(endpoint: string, headers: Record<string, string> = {}): Promise<any> {
    const res = await this.request(endpoint, { method: 'GET', headers });
    return res.json();
  },

  async post(endpoint: string, body?: any, headers: Record<string, string> = {}): Promise<any> {
    const res = await this.request(endpoint, {
      method: 'POST',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body || {})
    });
    return res.json();
  },

  async put(endpoint: string, body?: any, headers: Record<string, string> = {}): Promise<any> {
    const res = await this.request(endpoint, {
      method: 'PUT',
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body || {})
    });
    return res.json();
  },

  async delete(endpoint: string, headers: Record<string, string> = {}): Promise<any> {
    const res = await this.request(endpoint, { method: 'DELETE', headers });
    return res.json();
  }
};
