import * as Crypto from 'expo-crypto';

/** Generates a UUID v4 for local primary keys. */
export function createId(): string {
  return Crypto.randomUUID();
}
