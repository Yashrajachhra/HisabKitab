import {
  DEFAULT_LAUNCH_PHASE,
  DEFAULT_OCR_FREE_MONTHLY_LIMIT,
  FREE_ACTIVE_GROUP_LIMIT,
} from './constants';

export type LaunchPhase = 'ALL_FREE' | 'FREEMIUM';

/**
 * Product decision: every previously “Plus” feature is free for everyone.
 * FREEMIUM env is ignored so limits never surprise users during launch.
 */
export function getLaunchPhase(): LaunchPhase {
  void process.env.EXPO_PUBLIC_LAUNCH_PHASE;
  return DEFAULT_LAUNCH_PHASE;
}

/** Always unlocked — PDF, unlimited OCR, unlimited groups, tag analytics. */
export function isPlusUnlocked(): boolean {
  return true;
}

export function getFreeGroupLimit(): number {
  return FREE_ACTIVE_GROUP_LIMIT;
}

export async function canCreateGroup(_currentActiveCount: number): Promise<boolean> {
  return true;
}

export function canExportPdf(): boolean {
  return true;
}

export function canUseCustomTagAnalytics(): boolean {
  return true;
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
  return {
    phase: 'ALL_FREE',
    plus: true,
    allFree: true,
    ocrLimit: 'unlimited',
    groupLimit: 'unlimited',
  };
}
