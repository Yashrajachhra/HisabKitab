import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AddCategoryField } from '../src/components/AddCategoryField';
import { AmountKeypad } from '../src/components/AmountKeypad';
import { CategoryGrid } from '../src/components/CategoryGrid';
import { ExpenseList } from '../src/components/ExpenseList';
import { HkLogo } from '../src/components/HkLogo';
import { SettingsButton } from '../src/components/ui/HeaderToggles';
import { PressableScale } from '../src/components/ui/PressableScale';
import { ProgressRing } from '../src/components/ui/ProgressRing';
import { Screen } from '../src/components/ui/Screen';
import { brand, radii, shadows, spacing, tabular, typography } from '../src/config/theme';
import { makeStyles, useTheme } from '../src/theme/ThemeProvider';
import type { Category } from '../src/db/types';
import { useAppStore } from '../src/store/appStore';
import { useBudgetStore } from '../src/store/budgetStore';
import { useOnboardingStore } from '../src/store/onboardingStore';
import { useResponsive } from '../src/hooks/useResponsive';
import { currentMonthKey, formatMonthLabel } from '../src/utils/date';
import { formatPkr } from '../src/utils/money';

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
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  // Refresh budget data on focus so the ring card stays current.
  useFocusEffect(
    useCallback(() => {
      void loadMonth();
    }, [loadMonth]),
  );

  const monthTotal = useMemo(() => {
    const month = currentMonthKey();
    return expenses
      .filter((e) => e.date.startsWith(month))
      .reduce((sum, e) => sum + e.amountMinor, 0);
  }, [expenses]);

  const { monthLabel, shortMonth, daysLeft } = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return {
      monthLabel: formatMonthLabel(currentMonthKey(now)),
      shortMonth: new Intl.DateTimeFormat('en-PK', { month: 'short' }).format(now),
      daysLeft: Math.max(0, lastDay - now.getDate()),
    };
  }, []);

  const hasBudget = progress.limitMinor > 0;
  const ringColor =
    progress.threshold === 'exceeded'
      ? colors.danger
      : progress.threshold === 'warning'
        ? colors.accent
        : colors.primary;

  const dailySafeMinor =
    hasBudget && daysLeft > 0 ? Math.floor(progress.remainingMinor / daysLeft) : 0;

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

  return (
    <>
      <Screen
        scroll
        headerLeft={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('app.name')}
            onPress={() => {
              useOnboardingStore.setState({ complete: false });
              router.replace('/onboarding' as Href);
            }}
            style={({ pressed }) => [styles.headerLeft, pressed ? { opacity: 0.75 } : null]}
          >
            <HkLogo size={34} />
            <View>
              <Text style={styles.headerBrand} numberOfLines={1}>
                {t('app.name')}
              </Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {t('nav.home', 'Home')}
              </Text>
            </View>
          </Pressable>
        }
        headerRight={
          <SettingsButton
            accessibilityLabel={t('settings.title')}
            onPress={() => router.push('/settings?view=settings' as Href)}
          />
        }
        showLanguageToggle
      >
        {/* 1. Greeting & Campus Info Card */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingTop}>
            <View style={styles.flex}>
              <Text
                style={[styles.greetingTitle, { fontSize: scale(typography.title.fontSize) }]}
                accessibilityRole="header"
                numberOfLines={1}
              >
                {t('home.greeting')} 👋
              </Text>
              <View style={styles.campusRow}>
                <Ionicons name="business-outline" size={15} color={colors.primaryDark} />
                <Text style={styles.campusText} numberOfLines={1}>
                  {t('app.tagline')}
                </Text>
              </View>
            </View>
            <View style={styles.monthPill}>
              <Ionicons name="calendar-outline" size={13} color={colors.accentDark} />
              <Text style={styles.monthPillText}>{monthLabel}</Text>
            </View>
          </View>
        </View>

        {/* 2. Budget Status Ring Card */}
        <PressableScale
          style={styles.budgetCard}
          scaleTo={0.985}
          accessibilityRole="button"
          accessibilityHint={t('home.openDashboard')}
          onPress={() => router.push('/dashboard' as Href)}
        >
          <View style={styles.budgetHeader}>
            <View style={styles.budgetHeaderLeft}>
              <View style={styles.walletIconBox}>
                <Ionicons name="wallet-outline" size={18} color={colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.budgetTitle}>{t('home.monthTotal')}</Text>
                <Text style={styles.budgetSub}>{t('home.openDashboard')}</Text>
              </View>
            </View>
            <View style={styles.usedBadge}>
              <Text style={styles.usedBadgeText}>
                {hasBudget ? `${progress.percent}% used` : t('dashboard.set')}
              </Text>
            </View>
          </View>

          <View style={styles.budgetBody}>
            <ProgressRing
              progress={hasBudget ? progress.ratio : 0}
              size={96}
              strokeWidth={8}
              color={ringColor}
              trackColor={colors.surfaceMuted}
            >
              <Text style={styles.ringPercent}>{hasBudget ? `${progress.percent}%` : '—'}</Text>
              <Text style={styles.ringMonth}>{shortMonth}</Text>
            </ProgressRing>

            <View style={styles.budgetFigures}>
              <View style={styles.spentLine}>
                <Text style={styles.spentLabel}>Spent</Text>
                <Text
                  style={[styles.spentAmount, { fontSize: scale(typography.title.fontSize) }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatPkr(monthTotal)}
                </Text>
              </View>
              <Text style={styles.allowanceText} numberOfLines={1}>
                {hasBudget
                  ? `of ${formatPkr(progress.limitMinor)} allowance`
                  : t('dashboard.set')}
              </Text>
              <View style={styles.remainingPill}>
                <Ionicons name="time-outline" size={15} color={colors.primaryDark} />
                <Text style={styles.remainingText} numberOfLines={1}>
                  {hasBudget
                    ? progress.threshold === 'exceeded'
                      ? t('home.overBy', {
                          defaultValue: 'Over by {{amount}}',
                          amount: formatPkr(progress.spentMinor - progress.limitMinor),
                        })
                      : `${formatPkr(progress.remainingMinor)} left (${daysLeft}d)`
                    : `${daysLeft} days left in ${shortMonth}`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.budgetFooter}>
            <View style={styles.targetRow}>
              <View style={styles.targetDot} />
              <Text style={styles.targetText}>
                {hasBudget && daysLeft > 0
                  ? `Target: ~${formatPkr(dailySafeMinor)} / day`
                  : t('home.openDashboard')}
              </Text>
            </View>
            {hasBudget && progress.threshold !== 'exceeded' ? (
              <Text style={styles.onTrackText}>On Track ✨</Text>
            ) : null}
          </View>
        </PressableScale>

        {error ? (
          <Pressable onPress={clearError} style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </Pressable>
        ) : null}

        {/* 3. Quick-Tap Category Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.section}>{t('home.quickTap')}</Text>
          <Text style={styles.sectionHint}>Tap to log instantly</Text>
        </View>
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

        {/* 4. Floating Scan / Quick Bill Upload Prompt Banner + Voice & Manual */}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('ocr.title')}
          onPress={() => router.push('/expense/ocr' as Href)}
          scaleTo={0.985}
          style={styles.scanBanner}
        >
          <View style={styles.flex}>
            <View style={styles.scanBannerTitleRow}>
              <Ionicons name="receipt-outline" size={18} color={colors.tealFixed} />
              <Text style={styles.scanBannerTitle}>Got a hostel or mess receipt?</Text>
            </View>
            <Text style={styles.scanBannerSub}>Snap and log on your device in 3 sec</Text>
          </View>
          <View style={styles.scanBannerBtn}>
            <Ionicons name="camera-outline" size={15} color={brand.tealDark} />
            <Text style={styles.scanBannerBtnText}>{t('home.snap')}</Text>
          </View>
        </PressableScale>

        <View style={styles.quickEntryRow}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('manual.title')}
            onPress={() => router.push('/expense/manual' as Href)}
            style={styles.quickEntryCard}
          >
            <View style={[styles.quickEntryIcon, { backgroundColor: colors.navyMuted }]}>
              <Ionicons name="create-outline" size={20} color={colors.text} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.quickEntryLabel}>{t('manual.title')}</Text>
              <Text style={styles.sectionHint}>{t('home.manual')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </PressableScale>
        </View>

        {/* 5. Recent Transactions Feed Section (only top 3 on Home) */}
        <View style={styles.sectionHeader}>
          <View style={styles.recentTitleRow}>
            <Text style={styles.section}>{t('home.recent')}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{Math.min(3, expenses.length)}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all expenses"
            onPress={() => setShowAllExpenses(true)}
            hitSlop={6}
            style={styles.viewAllBtn}
          >
            <Text style={styles.viewAllText}>View All ({expenses.length})</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primaryDark} />
          </Pressable>
        </View>
        <ExpenseList expenses={expenses.slice(0, 3)} />
      </Screen>

      <Modal
        visible={showAllExpenses}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAllExpenses(false)}
      >
        <View style={styles.allModalWrap}>
          <View style={styles.allModalHeader}>
            <Text style={styles.allModalTitle}>All Expenses ({expenses.length})</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              onPress={() => setShowAllExpenses(false)}
              style={styles.allModalClose}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.allModalList}
            keyboardShouldPersistTaps="handled"
          >
            <ExpenseList expenses={expenses} />
          </ScrollView>
        </View>
      </Modal>

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
    gap: spacing.sm,
    flexShrink: 1,
  },
  headerBrand: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  greetingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  greetingTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  greetingTitle: {
    ...typography.title,
    color: colors.text,
  },
  campusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  campusText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  monthPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  greetingFooter: {
    marginTop: spacing.sm + 4,
    paddingTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roommatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarOverlap: {
    marginLeft: -8,
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onNavy,
  },
  roommatesText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  budgetCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  budgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  walletIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetTitle: {
    ...typography.labelLg,
    color: colors.text,
  },
  budgetSub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  usedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.navyMuted,
  },
  usedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  budgetBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 4,
  },
  ringPercent: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.text,
    ...tabular,
  },
  ringMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  budgetFigures: {
    flex: 1,
    justifyContent: 'center',
  },
  spentLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  spentLabel: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  spentAmount: {
    ...typography.title,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
    ...tabular,
  },
  allowanceText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    ...tabular,
  },
  remainingPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  remainingText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    ...tabular,
  },
  budgetFooter: {
    marginTop: spacing.sm + 2,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  targetText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    ...tabular,
  },
  onTrackText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 2,
    marginTop: spacing.xs,
  },
  section: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.text,
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scanBanner: {
    backgroundColor: brand.tealDark,
    borderRadius: radii.card,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    ...shadows.raised,
  },
  scanBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanBannerTitle: {
    ...typography.labelLg,
    color: brand.white,
  },
  scanBannerSub: {
    ...typography.caption,
    color: brand.white,
    opacity: 0.85,
    marginTop: 2,
  },
  scanBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: brand.white,
  },
  scanBannerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: brand.tealDark,
  },
  quickEntryRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  quickEntryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 12,
    ...shadows.soft,
  },
  quickEntryIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickEntryLabel: {
    ...typography.labelLg,
    color: colors.text,
  },
  recentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  allModalWrap: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  allModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  allModalTitle: {
    ...typography.title,
    color: colors.text,
  },
  allModalClose: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allModalList: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
