import { deleteAsync } from 'expo-file-system/legacy';

/**
 * Deletes a local receipt image. Never uploads. Failures are swallowed —
 * leftover cache is preferable to crashing after a successful parse.
 */
export async function deleteLocalImage(uri: string | null | undefined): Promise<void> {
  if (!uri) return;
  if (!(uri.startsWith('file://') || uri.startsWith('/'))) {
    // content:// or remote URIs are not deleted here.
    return;
  }
  try {
    await deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}
