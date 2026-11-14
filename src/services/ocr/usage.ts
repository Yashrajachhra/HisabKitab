import { getOcrMonthlyLimit, isOcrUnlimited } from '../../config/ocrLimits';
import { currentMonthKey } from '../../utils/date';
import { getSecureItem, setSecureItem } from '../../utils/secureStorage';

const USAGE_PREFIX = 'hk_ocr_usage_';

export type OcrUsageStatus = {
  month: string;
  used: number;
  limit: number;
  unlimited: boolean;
  remaining: number;
  allowed: boolean;
};

async function readCount(month: string): Promise<number> {
  const raw = await getSecureItem(`${USAGE_PREFIX}${month}`);
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function getOcrUsageStatus(): Promise<OcrUsageStatus> {
  const month = currentMonthKey();
  const unlimited = isOcrUnlimited();
  const used = await readCount(month);
  const limit = getOcrMonthlyLimit();
  const remaining = unlimited ? Number.POSITIVE_INFINITY : Math.max(0, limit - used);
  return {
    month,
    used,
    limit,
    unlimited,
    remaining,
    allowed: unlimited || used < limit,
  };
}

export async function incrementOcrUsage(): Promise<OcrUsageStatus> {
  const month = currentMonthKey();
  const used = (await readCount(month)) + 1;
  await setSecureItem(`${USAGE_PREFIX}${month}`, String(used));
  return getOcrUsageStatus();
}
