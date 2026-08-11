import { getApiUrl } from '../config/api';
import { secureTokenStorage } from './secureTokenStorage';

interface RequestOptions extends RequestInit {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function executeRefresh(): Promise<string> {
  const refreshToken = await secureTokenStorage.getRefreshToken();
  if (!refreshToken) {
    await secureTokenStorage.clearTokens();
    throw new Error('No refresh token available.');
  }

  const res = await fetch(getApiUrl('api/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    await secureTokenStorage.clearTokens();
    throw new Error(data.message || 'Session expired.');
  }

  await secureTokenStorage.saveTokens(data.access_token, data.refresh_token || refreshToken);
  return data.access_token;
}

export const apiClient = {
  async request(endpoint: string, options: RequestOptions = {}): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : getApiUrl(endpoint);
    let token = await secureTokenStorage.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized with Single-Flight Refresh & Max 1 Retry
    if (response.status === 401 && !options._retry) {
      if (isRefreshing) {
        try {
          const newToken = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          headers['Authorization'] = `Bearer ${newToken}`;
          return await fetch(url, { ...options, headers, _retry: true } as RequestOptions);
        } catch (queueErr) {
          return response;
        }
      }

      options._retry = true;
      isRefreshing = true;

      try {
        const newToken = await executeRefresh();
        isRefreshing = false;
        processQueue(null, newToken);

        headers['Authorization'] = `Bearer ${newToken}`;
        return await fetch(url, { ...options, headers, _retry: true } as RequestOptions);
      } catch (refreshErr) {
        isRefreshing = false;
        processQueue(refreshErr, null);
        await secureTokenStorage.clearTokens();
        return response;
      }
    }

    return response;
  },

  async get<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const res = await this.request(endpoint, { ...options, method: 'GET' });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `HTTP ${res.status} error`);
    }
    return await res.json();
  },

  async post<T = any>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const res = await this.request(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `HTTP ${res.status} error`);
    }
    return await res.json();
  },

  async put<T = any>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const res = await this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `HTTP ${res.status} error`);
    }
    return await res.json();
  },

  async delete<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const res = await this.request(endpoint, { ...options, method: 'DELETE' });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `HTTP ${res.status} error`);
    }
    return await res.json();
  }
};
