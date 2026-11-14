import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CategoryGrid } from '../../src/components/CategoryGrid';
import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { TextField } from '../../src/components/ui/TextField';
import { PAYMENT_METHODS } from '../../src/config/constants';
import { radii, spacing, typography } from '../../src/config/theme';
import { makeStyles } from '../../src/theme/ThemeProvider';
import {
  manualExpenseSchema,
  type ManualExpenseFormValues,
} from '../../src/features/expenses/schemas';
import { useAppStore } from '../../src/store/appStore';
import { parseAmountInput } from '../../src/utils/money';

export default function ManualExpenseScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const categories = useAppStore((s) => s.categories);
  const addExpense = useAppStore((s) => s.addExpense);

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
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'cash',
    },
  });

  const selectedCategoryId = watch('categoryId');
  const selectedPayment = watch('paymentMethod');

  const onSubmit = handleSubmit(async (values) => {
    const amountMinor = parseAmountInput(values.amountMajor);
    if (amountMinor === null || amountMinor <= 0) return;

    await addExpense({
      amountMinor,
      categoryId: values.categoryId,
      note: values.note?.trim() ? values.note.trim() : null,
      date: values.date,
      source: 'manual',
      paymentMethod: values.paymentMethod,
    });
    router.back();
  });

  return (
    <Screen title={t('manual.title')} scroll>
      <Controller
        control={control}
        name="amountMajor"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label={t('manual.amount')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="decimal-pad"
            error={errors.amountMajor?.message}
            autoFocus
          />
        )}
      />

      <Text style={styles.label}>{t('manual.category')}</Text>
      {errors.categoryId ? <Text style={styles.error}>{errors.categoryId.message}</Text> : null}
      <CategoryGrid
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={(category) => setValue('categoryId', category.id, { shouldValidate: true })}
      />

      <View style={styles.spacer} />

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

      <Text style={styles.label}>{t('manual.paymentMethod')}</Text>
      <View style={styles.methods}>
        {PAYMENT_METHODS.map((method) => {
          const active = selectedPayment === method;
          return (
            <Pressable
              key={method}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setValue('paymentMethod', method)}
              style={[styles.chip, active ? styles.chipActive : null]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                {t(`payment.${method}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        label={t('manual.save')}
        onPress={() => {
          void onSubmit();
        }}
        loading={isSubmitting}
        style={styles.save}
      />
      <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  spacer: {
    height: spacing.md,
  },
  error: {
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
  save: {
    marginBottom: spacing.sm,
  },
}));
