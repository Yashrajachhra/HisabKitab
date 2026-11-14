import * as ImagePicker from 'expo-image-picker';

import { getSecureItem, setSecureItem } from '../../utils/secureStorage';

const CAMERA_DENIED_KEY = 'hk_camera_permission_denied_v1';

export type MediaPermissionKind = 'camera' | 'gallery';

/**
 * Requests camera/gallery access once. On denial we remember camera denial
 * and never re-prompt; gallery can still be offered as an alternative.
 */
export async function ensureMediaPermission(
  kind: MediaPermissionKind,
): Promise<{ granted: boolean; previouslyDenied: boolean }> {
  if (kind === 'camera') {
    const remembered = await getSecureItem(CAMERA_DENIED_KEY);
    if (remembered === '1') {
      return { granted: false, previouslyDenied: true };
    }

    const current = await ImagePicker.getCameraPermissionsAsync();
    if (current.granted) return { granted: true, previouslyDenied: false };

    if (!current.canAskAgain) {
      await setSecureItem(CAMERA_DENIED_KEY, '1');
      return { granted: false, previouslyDenied: true };
    }

    const asked = await ImagePicker.requestCameraPermissionsAsync();
    if (!asked.granted) {
      await setSecureItem(CAMERA_DENIED_KEY, '1');
      return { granted: false, previouslyDenied: true };
    }
    return { granted: true, previouslyDenied: false };
  }

  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return { granted: true, previouslyDenied: false };
  if (!current.canAskAgain) {
    return { granted: false, previouslyDenied: true };
  }
  const asked = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return { granted: asked.granted, previouslyDenied: !asked.granted };
}
