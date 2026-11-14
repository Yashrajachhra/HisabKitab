import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import type { ExpenseWithCategory } from '../../db/types';
import { formatPkr, toMajorUnits } from '../../utils/money';
import { canExportPdf } from '../../config/featureFlags';

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

export async function shareTextFile(
  filename: string,
  contents: string,
  mimeType: string,
): Promise<void> {
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) throw new Error('No file directory available');
  const uri = `${base}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents, { encoding: FileSystem.EncodingType.UTF8 });

  if (Platform.OS === 'web') {
    // Browser download fallback
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle: filename });
  }
}

export async function exportExpensesCsv(expenses: ExpenseWithCategory[]): Promise<void> {
  const csv = buildExpensesCsv(expenses);
  await shareTextFile(`hisabkitab-expenses-${Date.now()}.csv`, csv, 'text/csv');
}

export async function exportExpensesPdf(expenses: ExpenseWithCategory[]): Promise<void> {
  if (!canExportPdf()) {
    throw new Error('PDF export requires HisabKitab Plus');
  }
  // Lazy import so web/tests without native print still load the module graph.
  const Print = await import('expo-print');
  const html = buildExpensesPdfHtml(expenses, 'HisabKitab Export');
  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'HisabKitab PDF',
    });
  }
}
