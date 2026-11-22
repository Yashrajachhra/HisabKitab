import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AddCategoryField } from '../src/components/AddCategoryField';
import { AmountKeypad } from '../src/components/AmountKeypad';
import { CategoryGrid } from '../src/components/CategoryGrid';
import { ExpenseList } from '../src/components/ExpenseList';
import { HkLogo } from '../src/components/HkLogo';
import { Confetti } from '../src/components/ui/Confetti';
import { PressableScale } from '../src/components/ui/PressableScale';
import { ProgressRing } from '../src/components/ui/ProgressRing';
import { Screen } from '../src/components/ui/Screen';
import { brand, radii, shadows, spacing, typography, withAlpha } from '../src/config/theme';
import { makeStyles, useTheme } from '../src/theme/ThemeProvider';
import type { Category } from '../src/db/types';
import { useAppStore } from '../src/store/appStore';
import { useBudgetStore } from '../src/store/budgetStore';
import { useResponsive } from '../src/hooks/useResponsive';
import { formatPkr } from '../src/utils/money';

const ENTRY_ACTIONS = [
  { route: '/expense/ocr', icon: 'camera', tint: 'primary', labelKey: 'home.snap', a11yKey: 'ocr.title' },
  { route: '/expense/voice', icon: 'mic', tint: 'accent', labelKey: 'home.voice', a11yKey: 'voice.title' },
  { route: '/expense/manual', icon: 'create', tint: 'navy', labelKey: 'home.manual', a11yKey: 'manual.title' },
] as const;

/** Confetti plays at most once per app session when the monthly budget is on track. */
let celebratedThisSession = false;

