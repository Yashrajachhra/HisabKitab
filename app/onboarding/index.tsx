import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { HkLogo } from '../../src/components/HkLogo';
import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { spacing, typography } from '../../src/config/theme';
import { makeStyles } from '../../src/theme/ThemeProvider';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useOnboardingStore } from '../../src/store/onboardingStore';

const SLIDES = [
  { titleKey: 'onboarding.screen1Title', bodyKey: 'onboarding.screen1Body' },
  { titleKey: 'onboarding.screen2Title', bodyKey: 'onboarding.screen2Body' },
  { titleKey: 'onboarding.screen3Title', bodyKey: 'onboarding.screen3Body' },
] as const;

export default function OnboardingScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const markComplete = useOnboardingStore((s) => s.markComplete);
  const { isShort, scale } = useResponsive();
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await markComplete();
    router.replace('/');
  };

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <Screen scroll>
      <HkLogo size={isShort ? 44 : 56} style={isShort ? styles.logoCompact : styles.logo} />
      <Text style={[styles.brand, { fontSize: scale(typography.brand.fontSize) }]}>
        {t('app.name')}
      </Text>
      <Text style={[styles.tagline, isShort ? styles.taglineCompact : null]}>
        {t('app.tagline')}
      </Text>

      <View style={[styles.card, isShort ? styles.cardCompact : null]}>
        <Text style={styles.step}>
          {index + 1}/{SLIDES.length}
        </Text>
        <Text style={[styles.title, { fontSize: scale(typography.title.fontSize) }]}>
          {t(slide.titleKey)}
        </Text>
        <Text style={styles.body}>{t(slide.bodyKey)}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={SLIDES[i].titleKey}
            style={[styles.dot, i === index ? styles.dotActive : null]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        {!isLast ? (
          <>
            <Button
              label={t('onboarding.skip')}
              variant="ghost"
              onPress={() => void finish()}
              style={styles.flex}
            />
            <Button
              label={t('onboarding.next')}
              onPress={() => setIndex((v) => Math.min(v + 1, SLIDES.length - 1))}
              style={styles.flex}
            />
          </>
        ) : (
          <Button
            label={t('onboarding.getStarted')}
            onPress={() => void finish()}
            style={styles.flex}
          />
        )}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  logo: { marginTop: spacing.lg, marginBottom: spacing.md },
  logoCompact: { marginTop: spacing.sm, marginBottom: spacing.sm },
  taglineCompact: { marginBottom: spacing.md },
  cardCompact: { minHeight: 0, padding: spacing.md },
  brand: {
    ...typography.brand,
    color: colors.text,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 220,
  },
  step: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
}));
