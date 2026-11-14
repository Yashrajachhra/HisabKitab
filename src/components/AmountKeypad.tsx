import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AMOUNT_PRESETS_PKR } from '../config/constants';
import { radii, spacing, typography } from '../config/theme';
import { makeStyles } from '../theme/ThemeProvider';
import { MAX_CONTENT_WIDTH, useResponsive } from '../hooks/useResponsive';
import { formatPkr, parseAmountInput, toMinorUnits } from '../utils/money';
import { Button } from './ui/Button';

type AmountKeypadProps = {
  categoryName: string;
  onConfirm: (amountMinor: number) => void;
  onCancel: () => void;
  confirming?: boolean;
};

export function AmountKeypad({
  categoryName,
  onConfirm,
  onCancel,
  confirming = false,
}: AmountKeypadProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isShort, scale } = useResponsive();
  const [digits, setDigits] = useState('');

  const amountMinor = useMemo(() => parseAmountInput(digits) ?? 0, [digits]);
  const display = digits.length > 0 ? formatPkr(amountMinor) : formatPkr(0);

  const append = (ch: string) => {
    setDigits((prev) => {
      if (ch === '.' && prev.includes('.')) return prev;
      if (prev === '0' && ch !== '.') return ch;
      const next = `${prev}${ch}`;
      const parts = next.split('.');
      if (parts[1] && parts[1].length > 2) return prev;
      if (next.length > 10) return prev;
      return next;
    });
  };

  const backspace = () => setDigits((prev) => prev.slice(0, -1));

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'] as const;

  return (
    <View
      style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}
      accessibilityViewIsModal
    >
      <Text style={styles.heading}>{t('quickTap.title')}</Text>
      <Text style={styles.category} numberOfLines={1}>
        {categoryName}
      </Text>
      <Text
        style={[
          styles.amount,
          { fontSize: scale(typography.amount.fontSize) },
          isShort ? styles.amountCompact : null,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        accessibilityLiveRegion="polite"
      >
        {display}
      </Text>

      <View style={styles.presets}>
        {AMOUNT_PRESETS_PKR.map((preset) => (
          <Pressable
            key={preset}
            accessibilityRole="button"
            accessibilityLabel={`${preset} rupees`}
            onPress={() => {
              onConfirm(toMinorUnits(preset));
            }}
            style={({ pressed }) => [styles.preset, pressed ? styles.pressed : null]}
          >
            <Text style={styles.presetText}>Rs {preset}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.keypad}>
        {keys.map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={key === '⌫' ? 'Backspace' : key}
            onPress={() => {
              if (key === '⌫') backspace();
              else append(key);
            }}
            style={({ pressed }) => [
              styles.key,
              isShort ? styles.keyCompact : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={[styles.keyText, { fontSize: scale(22) }]}>{key}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label={t('quickTap.cancel')}
          variant="ghost"
          onPress={onCancel}
          style={styles.flex}
        />
        <Button
          label={t('quickTap.confirm')}
          onPress={() => {
            if (amountMinor > 0) onConfirm(amountMinor);
          }}
          disabled={amountMinor <= 0}
          loading={confirming}
          style={styles.flex}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  heading: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  category: {
    ...typography.title,
    color: colors.text,
    marginTop: spacing.xs,
  },
  amount: {
    ...typography.amount,
    color: colors.primary,
    marginVertical: spacing.md,
  },
  amountCompact: {
    marginVertical: spacing.sm,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  preset: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: {
    color: colors.primary,
    fontWeight: '600',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  key: {
    width: '33.33%',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  keyCompact: {
    paddingVertical: spacing.sm + 2,
  },
  keyText: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  flex: {
    flex: 1,
  },
}));
