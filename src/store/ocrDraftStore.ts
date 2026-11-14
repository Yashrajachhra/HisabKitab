import { create } from 'zustand';

import type { PaymentMethod } from '../config/constants';
import type { ParsedReceipt } from '../features/ocr/parseReceipt';
import { discardReceiptImage } from '../services/ocr';

export type OcrDraft = ParsedReceipt & {
  imageUri: string;
  keepImage: boolean;
};

type OcrDraftState = {
  draft: OcrDraft | null;
  setFromScan: (scan: ParsedReceipt & { imageUri: string }) => void;
  setKeepImage: (keep: boolean) => void;
  clear: (options?: { deleteImage?: boolean }) => Promise<void>;
};

export const useOcrDraftStore = create<OcrDraftState>((set, get) => ({
  draft: null,

  setFromScan: (scan) => {
    set({
      draft: {
        ...scan,
        keepImage: false,
        paymentMethodHint: scan.paymentMethodHint,
      },
    });
  },

  setKeepImage: (keep) => {
    const draft = get().draft;
    if (!draft) return;
    set({ draft: { ...draft, keepImage: keep } });
  },

  clear: async (options) => {
    const draft = get().draft;
    const shouldDelete = options?.deleteImage !== false && draft && !draft.keepImage;
    if (shouldDelete) {
      await discardReceiptImage(draft.imageUri);
    }
    set({ draft: null });
  },
}));

export function defaultPaymentMethod(hint: PaymentMethod | null): PaymentMethod {
  return hint ?? 'cash';
}
