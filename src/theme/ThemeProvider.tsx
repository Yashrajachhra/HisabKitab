import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { palettes, type AppColors, type ColorScheme } from '../config/theme';
import { getSecureItem, setSecureItem } from '../utils/secureStorage';

const THEME_KEY = 'hk_color_scheme';

type ThemeContextValue = {
  scheme: ColorScheme;
  colors: AppColors;
  setScheme: (scheme: ColorScheme) => void;
  toggleScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [scheme, setSchemeState] = useState<ColorScheme>(system === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    void getSecureItem(THEME_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light') setSchemeState(stored);
    });
  }, []);

  const setScheme = useCallback((next: ColorScheme) => {
    setSchemeState(next);
    void setSecureItem(THEME_KEY, next);
  }, []);

  const toggleScheme = useCallback(() => {
    setScheme(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setScheme]);

  const value = useMemo(
    () => ({ scheme, colors: palettes[scheme], setScheme, toggleScheme }),
    [scheme, setScheme, toggleScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

/** Builds a styles hook that re-creates the stylesheet only when the color scheme changes. */
type StyleDefinitions = Parameters<typeof StyleSheet.create>[0];

export function makeStyles<T extends StyleDefinitions>(
  factory: (colors: AppColors) => T & StyleDefinitions,
): () => Readonly<T> {
  const cache: Partial<Record<ColorScheme, Readonly<T>>> = {};
  return function useStyles() {
    const { scheme, colors } = useTheme();
    let styles = cache[scheme];
    if (!styles) {
      styles = StyleSheet.create(factory(colors));
      cache[scheme] = styles;
    }
    return styles;
  };
}