export default function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { scale } = useResponsive();
  const quickTapCategories = useAppStore((s) => s.quickTapCategories);
  const expenses = useAppStore((s) => s.expenses);
  const addExpense = useAppStore((s) => s.addExpense);
  const isLoading = useAppStore((s) => s.isLoading);
  const error = useAppStore((s) => s.error);
  const clearError = useAppStore((s) => s.clearError);
  const progress = useBudgetStore((s) => s.progress);
  const loadMonth = useBudgetStore((s) => s.loadMonth);

  const [selected, setSelected] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [confetti, setConfetti] = useState(false);

  // Read-only refresh of the existing budget data so the ring stays current.
  useFocusEffect(
    useCallback(() => {
      void loadMonth();
    }, [loadMonth]),
  );

  const monthTotal = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    return expenses
      .filter((e) => e.date.startsWith(month))
      .reduce((sum, e) => sum + e.amountMinor, 0);
  }, [expenses]);

  const hasBudget = progress.limitMinor > 0;
  const onTrack = hasBudget && progress.threshold === 'none' && progress.spentMinor > 0;
  const ringColor =
    progress.threshold === 'exceeded'
      ? colors.danger
      : progress.threshold === 'warning'
        ? colors.accent
        : colors.primary;

  useEffect(() => {
    if (!onTrack || celebratedThisSession) return;
    celebratedThisSession = true;
    const timer = setTimeout(() => setConfetti(true), 450);
    return () => clearTimeout(timer);
  }, [onTrack]);

  const handleConfirm = async (amountMinor: number) => {
    if (!selected) return;
    setSaving(true);
    try {
      await addExpense({
        amountMinor,
        categoryId: selected.id,
        source: 'quick_tap',
        paymentMethod: 'cash',
      });
      setSelected(null);
    } catch {
      // error surfaced via store
    } finally {
      setSaving(false);
    }
  };

  const tintFor = (tint: (typeof ENTRY_ACTIONS)[number]['tint']) =>
    tint === 'primary' ? colors.primary : tint === 'accent' ? colors.accent : colors.navySoft;

  return (
    <>
      <Screen
        scroll
        headerLeft={
          <View style={styles.headerLeft}>
            <HkLogo size={40} />
            <View style={styles.headerText}>
              <Text style={styles.greeting} numberOfLines={1}>
                {t('home.greeting')} 👋
              </Text>
              <Text
                style={[styles.brand, { fontSize: scale(22) }]}
                accessibilityRole="header"
                numberOfLines={1}
              >
                {t('app.name')}
              </Text>
            </View>
          </View>
        }
        showLanguageToggle
      >
        <PressableScale
          style={styles.hero}
          scaleTo={0.98}
          accessibilityRole="button"
          accessibilityHint={t('home.openDashboard')}
          onPress={() => router.push('/dashboard' as Href)}
        >
          <View style={[styles.blob, styles.blobTeal]} />
          <View style={[styles.blob, styles.blobAmber]} />

          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>{t('home.monthTotal')}</Text>
              <Text
                style={[styles.heroValue, { fontSize: scale(typography.amountXL.fontSize) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatPkr(monthTotal)}
              </Text>
              {hasBudget ? (
                <Text style={styles.heroSub} numberOfLines={1}>
                  {progress.threshold === 'exceeded'
                    ? t('home.overBy', {
                        defaultValue: 'Over by {{amount}}',
                        amount: formatPkr(progress.spentMinor - progress.limitMinor),
                      })
                    : t('home.leftThisMonth', {
                        defaultValue: '{{amount}} left this month',
                        amount: formatPkr(progress.remainingMinor),
                      })}
                </Text>
              ) : null}
            </View>

            <ProgressRing
              progress={hasBudget ? progress.ratio : 0}
              size={92}
              strokeWidth={10}
              color={ringColor}
              trackColor={withAlpha(brand.white, 0.14)}
            >
              {hasBudget ? (
                <>
                  <Text style={styles.ringPercent}>{progress.percent}%</Text>
                  <Text style={styles.ringCaption}>{t('home.budget')}</Text>
                </>
              ) : (
                <Ionicons name="flag" size={26} color={colors.accent} />
              )}
            </ProgressRing>
          </View>

          <View style={styles.heroChip}>
            <Text style={styles.heroChipText}>
              {hasBudget ? t('home.openDashboard') : t('dashboard.set')}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={brand.navy} />
          </View>
        </PressableScale>

        {onTrack ? (
          <View style={styles.cheer} accessibilityRole="text">
            <Text style={styles.cheerEmoji}>🎉</Text>
            <View style={styles.flex}>
              <Text style={styles.cheerTitle}>
                {t('home.onTrackTitle', "You're on track!")}
              </Text>
              <Text style={styles.cheerBody}>
                {t('home.onTrackBody', 'Spending is within your monthly budget. Keep it up!')}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.entryActions}>
          {ENTRY_ACTIONS.map((action) => {
            const tint = tintFor(action.tint);
            return (
              <PressableScale
                key={action.route}
                accessibilityRole="button"
                accessibilityLabel={t(action.a11yKey)}
                onPress={() => router.push(action.route as Href)}
                style={styles.entryAction}
              >
                <View style={[styles.entryIcon, { backgroundColor: withAlpha(tint, 0.14) }]}>
                  <Ionicons name={action.icon} size={22} color={tint} />
                </View>
                <Text style={styles.entryLabel} numberOfLines={1}>
                  {t(action.labelKey)}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        {error ? (
          <Pressable onPress={clearError} style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </Pressable>
        ) : null}

        <Text style={styles.section}>{t('home.quickTap')}</Text>
        <CategoryGrid
          categories={quickTapCategories}
          onSelect={(category) => {
            clearError();
            setSelected(category);
          }}
          onAdd={() => setShowAddCategory((v) => !v)}
        />
        {showAddCategory ? (
          <AddCategoryField
            compact
            onCreated={(category) => {
              setShowAddCategory(false);
              clearError();
              setSelected(category);
            }}
          />
        ) : null}

        <Text style={[styles.section, styles.sectionSpaced]}>{t('home.recent')}</Text>
        <ExpenseList expenses={expenses} />
      </Screen>

      <Confetti run={confetti} onDone={() => setConfetti(false)} />

      <Modal
        visible={selected !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)} />
        {selected ? (
          <AmountKeypad
            categoryName={selected.name}
            onCancel={() => setSelected(null)}
            onConfirm={(amount) => {
              void handleConfirm(amount);
            }}
            confirming={saving || isLoading}
          />
        ) : null}
      </Modal>
    </>
  );
}

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1 },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flexShrink: 1,
  },
  headerText: {
    flexShrink: 1,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  brand: {
    ...typography.brand,
    color: colors.text,
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: spacing.lg - 4,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTeal: {
    width: 180,
    height: 180,
    right: -60,
    top: -70,
    backgroundColor: withAlpha(brand.teal, 0.22),
  },
  blobAmber: {
    width: 120,
    height: 120,
    left: -40,
    bottom: -60,
    backgroundColor: withAlpha(brand.amber, 0.18),
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    ...typography.overline,
    color: colors.onNavy,
    opacity: 0.7,
  },
  heroValue: {
    ...typography.amountXL,
    color: colors.onNavy,
    marginTop: spacing.xs,
  },
  heroSub: {
    ...typography.caption,
    color: colors.onNavy,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  ringPercent: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.onNavy,
  },
  ringCaption: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.onNavy,
    opacity: 0.7,
  },
  heroChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    backgroundColor: brand.amber,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  heroChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: brand.navy,
  },
  cheer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cheerEmoji: {
    fontSize: 28,
  },
  cheerTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  cheerBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  entryActions: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
    marginBottom: spacing.lg,
  },
  entryAction: {
    flex: 1,
    minHeight: 88,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
    ...shadows.soft,
  },
  entryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  section: {
    ...typography.subtitle,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm + 4,
  },
  sectionSpaced: {
    marginTop: spacing.lg,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    padding: spacing.md,
    borderRadius: radii.card,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    flex: 1,
  },
}));
