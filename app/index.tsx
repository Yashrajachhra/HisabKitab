import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AmountKeypad } from '../src/components/AmountKeypad';
import { CategoryGrid } from '../src/components/CategoryGrid';
import { ExpenseList } from '../src/components/ExpenseList';
import { HkLogo } from '../src/components/HkLogo';
import { Screen } from '../src/components/ui/Screen';
import { radii, spacing, typography } from '../src/config/theme';
import { makeStyles } from '../src/theme/ThemeProvider';
import type { Category } from '../src/db/types';
import { useAppStore } from '../src/store/appStore';
import { useResponsive } from '../src/hooks/useResponsive';
import { formatPkr } from '../src/utils/money';

const ENTRY_ACTIONS = [
  { route: '/expense/ocr', glyph: '📷', labelKey: 'home.snap', a11yKey: 'ocr.title' },
  { route: '/expense/voice', glyph: '🎙', labelKey: 'home.voice', a11yKey: 'voice.title' },
  { route: '/expense/manual', glyph: '✎', labelKey: 'home.manual', a11yKey: 'manual.title' },
] as const;

export default function HomeScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const { scale } = useResponsive();
  const quickTapCategories = useAppStore((s) => s.quickTapCategories);
  const expenses = useAppStore((s) => s.expenses);
  const addExpense = useAppStore((s) => s.addExpense);
  const isLoading = useAppStore((s) => s.isLoading);
  const error = useAppStore((s) => s.error);
  const clearError = useAppStore((s) => s.clearError);

  const [selected, setSelected] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const monthTotal = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    return expenses
      .filter((e) => e.date.startsWith(month))
      .reduce((sum, e) => sum + e.amountMinor, 0);
  }, [expenses]);

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
        headerLeft={<HkLogo size={36} />}
        showLanguageToggle
        headerRight={
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('groups.title')}
              onPress={() => router.push('/groups' as Href)}
              style={styles.linkBtn}
            >
              <Text style={styles.link}>{t('home.groups')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings.title')}
              onPress={() => router.push('/settings')}
              style={styles.linkBtn}
            >
              <Text style={styles.link}>⚙</Text>
            </Pressable>
          </View>
        }
      >
        <Text
          style={[styles.brand, { fontSize: scale(typography.brand.fontSize) }]}
          accessibilityRole="header"
        >
          {t('app.name')}
        </Text>
        <Text style={styles.greeting}>{t('home.greeting')}</Text>

        <Pressable
          style={styles.totalCard}
          accessibilityRole="button"
          accessibilityHint={t('home.openDashboard')}
          onPress={() => router.push('/dashboard' as Href)}
        >
          <Text style={styles.totalLabel}>{t('home.monthTotal')}</Text>
          <Text
            style={[styles.totalValue, { fontSize: scale(typography.amount.fontSize) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatPkr(monthTotal)}
          </Text>
          <Text style={styles.totalHint}>{t('home.openDashboard')}</Text>
        </Pressable>

        <View style={styles.entryActions}>
          {ENTRY_ACTIONS.map((action) => (
            <Pressable
              key={action.route}
              accessibilityRole="button"
              accessibilityLabel={t(action.a11yKey)}
              onPress={() => router.push(action.route as Href)}
              style={({ pressed }) => [styles.entryAction, pressed ? styles.pressed : null]}
            >
              <Text style={styles.entryGlyph}>{action.glyph}</Text>
              <Text style={styles.entryLabel} numberOfLines={1}>
                {t(action.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? (
          <Pressable onPress={clearError} style={styles.errorBanner}>
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
        />

        <Text style={[styles.section, styles.sectionSpaced]}>{t('home.recent')}</Text>
        <ExpenseList expenses={expenses} />
      </Screen>

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
  brand: {
    ...typography.brand,
    color: colors.text,
    marginTop: spacing.sm,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  entryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  entryAction: {
    flex: 1,
    minHeight: 64,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  entryGlyph: {
    fontSize: 20,
    color: colors.primary,
  },
  entryLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.onPrimary,
    opacity: 0.75,
    fontWeight: '600',
  },
  totalValue: {
    ...typography.amount,
    color: colors.onPrimary,
    marginTop: spacing.xs,
  },
  totalHint: {
    ...typography.caption,
    color: colors.onPrimary,
    opacity: 0.75,
    marginTop: spacing.sm,
  },
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSpaced: {
    marginTop: spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  linkBtn: {
    padding: spacing.sm,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  errorBanner: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
  },
}));
