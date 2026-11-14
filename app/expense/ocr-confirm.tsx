import { useEffect } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CategoryGrid } from '../../src/components/CategoryGrid';
import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { TextField } from '../../src/components/ui/TextField';
import { PAYMENT_METHODS } from '../../src/config/constants';
import { radii, spacing, typography } from '../../src/config/theme';
import { makeStyles } from '../../src/theme/ThemeProvider';
import { ocrConfirmSchema, type OcrConfirmFormValues } from '../../src/features/ocr/schemas';
import { useAppStore } from '../../src/store/appStore';
import { defaultPaymentMethod, useOcrDraftStore } from '../../src/store/ocrDraftStore';
import { parseAmountInput, toMajorUnits } from '../../src/utils/money';

export default function OcrConfirmScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useOcrDraftStore((s) => s.draft);
  const setKeepImage = useOcrDraftStore((s) => s.setKeepImage);
  const clearDraft = useOcrDraftStore((s) => s.clear);
  const categories = useAppStore((s) => s.categories);
  const addExpense = useAppStore((s) => s.addExpense);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OcrConfirmFormValues>({
    resolver: zodResolver(ocrConfirmSchema),
    defaultValues: {
      amountMajor: draft?.amountMinor ? String(toMajorUnits(draft.amountMinor)) : '',
      categoryId: categories[0]?.id ?? '',
      note: draft?.merchant ?? '',
      date: draft?.date ?? new Date().toISOString().slice(0, 10),
      paymentMethod: defaultPaymentMethod(draft?.paymentMethodHint ?? null),
      keepImage: false,
    },
  });

  useEffect(() => {
    if (!draft) {
      router.replace('/expense/ocr' as Href);
    }
  }, [draft, router]);

  const selectedCategoryId = watch('categoryId');
  const selectedPayment = watch('paymentMethod');
  const keepImage = watch('keepImage');

  const onSubmit = handleSubmit(async (values) => {
    if (!draft) return;
    const amountMinor = parseAmountInput(values.amountMajor);
    if (amountMinor === null || amountMinor <= 0) return;

    setKeepImage(values.keepImage);
    await addExpense({
      amountMinor,
      categoryId: values.categoryId,
      note: values.note.trim() ? values.note.trim() : null,
      date: values.date,
      source: 'ocr',
      paymentMethod: values.paymentMethod,
    });
    await clearDraft({ deleteImage: !values.keepImage });
    router.replace('/');
  });

  const onCancel = async () => {
    await clearDraft({ deleteImage: true });
    router.back();
  };

  if (!draft) {
    return <Screen loading>{null}</Screen>;
  }

  return (
    <Screen title={t('ocr.confirmTitle')} scroll>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>{t(`ocr.format.${draft.format}`)}</Text>
        <Text style={styles.badge}>{t(`ocr.confidence.${draft.confidence}`)}</Text>
      </View>
      <Text style={styles.hint}>{t('ocr.confirmHint')}</Text>

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
            label={t('ocr.merchantNote')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
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

      <View style={styles.keepRow}>
        <View style={styles.keepCopy}>
          <Text style={styles.keepTitle}>{t('ocr.keepImage')}</Text>
          <Text style={styles.keepBody}>{t('ocr.keepImageHint')}</Text>
        </View>
        <Controller
          control={control}
          name="keepImage"
          render={({ field: { onChange, value } }) => (
            <Switch
              value={value}
              onValueChange={(next) => {
                onChange(next);
                setKeepImage(next);
              }}
              accessibilityLabel={t('ocr.keepImage')}
            />
          )}
        />
      </View>
      {!keepImage ? <Text style={styles.deleteNote}>{t('ocr.willDelete')}</Text> : null}

      <Button
        label={t('ocr.save')}
        loading={isSubmitting}
        onPress={() => {
          void onSubmit();
        }}
        style={styles.save}
      />
      <Button label={t('ocr.discard')} variant="ghost" onPress={() => void onCancel()} />
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    ...typography.caption,
    backgroundColor: colors.primaryMuted,
    color: colors.primary,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  spacer: { height: spacing.md },
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
  keepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  keepCopy: { flex: 1 },
  keepTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  keepBody: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteNote: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  save: { marginBottom: spacing.sm },
}));
