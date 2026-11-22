import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { radii, shadows, spacing } from '../../config/theme';
import { MAX_CONTENT_WIDTH } from '../../hooks/useResponsive';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { PressableScale } from './PressableScale';

type IconName = ComponentProps<typeof Ionicons>['name'];

type NavItem = {
  key: string;
  path: string;
  labelKey: string;
  fallback: string;
  icon: IconName;
  iconActive: IconName;
};

/** Main screens that show the bar; all routes are the existing Stack routes. */
const TABS: NavItem[] = [
  { key: 'home', path: '/', labelKey: 'nav.home', fallback: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'groups', path: '/groups', labelKey: 'nav.groups', fallback: 'Groups', icon: 'people-outline', iconActive: 'people' },
  { key: 'insights', path: '/dashboard', labelKey: 'nav.insights', fallback: 'Insights', icon: 'trending-up-outline', iconActive: 'trending-up' },
  { key: 'profile', path: '/settings', labelKey: 'nav.profile', fallback: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

const SCAN_PATH = '/expense/ocr';
const BAR_HEIGHT = 64;
const SCAN_SIZE = 56;

/** Vertical space screens reserve so content isn't hidden behind the docked bar. */
export const BOTTOM_NAV_SPACE = 100;

export function useBottomNavVisible(): boolean {
  const pathname = usePathname();
  return TABS.some((tab) => tab.path === pathname);
}

export function BottomNav() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const visible = useBottomNavVisible();

  if (!visible) return null;

  const go = (path: string) => {
    if (path === pathname) return;
    if (path === '/') {
      router.dismissTo('/');
    } else if (pathname === '/') {
      router.push(path as Href);
    } else {
      router.replace(path as Href);
    }
  };

  const renderTab = (tab: NavItem) => {
    const active = tab.path === pathname;
    const label = t(tab.labelKey, tab.fallback);
    return (
      <PressableScale
        key={tab.key}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
        onPress={() => go(tab.path)}
        hitSlop={6}
        style={styles.tab}
      >
        <Ionicons
          name={active ? tab.iconActive : tab.icon}
          size={22}
          color={active ? colors.primaryDark : colors.textSecondary}
        />
        <Text style={[styles.label, active ? styles.labelActive : null]} numberOfLines={1}>
          {label}
        </Text>
      </PressableScale>
    );
  };

  const scanLabel = t('nav.scan', 'Scan');

  return (
    <View
      style={[styles.dock, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar} accessibilityRole="tablist">
        {renderTab(TABS[0])}
        {renderTab(TABS[1])}
        <View style={styles.scanSlot}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={scanLabel}
            onPress={() => router.push(SCAN_PATH as Href)}
            scaleTo={0.93}
            style={styles.scanBtn}
          >
            <Ionicons name="scan" size={26} color={colors.onPrimary} />
          </PressableScale>
          <Text style={styles.scanLabel} numberOfLines={1}>
            {scanLabel}
          </Text>
        </View>
        {renderTab(TABS[2])}
        {renderTab(TABS[3])}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.nav,
  },
  bar: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  tab: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  scanSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingBottom: 6,
  },
  scanBtn: {
    position: 'absolute',
    top: -22,
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.raised,
  },
  scanLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: colors.textSecondary,
  },
}));
