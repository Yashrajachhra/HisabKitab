export const APP_NAME = 'HisabKitab';
export const DEFAULT_CURRENCY = 'PKR';
export const CURRENCY_MINOR_UNITS = 100;

/** SecureStore key for the local DB encryption passphrase. */
export const DB_ENCRYPTION_KEY_ALIAS = 'hk_db_encryption_key_v1';

export const DATABASE_NAME = 'hisabkitab.db';

/** Launch-phase feature flag defaults (overridden remotely in Phase 6). */
export const DEFAULT_LAUNCH_PHASE = 'ALL_FREE' as const;

/** Configurable free-tier monthly OCR scan limit. */
export const DEFAULT_OCR_FREE_MONTHLY_LIMIT = 20;

/** Free plan active group ledger cap. */
export const FREE_ACTIVE_GROUP_LIMIT = 2;

export const AMOUNT_PRESETS_PKR = [50, 100, 200, 500, 1000] as const;

export const PAYMENT_METHODS = ['cash', 'jazzcash', 'easypaisa', 'bank', 'card', 'other'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type ExpenseSource = 'manual' | 'ocr' | 'voice' | 'quick_tap';
