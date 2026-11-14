import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { BudgetProgressBar } from '../../src/components/BudgetProgressBar';
import { CategoryBudgetList } from '../../src/components/CategoryBudgetList';
import { CategorySpendChart } from '../../src/components/CategorySpendChart';
import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { TextField } from '../../src/components/ui/TextField';
import { radii, spacing, typography } from '../../src/config/theme';
import { makeStyles } from '../../src/theme/ThemeProvider';
import { budgetFormSchema, type BudgetFormValues } from '../../src/features/budgets/schemas';
import { useBudgetStore } from '../../src/store/budgetStore';
import { formatMonthLabel } from '../../src/utils/date';
import { parseAmountInput, toMajorUnits } from '../../src/utils/money';

export default function DashboardScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryLimitMajor, setCategoryLimitMajor] = useState('');

  const month = useBudgetStore((s) => s.month);
  const budget = useBudgetStore((s) => s.budget);
  const progress = useBudgetStore((s) => s.progress);
  const categorySpend = useBudgetStore((s) => s.categorySpend);
  const lastAlert = useBudgetStore((s) => s.lastAlert);
  const error = useBudgetStore((s) => s.error);
  const isLoading = useBudgetStore((s) => s.isLoading);
  const loadMonth = useBudgetStore((s) => s.loadMonth);
  const saveMonthlyLimit = useBudgetStore((s) => s.saveMonthlyLimit);
  const saveCategoryLimit = useBudgetStore((s) => s.saveCategoryLimit);
  const dismissAlert = useBudgetStore((s) => s.dismissAlert);
  const clearError = useBudgetStore((s) => s.clearError);

  useFocusEffect(
    useCallback(() => {
      void loadMonth();
    }, [loadMonth]),
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      totalLimitMajor: budget ? String(toMajorUnits(budget.totalLimitMinor)) : '',
    },
  });

  const openEditor = () => {
    reset({
      totalLimitMajor: budget ? String(toMajorUnits(budget.totalLimitMinor)) : '',
    });
    setEditing(true);
  };

  const onSave = handleSubmit(async (values) => {
    const minor = parseAmountInput(values.totalLimitMajor);
    if (minor === null || minor <= 0) return;
    await saveMonthlyLimit(minor);
    setEditing(false);
  });

  return (
    <Screen
      title={t('dashboard.title')}
      loading={isLoading && !budget && categorySpend.length === 0}
      headerRight={
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>
      }
    >
      <Text style={styles.month}>{formatMonthLabel(month)}</Text>

      {lastAlert ? (
        <Pressable
          onPress={dismissAlert}
          style={[
            styles.alertBanner,
            lastAlert === 'exceeded_100' ? styles.alertDanger : styles.alertWarn,
          ]}
          accessibilityRole="alert"
        >
          <Text style={styles.alertText}>
            {lastAlert === 'exceeded_100' ? t('dashboard.alert100') : t('dashboard.alert80')}
          </Text>
          <Text style={styles.alertDismiss}>{t('dashboard.dismiss')}</Text>
        </Pressable>
      ) : null}

      {error ? (
        <Pressable onPress={clearError} style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </Pressable>
      ) : null}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t('dashboard.monthlyBudget')}</Text>
          <Pressable accessibilityRole="button" onPress={openEditor}>
            <Text style={styles.edit}>{budget ? t('dashboard.edit') : t('dashboard.set')}</Text>
          </Pressable>
        </View>
        <BudgetProgressBar progress={progress} label={t('dashboard.progress')} />
      </View>

      {editing ? (
        <View style={styles.editor}>
          <Controller
            control={control}
            name="totalLimitMajor"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={t('dashboard.limitLabel')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
                error={errors.totalLimitMajor?.message}
                autoFocus
              />
            )}
          />
          <View style={styles.editorActions}>
            <Button
              label={t('common.back')}
              variant="ghost"
              onPress={() => setEditing(false)}
              style={styles.flex}
            />
            <Button
              label={t('dashboard.save')}
              loading={isSubmitting}
              onPress={() => {
                void onSave();
              }}
              style={styles.flex}
            />
          </View>
          <Text style={styles.privacyNote}>{t('dashboard.notifPrivacy')}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <CategorySpendChart data={categorySpend} />
      </View>

      <Text style={styles.section}>{t('dashboard.categoryLimits')}</Text>
      <CategoryBudgetList
        categorySpend={categorySpend}
        perCategoryLimits={budget?.perCategoryLimits ?? {}}
      />

      {budget && categorySpend.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.setCategoryLimit')}</Text>
          <Text style={styles.hint}>{t('dashboard.pickCategory')}</Text>
          <View style={styles.chips}>
            {categorySpend.map((item) => {
              const active = categoryId === item.categoryId;
              return (
                <Pressable
                  key={item.categoryId}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setCategoryId(item.categoryId);
                    const existing = budget.perCategoryLimits[item.categoryId];
                    setCategoryLimitMajor(
                      existing !== undefined ? String(toMajorUnits(existing)) : '',
                    );
                  }}
                  style={[styles.chip, active ? styles.chipActive : null]}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                    {item.categoryName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {categoryId ? (
            <>
              <TextField
                label={t('dashboard.categoryLimitLabel')}
                value={categoryLimitMajor}
                onChangeText={setCategoryLimitMajor}
                keyboardType="decimal-pad"
              />
              <Button
                label={t('dashboard.save')}
                onPress={() => {
                  const minor = parseAmountInput(categoryLimitMajor);
                  if (minor === null || minor <= 0 || !categoryId) return;
                  void saveCategoryLimit(categoryId, minor);
                }}
              />
            </>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  back: { padding: spacing.sm },
  backText: { color: colors.primary, fontWeight: '700' },
  month: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  edit: {
    color: colors.primary,
    fontWeight: '700',
  },
  editor: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editorActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: { flex: 1 },
  privacyNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  alertBanner: {
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertWarn: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  alertDanger: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  alertText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  alertDismiss: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorBanner: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
  },
}));
