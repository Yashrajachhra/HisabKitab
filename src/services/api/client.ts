import { getSecureItem, setSecureItem, deleteSecureItem } from '../../utils/secureStorage';

const ACCESS_KEY = 'hk_access_token';
const REFRESH_KEY = 'hk_refresh_token';

export function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
}

export async function getAccessToken(): Promise<string | null> {
  return getSecureItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getSecureItem(REFRESH_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await setSecureItem(ACCESS_KEY, accessToken);
  await setSecureItem(REFRESH_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
  await deleteSecureItem(ACCESS_KEY);
  await deleteSecureItem(REFRESH_KEY);
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    await clearTokens();
    return null;
  }
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  await saveTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.auth !== false) {
    let token = await getAccessToken();
    if (!token) {
      token = await refreshAccessToken();
    }
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (res.status === 401 && options.auth !== false) {
    const next = await refreshAccessToken();
    if (next) {
      headers.Authorization = `Bearer ${next}`;
      res = await fetch(`${getApiBaseUrl()}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    }
  }

  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}
