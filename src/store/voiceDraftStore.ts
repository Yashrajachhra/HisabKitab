import { create } from 'zustand';

import type { VoiceParseResult } from '../features/voice/parseVoiceExpense';

type VoiceDraftState = {
  draft: VoiceParseResult | null;
  setFromParse: (result: VoiceParseResult) => void;
  clear: () => void;
};

export const useVoiceDraftStore = create<VoiceDraftState>((set) => ({
  draft: null,
  setFromParse: (result) => set({ draft: result }),
  clear: () => set({ draft: null }),
}));
