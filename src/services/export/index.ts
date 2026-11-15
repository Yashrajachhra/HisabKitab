import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import type { ExpenseWithCategory } from '../../db/types';
import { formatPkr, toMajorUnits } from '../../utils/money';

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildExpensesCsv(expenses: ExpenseWithCategory[]): string {
  const header = [
    'date',
    'category',
    'amount_pkr',
    'amount_minor',
    'note',
    'source',
    'payment_method',
  ];
  const lines = expenses.map((e) =>
    [
      e.date,
      e.categoryName,
      String(toMajorUnits(e.amountMinor)),
      String(e.amountMinor),
      e.note ?? '',
      e.source,
      e.paymentMethod,
    ]
      .map((v) => csvEscape(v))
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export function buildExpensesPdfHtml(expenses: ExpenseWithCategory[], title: string): string {
  const rows = expenses
    .map(
      (e) =>
        `<tr><td>${e.date}</td><td>${e.categoryName}</td><td>${formatPkr(e.amountMinor)}</td><td>${e.note ?? ''}</td></tr>`,
    )
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
  <style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:8px;text-align:left}</style>
  </head><body><h1>${title}</h1><p>Generated on-device. Personal data was not uploaded.</p>
  <table><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table>
  </body></html>`;
}

function downloadBlobWeb(filename: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function shareNativeFile(uri: string, mimeType: string, dialogTitle: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, { mimeType, dialogTitle });
}

export async function shareTextFile(
  filename: string,
  contents: string,
  mimeType: string,
): Promise<void> {
  // Web has no sandboxed FS directory — download directly.
  if (Platform.OS === 'web') {
    downloadBlobWeb(filename, contents, mimeType);
    return;
  }

  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) throw new Error('No file directory available');
  const uri = `${base}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await shareNativeFile(uri, mimeType, filename);
}

export async function exportExpensesCsv(expenses: ExpenseWithCategory[]): Promise<void> {
  const csv = buildExpensesCsv(expenses);
  await shareTextFile(`hisabkitab-expenses-${Date.now()}.csv`, csv, 'text/csv');
}

export async function exportExpensesPdf(expenses: ExpenseWithCategory[]): Promise<void> {
  // Launch phase keeps exports free (ALL_FREE). No Plus gate.
  const Print = await import('expo-print');
  const html = buildExpensesPdfHtml(expenses, 'HisabKitab Export');

  if (Platform.OS === 'web') {
    // Browser print dialog → user can "Save as PDF".
    await Print.printAsync({ html });
    return;
  }

  const file = await Print.printToFileAsync({ html });
  await shareNativeFile(file.uri, 'application/pdf', 'HisabKitab PDF');
}
