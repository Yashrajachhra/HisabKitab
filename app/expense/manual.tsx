import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View, type TextStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AddCategoryField } from '../../src/components/AddCategoryField';
import { CategoryGrid } from '../../src/components/CategoryGrid';
import { Screen } from '../../src/components/ui/Screen';
import { TextField } from '../../src/components/ui/TextField';
import { PAYMENT_METHODS } from '../../src/config/constants';
import { radii, shadows, spacing, tabular, typography } from '../../src/config/theme';
import { useResponsive } from '../../src/hooks/useResponsive';
import { makeStyles, useTheme } from '../../src/theme/ThemeProvider';
import {
  manualExpenseSchema,
  type ManualExpenseFormValues,
} from '../../src/features/expenses/schemas';
import { useAppStore } from '../../src/store/appStore';
import { formatPkr, parseAmountInput } from '../../src/utils/money';

export default function ManualExpenseScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { scale } = useResponsive();
  const categories = useAppStore((s) => s.categories);
  const addExpense = useAppStore((s) => s.addExpense);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ManualExpenseFormValues>({
    resolver: zodResolver(manualExpenseSchema),
    defaultValues: {
      amountMajor: '',
      categoryId: categories[0]?.id ?? '',
      note: '',
      tags: '',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'cash',
    },
  });

  const selectedCategoryId = watch('categoryId');
  const selectedPayment = watch('paymentMethod');
  const amountMajorValue = watch('amountMajor');
  const previewMinor = parseAmountInput(amountMajorValue) ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    const amountMinor = parseAmountInput(values.amountMajor);
    if (amountMinor === null || amountMinor <= 0) return;

    const tags = (values.tags ?? '')
      .split(/[,#]+/)
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter(Boolean);

    await addExpense({
      amountMinor,
      categoryId: values.categoryId,
      note: values.note?.trim() ? values.note.trim() : null,
      date: values.date,
      source: 'manual',
      paymentMethod: values.paymentMethod,
      tags,
    });
    router.back();
  });

  return (
    <Screen title={t('manual.title')} scroll>
      <View style={styles.amountCard}>
        <View style={styles.currencyPill}>
          <Text style={styles.currencyPillText}>PKR</Text>
        </View>
        <Controller
          control={control}
          name="amountMajor"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>Rs.</Text>
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={t('manual.amount')}
                autoFocus
                style={[styles.amountInput, { fontSize: scale(typography.amount.fontSize) }]}
              />
            </View>
          )}
        />
        {errors.amountMajor ? (
          <Text style={styles.amountError} accessibilityLiveRegion="polite">
            {errors.amountMajor.message}
          </Text>
        ) : null}
      </View>

      <Text style={styles.sectionLabel}>{t('manual.category')}</Text>
      {errors.categoryId ? <Text style={styles.error}>{errors.categoryId.message}</Text> : null}
      <CategoryGrid
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={(category) => setValue('categoryId', category.id, { shouldValidate: true })}
        onAdd={() => setShowAddCategory((v) => !v)}
      />
      {showAddCategory ? (
        <AddCategoryField
          compact
          onCreated={(category) => {
            setValue('categoryId', category.id, { shouldValidate: true });
            setShowAddCategory(false);
          }}
        />
      ) : null}

      <View style={styles.detailsCard}>
        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('manual.note')}
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t('manual.notePlaceholder')}
              error={errors.note?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="tags"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('manual.tags')}
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t('manual.tagsPlaceholder')}
              error={errors.tags?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={t('manual.date')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="YYYY-MM-DD"
              error={errors.date?.message}
            />
          )}
        />
      </View>

      <Text style={styles.sectionLabel}>{t('manual.paymentMethod')}</Text>
      <View style={styles.methods}>
        {PAYMENT_METHODS.map((method) => {
          const active = selectedPayment === method;
          return (
            <Pressable
              key={method}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setValue('paymentMethod', method)}
              style={({ pressed }) => [
                styles.chip,
                active ? styles.chipActive : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                {t(`payment.${method}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('manual.save')}
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        disabled={isSubmitting}
        onPress={() => {
          void onSubmit();
        }}
        style={({ pressed }) => [
          styles.saveBtn,
          previewMinor > 0 ? styles.saveBtnBetween : styles.saveBtnCenter,
          isSubmitting ? styles.disabled : null,
          pressed && !isSubmitting ? styles.pressed : null,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <View style={styles.saveLeft}>
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              <Text style={styles.saveText}>{t('manual.save')}</Text>
            </View>
            {previewMinor > 0 ? (
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>{formatPkr(previewMinor)}</Text>
              </View>
            ) : null}
          </>
        )}
      </Pressable>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
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
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.soft,
  },
  currencyPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  currencyPillText: {
    ...typography.overline,
    color: colors.textSecondary,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 260,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: spacing.xs,
    gap: 6,
  },
  currencyPrefix: {
    ...typography.title,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  amountInput: {
    ...typography.amount,
    color: colors.text,
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    paddingVertical: 0,
    ...tabular,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null),
  },
  amountError: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  sectionLabel: {
    ...typography.labelLg,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: 0,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  methods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.labelMd,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  saveBtn: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  saveBtnBetween: {
    justifyContent: 'space-between',
  },
  saveBtnCenter: {
    justifyContent: 'center',
  },
  saveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  saveText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  saveBadge: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  saveBadgeText: {
    ...typography.labelMd,
    color: colors.onNavy,
    ...tabular,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
}));
