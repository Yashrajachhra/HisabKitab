import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { radii, spacing } from '../../config/theme';
import { setAppLanguage } from '../../i18n';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';

function SunIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MoonIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
        fill={color}
      />
    </Svg>
  );
}

export function ThemeToggle() {
  const { t } = useTranslation();
  const { scheme, colors, toggleScheme } = useTheme();
  const styles = useStyles();
  const isDark = scheme === 'dark';

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={t(isDark ? 'common.lightMode' : 'common.darkMode')}
      onPress={toggleScheme}
      hitSlop={8}
      style={({ pressed }) => [styles.track, pressed ? styles.pressed : null]}
    >
      <View style={[styles.iconSlot, styles.iconLeft]}>
        <SunIcon color={colors.textSecondary} size={12} />
      </View>
      <View style={[styles.iconSlot, styles.iconRight]}>
        <MoonIcon color={colors.textSecondary} size={12} />
      </View>
      <View
        style={[
          styles.thumb,
          isDark ? styles.thumbDark : styles.thumbLight,
          { backgroundColor: isDark ? colors.primary : colors.surface },
        ]}
      >
        {isDark ? (
          <MoonIcon color={colors.onPrimary} size={14} />
        ) : (
          <SunIcon color={colors.warning} size={14} />
        )}
      </View>
    </Pressable>
  );
}

export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const isUrdu = i18n.language === 'ur';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.switchLanguage')}
      onPress={() => void setAppLanguage(isUrdu ? 'en' : 'ur')}
      hitSlop={6}
      style={({ pressed }) => [styles.langPill, pressed ? styles.pressed : null]}
    >
      <Text style={styles.langLabel}>{isUrdu ? 'EN' : 'اردو'}</Text>
    </Pressable>
  );
}

const TRACK_W = 56;
const TRACK_H = 30;
const THUMB = 24;

const useStyles = makeStyles((colors) => ({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  iconSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: TRACK_W / 2,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  iconLeft: {
    left: 0,
  },
  iconRight: {
    right: 0,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    top: (TRACK_H - THUMB) / 2 - 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  thumbLight: {
    left: 2,
  },
  thumbDark: {
    left: TRACK_W - THUMB - 2,
  },
  langPill: {
    minWidth: 40,
    height: TRACK_H,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
}));
