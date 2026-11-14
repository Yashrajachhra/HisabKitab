import { create } from 'zustand';

import { getSecureItem, setSecureItem } from '../utils/secureStorage';

const ONBOARDING_KEY = 'hk_onboarding_complete_v1';

type OnboardingState = {
  ready: boolean;
  complete: boolean;
  load: () => Promise<void>;
  markComplete: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ready: false,
  complete: false,

  load: async () => {
    try {
      const value = await getSecureItem(ONBOARDING_KEY);
      set({ ready: true, complete: value === '1' });
    } catch {
      set({ ready: true, complete: false });
    }
  },

  markComplete: async () => {
    await setSecureItem(ONBOARDING_KEY, '1');
    set({ complete: true });
  },
}));
