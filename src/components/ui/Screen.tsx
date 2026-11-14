import type { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, typography } from '../../config/theme';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { MAX_CONTENT_WIDTH, useResponsive } from '../../hooks/useResponsive';
import { LanguageToggle, ThemeToggle } from './HeaderToggles';

type ScreenProps = {
  children?: ReactNode;
  title?: string;
  scroll?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  headerRight?: ReactNode;
  headerLeft?: ReactNode;
  showLanguageToggle?: boolean;
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
}: ScreenProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { gutter, scale } = useResponsive();
  const frame = { paddingHorizontal: gutter };

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
          <View style={[styles.content, styles.frame, frame, style]}>{body}</View>
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.frame, styles.flex, frame, style]}>{body}</View>
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
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
