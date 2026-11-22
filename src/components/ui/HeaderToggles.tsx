import { Pressable, Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { setAppLanguage } from '../../i18n';
import { shadows } from '../../config/theme';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';

const BTN = 36;

function SunIcon({ color, size = 16 }: { color: string; size?: number }) {
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

function MoonIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z" fill={color} />
    </Svg>
  );
}

function GlobeIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9S14.5 18.2 12 21c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SettingsGlyph({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852 1.01 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type SettingsButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
};

export function SettingsButton({ onPress, accessibilityLabel }: SettingsButtonProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.iconBtn, pressed ? styles.pressed : null]}
    >
      <SettingsGlyph color={colors.primary} size={16} />
    </Pressable>
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
      style={({ pressed }) => [styles.iconBtn, pressed ? styles.pressed : null]}
    >
      {isDark ? (
        <MoonIcon color={colors.primary} size={16} />
      ) : (
        <SunIcon color={colors.warning} size={16} />
      )}
    </Pressable>
  );
}

export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles();
  const isUrdu = i18n.language === 'ur';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.switchLanguage')}
      onPress={() => void setAppLanguage(isUrdu ? 'en' : 'ur')}
      hitSlop={8}
      style={({ pressed }) => [styles.langBtn, pressed ? styles.pressed : null]}
    >
      <GlobeIcon color={colors.primary} size={13} />
      <Text style={[styles.langCode, { color: colors.primary }]}>{isUrdu ? 'UR' : 'EN'}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.94 }],
  },
  iconBtn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  langBtn: {
    height: BTN,
    minWidth: BTN,
    paddingHorizontal: 10,
    borderRadius: BTN / 2,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...shadows.soft,
  },
  langCode: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
}));
