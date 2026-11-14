import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { getSecureItem, setSecureItem, deleteSecureItem } from '../../utils/secureStorage';

const PIN_KEY = 'hk_app_lock_pin';
const ENABLED_KEY = 'hk_app_lock_enabled';

export async function isAppLockEnabled(): Promise<boolean> {
  return (await getSecureItem(ENABLED_KEY)) === '1';
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  if (!enabled) {
    await deleteSecureItem(ENABLED_KEY);
    await deleteSecureItem(PIN_KEY);
    return;
  }
  await setSecureItem(ENABLED_KEY, '1');
}

export async function setAppPin(pin: string): Promise<void> {
  if (!/^\d{4,8}$/.test(pin)) {
    throw new Error('PIN must be 4–8 digits');
  }
  await setSecureItem(PIN_KEY, pin);
  await setSecureItem(ENABLED_KEY, '1');
}

export async function verifyAppPin(pin: string): Promise<boolean> {
  const stored = await getSecureItem(PIN_KEY);
  return stored !== null && stored === pin;
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!hasHardware || !enrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock HisabKitab',
    cancelLabel: 'Use PIN',
    disableDeviceFallback: false,
  });
  return result.success;
}
