import TextRecognition from '@react-native-ml-kit/text-recognition';

/**
 * On-device ML Kit text recognition. Image bytes never leave the device.
 * Requires a dev client / prebuild (not available in Expo Go).
 */
export async function recognizeTextFromImage(imageUri: string): Promise<string> {
  const result = await TextRecognition.recognize(imageUri);
  return result.text ?? '';
}
