import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { AlertLevel } from '../../features/budgets/progress';
import { computeBudgetProgress, nextBudgetAlert } from '../../features/budgets/progress';
import { deleteSecureItem, getSecureItem, setSecureItem } from '../../utils/secureStorage';

const PERMISSION_DENIED_KEY = 'hk_notif_permission_denied_v1';
const FIRED_PREFIX = 'hk_budget_alert_fired_';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined';

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  const settings = await Notifications.getPermissionsAsync();
  if (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return 'granted';
  }
  if (settings.canAskAgain === false) {
    return 'denied';
  }
  return settings.status === 'denied' ? 'denied' : 'undetermined';
}

/**
 * Requests notification permission once. If denied, we remember and never nag.
 * Explains purpose via the OS dialog / caller UI copy — not repeated prompts.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const rememberedDenial = await getSecureItem(PERMISSION_DENIED_KEY);
  if (rememberedDenial === '1') {
    return false;
  }

  const current = await getNotificationPermissionState();
  if (current === 'granted') return true;
  if (current === 'denied') {
    await setSecureItem(PERMISSION_DENIED_KEY, '1');
    return false;
  }

  const result = await Notifications.requestPermissionsAsync();
  const granted =
    result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) {
    await setSecureItem(PERMISSION_DENIED_KEY, '1');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('budget-alerts', {
      name: 'Budget alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
      description:
        'Local alerts when you reach 80% or 100% of your monthly budget. No data leaves your device.',
    });
  }

  return true;
}

async function getFiredAlerts(month: string): Promise<Set<AlertLevel>> {
  const raw = await getSecureItem(`${FIRED_PREFIX}${month}`);
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const set = new Set<AlertLevel>();
    for (const item of parsed) {
      if (item === 'warning_80' || item === 'exceeded_100') {
        set.add(item);
      }
    }
    return set;
  } catch {
    return new Set();
  }
}

async function markFired(month: string, level: AlertLevel): Promise<void> {
  const fired = await getFiredAlerts(month);
  fired.add(level);
  // When we hit 100%, also mark 80% so we don't fire both in sequence awkwardly later.
  if (level === 'exceeded_100') {
    fired.add('warning_80');
  }
  await setSecureItem(`${FIRED_PREFIX}${month}`, JSON.stringify([...fired]));
}

function titleFor(level: AlertLevel): string {
  return level === 'exceeded_100' ? 'Budget reached' : 'Budget warning';
}

function bodyFor(level: AlertLevel, percent: number): string {
  if (level === 'exceeded_100') {
    return `You've hit ${percent}% of this month's budget. This alert stays on your phone only.`;
  }
  return `You've used ${percent}% of this month's budget. This alert stays on your phone only.`;
}

/**
 * Evaluates monthly spend vs limit and schedules a local notification if needed.
 * Never includes exact rupee amounts in the notification body (privacy).
 */
export async function evaluateBudgetAlerts(input: {
  month: string;
  spentMinor: number;
  limitMinor: number;
}): Promise<AlertLevel | null> {
  if (input.limitMinor <= 0) return null;

  const progress = computeBudgetProgress(input.spentMinor, input.limitMinor);
  const fired = await getFiredAlerts(input.month);
  const next = nextBudgetAlert(progress, fired);
  if (!next) return null;

  const allowed = await ensureNotificationPermission();
  if (!allowed) {
    // Still mark as fired so in-app banners can show without re-prompting OS.
    await markFired(input.month, next);
    return next;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titleFor(next),
      body: bodyFor(next, progress.percent),
      sound: false,
      ...(Platform.OS === 'android' ? { channelId: 'budget-alerts' } : {}),
    },
    trigger: null,
  });

  await markFired(input.month, next);
  return next;
}

/** Test helper / settings reset — clears denial flag so user can opt in again from Settings later. */
export async function resetNotificationDenialForSettings(): Promise<void> {
  await deleteSecureItem(PERMISSION_DENIED_KEY);
}
