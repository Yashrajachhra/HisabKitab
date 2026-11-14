import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { DB_ENCRYPTION_KEY_ALIAS } from '../config/constants';
import { getSecureItem, setSecureItem } from '../utils/secureStorage';

/**
 * Returns the AES-256 database key, generating and persisting it on first launch.
 * The key is stored only in the platform secure enclave via expo-secure-store.
 * Never log this value.
 */
export async function getOrCreateDbEncryptionKey(): Promise<string> {
  const existing = await getSecureItem(DB_ENCRYPTION_KEY_ALIAS);
  if (existing) {
    return existing;
  }

  const bytes = await Crypto.getRandomBytesAsync(32);
  const key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await setSecureItem(
    DB_ENCRYPTION_KEY_ALIAS,
    key,
    Platform.OS === 'web'
      ? undefined
      : { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
  );
  return key;
}

/**
 * Formats the key for SQLCipher's `PRAGMA key = "x'...'"`.
 */
export function toSqlCipherHexLiteral(hexKey: string): string {
  return `x'${hexKey}'`;
}
