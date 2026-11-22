/**
 * HisabKitab — Student Expense Tracker theme.
 * Single source of truth for colors, typography, spacing, radius, shadows and
 * category visuals. Friendly + youthful: navy, teal and amber on a soft canvas.
 */
export type AppColors = {
  primary: string;
  primaryDark: string;
  primaryMuted: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  navy: string;
  navySoft: string;
  onNavy: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  successSoft: string;
  overlay: string;
};

export type ColorScheme = 'light' | 'dark';

/** Raw brand palette. Prefer `colors.*` from `useTheme()` in components. */
export const brand = {
  navy: '#12204A',
  teal: '#14B8A6',
  amber: '#F59E0B',
  canvas: '#F7F8FC',
  white: '#FFFFFF',
} as const;

export const lightColors: AppColors = {
  primary: brand.teal,
  primaryDark: '#0D9488',
  primaryMuted: '#DDF7F3',
  onPrimary: '#FFFFFF',
  accent: brand.amber,
  accentSoft: '#FEF3C7',
  navy: brand.navy,
  navySoft: '#1E3170',
  onNavy: '#FFFFFF',
  background: brand.canvas,
  surface: brand.white,
  surfaceMuted: '#EFF2F8',
  text: brand.navy,
  textSecondary: '#6B7493',
  textInverse: '#FFFFFF',
  border: '#E6E9F2',
  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  success: '#10B981',
  successSoft: '#D1FAE5',
  overlay: 'rgba(18, 32, 74, 0.45)',
};

export const darkColors: AppColors = {
  primary: '#2DD4BF',
  primaryDark: '#14B8A6',
  primaryMuted: '#123F44',
  onPrimary: '#04201D',
  accent: '#FBBF24',
  accentSoft: '#3D2E0A',
  navy: '#1B2A5E',
  navySoft: '#24377A',
  onNavy: '#FFFFFF',
  background: '#0B1330',
  surface: '#141E42',
  surfaceMuted: '#1C2752',
  text: '#F1F4FF',
  textSecondary: '#A3ACCB',
  textInverse: '#0B1330',
  border: '#26325E',
  danger: '#F87171',
  dangerSoft: '#3B1720',
  warning: '#FBBF24',
  warningSoft: '#3D2E0A',
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
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  /** Default card radius. */
  card: 20,
  pill: 999,
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
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  amount: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  amountXL: {
    fontSize: 40,
    fontWeight: '800' as const,
    letterSpacing: -1.4,
  },
} as const;

/** Cross-platform soft shadows (RN `boxShadow`, New Architecture). */
export const shadows = {
  none: {},
  soft: { boxShadow: '0px 2px 10px rgba(18, 32, 74, 0.06)' },
  card: { boxShadow: '0px 8px 24px rgba(18, 32, 74, 0.08)' },
  raised: { boxShadow: '0px 10px 24px rgba(20, 184, 166, 0.40)' },
  nav: { boxShadow: '0px -2px 24px rgba(18, 32, 74, 0.10)' },
} as const;

export const motion = {
  pressScale: 0.96,
  spring: { damping: 15, stiffness: 260, mass: 0.6 },
  ringDuration: 900,
} as const;

/* ------------------------------------------------------------------ */
/* Category visuals — picked by name at render time (DB is untouched). */
/* ------------------------------------------------------------------ */

export const categoryColors = {
  food: '#F97316',
  transport: '#3B82F6',
  printing: '#8B5CF6',
  utilities: '#EAB308',
  groceries: '#22C55E',
  chai: '#A16207',
} as const;

/** Ionicons glyph names (rounded style). */
const ICON_BY_NAME: Record<string, string> = {
  chai: 'cafe',
  tea: 'cafe',
  food: 'fast-food',
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
  food: 'fast-food',
  bus: 'bus',
  print: 'print',
  home: 'home',
  phone: 'phone-portrait',
  pen: 'pencil',
  dots: 'ellipsis-horizontal',
};

export type CategoryVisual = { color: string; icon: string };

/** Theme color + rounded icon for a category, falling back to its stored values. */
export function categoryVisual(category: {
  name: string;
  icon?: string | null;
  color?: string | null;
}): CategoryVisual {
  const key = category.name.trim().toLowerCase();
  const themed = (categoryColors as Record<string, string>)[key];
  return {
    color: themed ?? category.color ?? '#64748B',
    icon: ICON_BY_NAME[key] ?? ICON_BY_KEY[category.icon ?? ''] ?? 'pricetag',
  };
}

/** Appends a 2-digit alpha to a #RRGGBB color. */
export function withAlpha(hex: string, alpha: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
