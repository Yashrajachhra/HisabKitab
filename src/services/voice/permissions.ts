import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

import { getSecureItem, setSecureItem } from '../../utils/secureStorage';

const MIC_DENIED_KEY = 'hk_mic_permission_denied_v1';

/**
 * Requests microphone + speech recognition once. Remembers denial and never re-prompts.
 */
export async function ensureSpeechPermission(): Promise<{
  granted: boolean;
  previouslyDenied: boolean;
}> {
  const remembered = await getSecureItem(MIC_DENIED_KEY);
  if (remembered === '1') {
    return { granted: false, previouslyDenied: true };
  }

  const current = await ExpoSpeechRecognitionModule.getPermissionsAsync();
  if (current.granted) {
    return { granted: true, previouslyDenied: false };
  }

  if (!current.canAskAgain) {
    await setSecureItem(MIC_DENIED_KEY, '1');
    return { granted: false, previouslyDenied: true };
  }

  const asked = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!asked.granted) {
    await setSecureItem(MIC_DENIED_KEY, '1');
    return { granted: false, previouslyDenied: true };
  }

  return { granted: true, previouslyDenied: false };
}
