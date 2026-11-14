import { create } from 'zustand';

import { apiRequest, clearTokens, saveTokens, getAccessToken } from '../services/api/client';
import { getSecureItem, setSecureItem, deleteSecureItem } from '../utils/secureStorage';

const USER_KEY = 'hk_auth_user';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

type AuthState = {
  user: AuthUser | null;
  ready: boolean;
  hydrate: () => Promise<void>;
  register: (input: { email: string; password: string; displayName: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,

  hydrate: async () => {
    const raw = await getSecureItem(USER_KEY);
    const token = await getAccessToken();
    if (raw && token) {
      try {
        const user = JSON.parse(raw) as AuthUser;
        set({ user, ready: true });
        return;
      } catch {
        // fall through
      }
    }
    set({ user: null, ready: true });
  },

  register: async (input) => {
    const data = await apiRequest<{
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', { method: 'POST', body: input, auth: false });
    await saveTokens(data.accessToken, data.refreshToken);
    await setSecureItem(USER_KEY, JSON.stringify(data.user));
    set({ user: data.user });
  },

  login: async (input) => {
    const data = await apiRequest<{
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', { method: 'POST', body: input, auth: false });
    await saveTokens(data.accessToken, data.refreshToken);
    await setSecureItem(USER_KEY, JSON.stringify(data.user));
    set({ user: data.user });
  },

  logout: async () => {
    await clearTokens();
    await deleteSecureItem(USER_KEY);
    set({ user: null });
  },
}));
