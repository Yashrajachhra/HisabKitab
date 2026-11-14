import {
  DEFAULT_LAUNCH_PHASE,
  DEFAULT_OCR_FREE_MONTHLY_LIMIT,
  FREE_ACTIVE_GROUP_LIMIT,
} from './constants';

export type LaunchPhase = 'ALL_FREE' | 'FREEMIUM';

/**
 * Remote-overridable launch phase (flip via EXPO_PUBLIC_LAUNCH_PHASE without a new release).
 */
export function getLaunchPhase(): LaunchPhase {
  const fromEnv = process.env.EXPO_PUBLIC_LAUNCH_PHASE;
  if (fromEnv === 'FREEMIUM' || fromEnv === 'ALL_FREE') {
    return fromEnv;
  }
  return DEFAULT_LAUNCH_PHASE;
}

/**
 * While launch phase is ALL_FREE, every Plus feature is unlocked (no payments).
 * Flip EXPO_PUBLIC_LAUNCH_PHASE=FREEMIUM later to enforce free limits.
 */
export function isPlusUnlocked(): boolean {
  if (getLaunchPhase() === 'ALL_FREE') return true;
  return process.env.EXPO_PUBLIC_FORCE_PLUS === '1';
}

export function getFreeGroupLimit(): number {
  return FREE_ACTIVE_GROUP_LIMIT;
}

export async function canCreateGroup(currentActiveCount: number): Promise<boolean> {
  if (isPlusUnlocked()) return true;
  return currentActiveCount < getFreeGroupLimit();
}

export function canExportPdf(): boolean {
  return isPlusUnlocked();
}

export function canUseCustomTagAnalytics(): boolean {
  return isPlusUnlocked();
}

export function getOcrLimitForSummary(): number {
  const fromEnv = process.env.EXPO_PUBLIC_OCR_FREE_MONTHLY_LIMIT;
  if (fromEnv) {
    const parsed = Number.parseInt(fromEnv, 10);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return DEFAULT_OCR_FREE_MONTHLY_LIMIT;
}

export function getFreemiumSummary(): {
  phase: LaunchPhase;
  plus: boolean;
  allFree: boolean;
  ocrLimit: number | 'unlimited';
  groupLimit: number | 'unlimited';
} {
  const plus = isPlusUnlocked();
  const phase = getLaunchPhase();
  return {
    phase,
    plus,
    allFree: phase === 'ALL_FREE',
    ocrLimit: plus ? 'unlimited' : getOcrLimitForSummary(),
    groupLimit: plus ? 'unlimited' : getFreeGroupLimit(),
  };
}
