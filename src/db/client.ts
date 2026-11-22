import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME } from '../config/constants';

import { getOrCreateDbEncryptionKey, toSqlCipherHexLiteral } from './encryption';
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';
import { seedDefaultCategories } from './seed';
import { canUseNativeWebSqlite, createWebMemoryDb, type WebMemoryDatabase } from './webMemoryDb';

type AppDatabase = SQLite.SQLiteDatabase | WebMemoryDatabase;

let dbPromise: Promise<AppDatabase> | null = null;

async function applyEncryption(db: SQLite.SQLiteDatabase): Promise<void> {
  // SQLCipher is native-only (dev/EAS builds). Skip on web to avoid hangs.
  if (Platform.OS === 'web') return;

  const key = await getOrCreateDbEncryptionKey();
  const hexLiteral = toSqlCipherHexLiteral(key);

  await db.execAsync(`PRAGMA key = "${hexLiteral}";`);
  await db.execAsync('PRAGMA cipher_memory_security = ON;');
}

async function migrate(db: AppDatabase): Promise<void> {
  await db.execAsync(CREATE_TABLES_SQL);

  const versionRow = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'schema_version'`,
  );
  const current = versionRow ? Number.parseInt(versionRow.value, 10) : 0;

  if (current < SCHEMA_VERSION) {
    await db.runAsync(
      `INSERT INTO meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      'schema_version',
      String(SCHEMA_VERSION),
    );
  }

  await seedDefaultCategories(db);
}

async function openDatabase(): Promise<AppDatabase> {
  // LAN IP previews (http://192.168.x.x) are not secure contexts, so
  // SharedArrayBuffer / expo-sqlite WASM cannot run. Fall back to localStorage.
  if (Platform.OS === 'web' && !canUseNativeWebSqlite()) {
    if (__DEV__) {
      console.info(
        '[HisabKitab] Using localStorage DB (SharedArrayBuffer unavailable on this origin).',
      );
    }
    const memoryDb = createWebMemoryDb();
    await migrate(memoryDb);
    return memoryDb;
  }

  let db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  try {
    await applyEncryption(db);
  } catch {
    if (__DEV__) {
      console.warn(
        '[HisabKitab] SQLCipher pragma unavailable; using local SQLite without native cipher.',
      );
    }
  }

  try {
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await migrate(db);
    return db;
  } catch {
    // On Samsung / Android Auto-Backup, a restored DB file can mismatch a newly
    // generated Keystore key (SQLITE_NOTADB). Reset and re-initialize cleanly.
    try {
      await db.closeAsync();
    } catch {
      // ignore close errors
    }
    try {
      await SQLite.deleteDatabaseAsync(DATABASE_NAME);
    } catch {
      // ignore delete errors
    }
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    try {
      await applyEncryption(db);
    } catch {
      // continue unencrypted if cipher pragma fails
    }
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await migrate(db);
    return db;
  }
}

export function getDatabase(): Promise<AppDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabase().catch((err: unknown) => {
      // Allow a later retry instead of permanently sticking on a rejected promise.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function closeDatabase(): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.closeAsync();
  dbPromise = null;
}
