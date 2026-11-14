import { DEFAULT_OCR_FREE_MONTHLY_LIMIT } from './constants';
import { isPlusUnlocked } from './featureFlags';

export function getOcrMonthlyLimit(): number {
  const fromEnv = process.env.EXPO_PUBLIC_OCR_FREE_MONTHLY_LIMIT;
  if (fromEnv) {
    const parsed = Number.parseInt(fromEnv, 10);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return DEFAULT_OCR_FREE_MONTHLY_LIMIT;
}

export function isOcrUnlimited(): boolean {
  return isPlusUnlocked();
}
