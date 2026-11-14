import { parseReceiptText, type ParsedReceipt } from '../../features/ocr/parseReceipt';
import { deleteLocalImage } from './imageCleanup';
import { recognizeTextFromImage } from './recognize';
import { getOcrUsageStatus, incrementOcrUsage, type OcrUsageStatus } from './usage';

export type { ParsedReceipt, OcrUsageStatus };

export type OcrScanResult = ParsedReceipt & {
  rawTextLength: number;
  imageUri: string;
};

export class OcrLimitError extends Error {
  readonly status: OcrUsageStatus;

  constructor(status: OcrUsageStatus) {
    super('OCR monthly limit reached');
    this.name = 'OcrLimitError';
    this.status = status;
  }
}

export class OcrPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OcrPermissionError';
  }
}

export class OcrNativeUnavailableError extends Error {
  constructor() {
    super(
      'On-device OCR needs a development build (npx expo prebuild). Expo Go cannot run ML Kit.',
    );
    this.name = 'OcrNativeUnavailableError';
  }
}

/**
 * Runs on-device OCR + parsing. Does not delete the image yet —
 * confirmation UI decides whether to keep it.
 */
export async function scanReceiptImage(imageUri: string): Promise<OcrScanResult> {
  const usage = await getOcrUsageStatus();
  if (!usage.allowed) {
    throw new OcrLimitError(usage);
  }

  let rawText: string;
  try {
    rawText = await recognizeTextFromImage(imageUri);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes("doesn't seem to be linked") || message.includes('Expo managed')) {
      throw new OcrNativeUnavailableError();
    }
    throw err;
  }

  const parsed = parseReceiptText(rawText);
  await incrementOcrUsage();

  return {
    ...parsed,
    rawTextLength: rawText.length,
    imageUri,
  };
}

export async function discardReceiptImage(imageUri: string | null | undefined): Promise<void> {
  await deleteLocalImage(imageUri);
}

export { getOcrUsageStatus, parseReceiptText };
