import { getSecureItem, setSecureItem, deleteSecureItem } from '../../utils/secureStorage';
import { getApiBaseUrl, setApiBaseUrlOverride } from './client';

const API_URL_KEY = 'hk_api_base_url';

export async function hydrateApiBaseUrl(): Promise<string> {
  const saved = await getSecureItem(API_URL_KEY);
  setApiBaseUrlOverride(saved);
  return getApiBaseUrl();
}

export async function saveApiBaseUrl(url: string): Promise<string> {
  const trimmed = url.trim().replace(/\/$/, '');
  if (!trimmed) {
    await deleteSecureItem(API_URL_KEY);
    setApiBaseUrlOverride(null);
    return getApiBaseUrl();
  }
  await setSecureItem(API_URL_KEY, trimmed);
  setApiBaseUrlOverride(trimmed);
  return trimmed;
}
