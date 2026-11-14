/** Navy + blue palettes taken from the HisabKitab app logo (AppLogo.png). */
export type AppColors = {
  primary: string;
  primaryDark: string;
  primaryMuted: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  danger: string;
  warning: string;
  success: string;
  overlay: string;
};

export type ColorScheme = 'light' | 'dark';

export const lightColors: AppColors = {
  primary: '#001558',
  primaryDark: '#000E3D',
  primaryMuted: '#E3EBFD',
  onPrimary: '#FFFFFF',
  accent: '#5B8DEF',
  accentSoft: '#B8CCF8',
  background: '#F4F7FD',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF2FC',
  text: '#0B1533',
  textSecondary: '#5A6683',
  textInverse: '#FFFFFF',
  border: '#D5DEF0',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
  overlay: 'rgba(0, 21, 88, 0.45)',
};

export const darkColors: AppColors = {
  primary: '#8FB0F5',
  primaryDark: '#5B8DEF',
  primaryMuted: '#1B2B5C',
  onPrimary: '#001558',
  accent: '#5B8DEF',
  accentSoft: '#2A3F7A',
  background: '#060B1F',
  surface: '#0E1633',
  surfaceMuted: '#16214A',
  text: '#EEF2FF',
  textSecondary: '#9AA6C8',
  textInverse: '#001558',
  border: '#25325F',
  danger: '#F87171',
  warning: '#FBBF24',
  success: '#4ADE80',
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
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const typography = {
  brand: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },
} as const;
