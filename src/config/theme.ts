/**
 * HisabKitab — Design System tokens extracted from Stitch Project #2
 * ("Hostel Ledger & Expense System", projects/6650399984473887834).
 * Modern Tactile Minimalist + Neo-App Warmth: Primary Teal (#14B8A6),
 * Secondary Navy (#12204A), Tertiary Amber (#F59E0B), 20px cards, Plus Jakarta Sans.
 */
export type AppColors = {
  primary: string;
  primaryDark: string;
  primaryMuted: string;
  onPrimary: string;
  accent: string;
  accentDark: string;
  accentSoft: string;
  navy: string;
  navySoft: string;
  navyMuted: string;
  onNavy: string;
  onNavyMuted: string;
  tealFixed: string;
  navyTrack: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  warningBorder: string;
  warningText: string;
  success: string;
  successSoft: string;
  overlay: string;
};

export type ColorScheme = 'light' | 'dark';

/** Raw Stitch Project #2 brand palette. Prefer `colors.*` from `useTheme()`. */
export const brand = {
  navy: '#12204A',
  navyHover: '#1E326E',
  teal: '#14B8A6',
  tealDark: '#006B5F',
  tealFixed: '#71F8E4',
  amber: '#F59E0B',
  canvas: '#F7F8FC',
  white: '#FFFFFF',
} as const;

export const lightColors: AppColors = {
  primary: brand.teal,
  primaryDark: brand.tealDark,
  primaryMuted: '#E6F8F5',
  onPrimary: '#FFFFFF',
  accent: brand.amber,
  accentDark: '#855300',
  accentSoft: '#FFDDB8',
  navy: brand.navy,
  navySoft: '#505C8A',
  navyMuted: '#DCE1FF',
  onNavy: '#FFFFFF',
  onNavyMuted: '#BDCAFE',
  tealFixed: brand.tealFixed,
  navyTrack: '#132437',
  background: brand.canvas,
  surface: brand.white,
  surfaceMuted: '#EEF2F6',
  text: brand.navy,
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  danger: '#EF4444',
  dangerSoft: '#FFDAD6',
  warning: brand.amber,
  warningSoft: '#FFDDB8',
  warningBorder: '#FFB95F',
  warningText: '#543300',
  success: '#10B981',
  successSoft: '#E6F4EA',
  overlay: 'rgba(18, 32, 74, 0.45)',
};

