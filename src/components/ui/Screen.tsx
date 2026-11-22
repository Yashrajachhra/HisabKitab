import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radii, shadows, spacing, typography } from '../../config/theme';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { MAX_CONTENT_WIDTH, useResponsive } from '../../hooks/useResponsive';
import { LanguageToggle, ThemeToggle } from './HeaderToggles';
import { BOTTOM_NAV_SPACE, useBottomNavVisible } from './BottomNav';

type ScreenProps = {
  children?: ReactNode;
  title?: string;
  scroll?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  headerRight?: ReactNode;
  headerLeft?: ReactNode;
  showLanguageToggle?: boolean;
  onBack?: () => void;
};

export function Screen({
  children,
  title,
  scroll = true,
  loading = false,
  style,
  headerRight,
  headerLeft,
  showLanguageToggle = false,
  onBack,
}: ScreenProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { gutter, scale } = useResponsive();
  const navVisible = useBottomNavVisible();
  const frame = { paddingHorizontal: gutter };
  const navSpace = navVisible ? { paddingBottom: BOTTOM_NAV_SPACE } : null;

  const showBack = Boolean(onBack) || (pathname !== '/' && pathname !== '/onboarding');

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const body = loading ? (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  ) : (
    children
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.header, styles.frame, frame]}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={handleBack}
            hitSlop={8}
            style={({ pressed }) => [styles.backBtn, pressed ? styles.pressed : null]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        ) : null}
        {headerLeft}
        <Text
          style={[styles.title, { fontSize: scale(typography.title.fontSize) }]}
          accessibilityRole="header"
          numberOfLines={1}
        >
          {title}
        </Text>
        {headerRight}
        {showLanguageToggle ? <LanguageToggle /> : null}
        <ThemeToggle />
      </View>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.content, styles.frame, frame, navSpace, style]}>{body}</View>
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.frame, styles.flex, frame, navSpace, style]}>
          {body}
        </View>
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  frame: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  title: {
    ...typography.title,
    color: colors.text,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  flex: {
    flex: 1,
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
}));
