import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radii, spacing } from '../../config/theme';
import { setAppLanguage } from '../../i18n';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { scheme, toggleScheme } = useTheme();
  const styles = useStyles();
  const isDark = scheme === 'dark';

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={t(isDark ? 'common.lightMode' : 'common.darkMode')}
      onPress={toggleScheme}
      hitSlop={6}
      style={({ pressed }) => [styles.pill, pressed ? styles.pressed : null]}
    >
      <Text style={styles.icon}>{isDark ? '☀' : '☾'}</Text>
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
      style={({ pressed }) => [styles.pill, pressed ? styles.pressed : null]}
    >
      <Text style={styles.label}>{isUrdu ? 'EN' : 'اردو'}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  pill: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 16,
    color: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
}));
