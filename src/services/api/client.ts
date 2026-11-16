import { getSecureItem, setSecureItem, deleteSecureItem } from '../../utils/secureStorage';

const ACCESS_KEY = 'hk_access_token';
const REFRESH_KEY = 'hk_refresh_token';

let apiBaseUrlOverride: string | null = null;

/** Optional runtime override (e.g. from Settings) for release builds. */
export function setApiBaseUrlOverride(url: string | null): void {
  const trimmed = url?.trim() ?? '';
  apiBaseUrlOverride = trimmed.length > 0 ? trimmed.replace(/\/$/, '') : null;
}

export function getApiBaseUrl(): string {
  if (apiBaseUrlOverride) return apiBaseUrlOverride;
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return 'http://localhost:4000';
}

export function isLocalApiUrl(url: string = getApiBaseUrl()): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2';
  } catch {
    return /localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(url);
  }
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
    throw new Error(formatApiError(data, res.status));
  }
  return data as T;
}

function formatApiError(data: unknown, status: number): string {
  if (!data || typeof data !== 'object') {
    return `Request failed (${status})`;
  }

  const details = 'details' in data && Array.isArray(data.details) ? data.details : null;
  if (details && details.length > 0) {
    const parts = details
      .map((issue) => {
        if (!issue || typeof issue !== 'object') return null;
        const path =
          'path' in issue && typeof issue.path === 'string' && issue.path.length > 0
            ? issue.path
            : null;
        const message =
          'message' in issue && typeof issue.message === 'string' ? issue.message : null;
        if (!message) return null;
        return path ? `${path}: ${message}` : message;
      })
      .filter((part): part is string => Boolean(part));
    if (parts.length > 0) return parts.join(' · ');
  }

  if ('error' in data && typeof data.error === 'string') {
    return data.error;
  }
  return `Request failed (${status})`;
}
