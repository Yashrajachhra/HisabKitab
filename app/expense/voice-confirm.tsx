import { useEffect, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
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
import { resolveCategoryHint } from '../../src/features/voice/categoryAliases';
import { voiceConfirmSchema, type VoiceConfirmFormValues } from '../../src/features/voice/schemas';
import { useAppStore } from '../../src/store/appStore';
import { useVoiceDraftStore } from '../../src/store/voiceDraftStore';
import { parseAmountInput, toMajorUnits } from '../../src/utils/money';

export default function VoiceConfirmScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const draft = useVoiceDraftStore((s) => s.draft);
  const clearDraft = useVoiceDraftStore((s) => s.clear);
  const categories = useAppStore((s) => s.categories);
  const addExpense = useAppStore((s) => s.addExpense);

  const resolvedCategoryId = useMemo(() => {
    if (!draft) return categories[0]?.id ?? '';
    const names = categories.map((c) => c.name);
    const hintName = resolveCategoryHint(draft.categoryHint, names);
    const match = categories.find((c) => c.name === hintName);
    return match?.id ?? categories[0]?.id ?? '';
  }, [draft, categories]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VoiceConfirmFormValues>({
    resolver: zodResolver(voiceConfirmSchema),
    defaultValues: {
      amountMajor: draft?.amountMinor ? String(toMajorUnits(draft.amountMinor)) : '',
      categoryId: resolvedCategoryId,
      note: draft?.note ?? '',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'cash',
    },
  });

  useEffect(() => {
    if (!draft) {
      router.replace('/expense/voice' as Href);
    }
  }, [draft, router]);

  useEffect(() => {
    if (resolvedCategoryId) {
      setValue('categoryId', resolvedCategoryId);
    }
  }, [resolvedCategoryId, setValue]);

  const selectedCategoryId = watch('categoryId');
  const selectedPayment = watch('paymentMethod');

  const onSubmit = handleSubmit(async (values) => {
    const amountMinor = parseAmountInput(values.amountMajor);
    if (amountMinor === null || amountMinor <= 0) return;

    await addExpense({
      amountMinor,
      categoryId: values.categoryId,
      note: values.note.trim() ? values.note.trim() : null,
      date: values.date,
      source: 'voice',
      paymentMethod: values.paymentMethod,
    });
    clearDraft();
    router.replace('/');
  });

  if (!draft) {
    return <Screen loading>{null}</Screen>;
  }

  return (
    <Screen title={t('voice.confirmTitle')} scroll>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>{t(`voice.confidence.${draft.confidence}`)}</Text>
      </View>
      <Text style={styles.transcriptLabel}>{t('voice.heard')}</Text>
      <Text style={styles.transcript}>{draft.transcript}</Text>
      <Text style={styles.hint}>{t('voice.confirmHint')}</Text>

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
            label={t('manual.note')}
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

      <Button
        label={t('voice.save')}
        loading={isSubmitting}
        onPress={() => {
          void onSubmit();
        }}
        style={styles.save}
      />
      <Button
        label={t('voice.discard')}
        variant="ghost"
        onPress={() => {
          clearDraft();
          router.back();
        }}
      />
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
  transcriptLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  transcript: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
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
  save: { marginBottom: spacing.sm },
}));
