import { parseVoiceExpense, type VoiceParseResult } from '../../features/voice/parseVoiceExpense';

export type { VoiceParseResult };
export { parseVoiceExpense };

export class VoiceNativeUnavailableError extends Error {
  constructor() {
    super(
      'On-device speech recognition needs a development build (npx expo prebuild). Expo Go may not support it.',
    );
    this.name = 'VoiceNativeUnavailableError';
  }
}

export class VoiceOnDeviceUnavailableError extends Error {
  constructor() {
    super(
      'On-device speech recognition is not available on this device. We will not send audio to the cloud.',
    );
    this.name = 'VoiceOnDeviceUnavailableError';
  }
}