export const darkColors: AppColors = {
  primary: '#2DD4BF',
  primaryDark: '#2DD4BF',
  primaryMuted: '#11383A',
  onPrimary: '#04201D',
  accent: '#FBBF24',
  accentDark: '#FBBF24',
  accentSoft: '#3D2E0A',
  navy: '#1B2A5E',
  navySoft: '#93A4D8',
  navyMuted: '#24377A',
  onNavy: '#FFFFFF',
  onNavyMuted: '#BDCAFE',
  tealFixed: brand.tealFixed,
  navyTrack: '#132437',
  background: '#0B1330',
  surface: '#141E42',
  surfaceMuted: '#1E2B58',
  text: '#F1F4FF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B1330',
  border: '#26325E',
  danger: '#F87171',
  dangerSoft: '#3B1720',
  warning: '#FBBF24',
  warningSoft: '#3D2E0A',
  warningBorder: '#78350F',
  warningText: '#FFDDB8',
  success: '#34D399',
  successSoft: '#0E3B30',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const palettes: Record<ColorScheme, AppColors> = {
  light: lightColors,
  dark: darkColors,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 40,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  input: 14,
  lg: 16,
  card: 20,
  xl: 24,
  pill: 9999,
} as const;

/** Plus Jakarta Sans families (loaded in app/_layout.tsx). */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

/** Maps a numeric fontWeight to the matching Plus Jakarta Sans family. */
export function fontForWeight(weight: string | number | undefined): string {
  switch (String(weight ?? '400')) {
    case '100':
    case '200':
    case '300':
    case '400':
    case 'normal':
      return fonts.regular;
    case '500':
      return fonts.medium;
    case '600':
      return fonts.semibold;
    case '700':
    case 'bold':
      return fonts.bold;
    default:
      return fonts.extrabold;
  }
}

export const typography = {
  brand: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  labelLg: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.1,
  },
  labelMd: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  amount: {
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  amountXL: {
    fontSize: 40,
    fontWeight: '800' as const,
    letterSpacing: -1.2,
  },
} as const;

export const tabular = { fontVariant: ['tabular-nums'] as const };

/** Cross-platform ambient shadows matching Stitch Project #2 elevation levels. */
export const shadows = {
  none: {},
  soft: { boxShadow: '0px 4px 20px rgba(18, 32, 74, 0.05)' },
  card: { boxShadow: '0px 10px 25px rgba(18, 32, 74, 0.08)' },
  modal: { boxShadow: '0px -8px 30px rgba(18, 32, 74, 0.12)' },
  raised: { boxShadow: '0px 8px 24px rgba(20, 184, 166, 0.35)' },
  nav: { boxShadow: '0px -4px 20px rgba(18, 32, 74, 0.06)' },
} as const;

export const motion = {
  pressScale: 0.96,
  spring: { damping: 15, stiffness: 260, mass: 0.6 },
  ringDuration: 900,
} as const;

/* ------------------------------------------------------------------ */
/* Stitch Project #2 Category Color Matrix                             */
/* ------------------------------------------------------------------ */

export const categoryColors = {
  chai: '#92400E',
  food: '#F97316',
  transport: '#0284C7',
  printing: '#8B5CF6',
  utilities: '#EAB308',
  groceries: '#10B981',
} as const;

const CATEGORY_BG: Record<string, string> = {
  chai: '#F6EDE4',
  tea: '#F6EDE4',
  food: '#FFE8D6',
  transport: '#DCE1FF',
  printing: '#EDE7F6',
  utilities: '#FEF9C3',
  groceries: '#E6F4EA',
  hostel: '#E6F8F5',
  'mobile load': '#EDE7F6',
  stationery: '#E0F2FE',
  entertainment: '#FFE4E6',
  health: '#E6F4EA',
  laundry: '#E0F2FE',
  books: '#F6EDE4',
  other: '#EEF2F6',
};

const ICON_BY_NAME: Record<string, string> = {
  chai: 'cafe',
  tea: 'cafe',
  food: 'restaurant',
  transport: 'bus',
  printing: 'print',
  utilities: 'flash',
  groceries: 'basket',
  hostel: 'bed',
  'mobile load': 'phone-portrait',
  stationery: 'pencil',
  entertainment: 'game-controller',
  health: 'medkit',
  laundry: 'shirt',
  books: 'book',
  other: 'ellipsis-horizontal',
};

const ICON_BY_KEY: Record<string, string> = {
  cup: 'cafe',
  food: 'restaurant',
  bus: 'bus',
  print: 'print',
  home: 'home',
  phone: 'phone-portrait',
  pen: 'pencil',
  dots: 'ellipsis-horizontal',
};

export type CategoryVisual = { color: string; bgColor: string; icon: string };

/** Appends a 2-digit alpha to a #RRGGBB color. */
export function withAlpha(hex: string, alpha: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

/** Category color, pastel 15% backplate, and icon from Stitch Project #2 matrix. */
export function categoryVisual(category: {
  name: string;
  icon?: string | null;
  color?: string | null;
}): CategoryVisual {
  const key = category.name.trim().toLowerCase();
  const themed = (categoryColors as Record<string, string>)[key];
  const color = themed ?? category.color ?? '#14B8A6';
  const bgColor = CATEGORY_BG[key] ?? withAlpha(color, 0.15);
  return {
    color,
    bgColor,
    icon: ICON_BY_NAME[key] ?? ICON_BY_KEY[category.icon ?? ''] ?? 'pricetag',
  };
}
