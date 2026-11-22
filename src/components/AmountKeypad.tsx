import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AMOUNT_PRESETS_PKR } from '../config/constants';
import { radii, shadows, spacing, tabular, typography } from '../config/theme';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { MAX_CONTENT_WIDTH, useResponsive } from '../hooks/useResponsive';
import { formatPkr, parseAmountInput, toMinorUnits } from '../utils/money';
import { Button } from './ui/Button';

type AmountKeypadProps = {
  categoryName: string;
  onConfirm: (amountMinor: number) => void;
  onCancel: () => void;
  confirming?: boolean;
};

const KEY_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
] as const;

export function AmountKeypad({
  categoryName,
  onConfirm,
  onCancel,
  confirming = false,
}: AmountKeypadProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isShort, scale } = useResponsive();
  const [digits, setDigits] = useState('');

  const amountMinor = useMemo(() => parseAmountInput(digits) ?? 0, [digits]);
  const displayValue = formatPkr(amountMinor, { withSymbol: false });
  const canConfirm = amountMinor > 0 && !confirming;

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

  return (
    <View
      style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}
      accessibilityViewIsModal
    >
      <View style={styles.handle} />

      <View style={styles.amountCard}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText} numberOfLines={1}>
            {`${t('quickTap.title')} • ${categoryName}`}
          </Text>
        </View>

        <View
          style={styles.amountRow}
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={formatPkr(amountMinor)}
        >
          <Text style={styles.currencyPrefix}>Rs.</Text>
          <Text
            style={[
              styles.amountValue,
              { fontSize: scale(typography.amount.fontSize) },
              isShort ? styles.amountCompact : null,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {displayValue}
          </Text>
        </View>
      </View>

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
            <Text style={styles.presetText}>Rs. {preset}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.keypad}>
        {KEY_ROWS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.keyRow}>
            {row.map((key) => {
              const isBackspace = key === '⌫';
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={isBackspace ? 'Backspace' : key}
                  onPress={() => {
                    if (isBackspace) backspace();
                    else append(key);
                  }}
                  style={({ pressed }) => [
                    styles.key,
                    isBackspace ? styles.keyBackspace : null,
                    isShort ? styles.keyCompact : null,
                    pressed ? styles.keyPressed : null,
                  ]}
                >
                  {isBackspace ? (
                    <Ionicons name="backspace-outline" size={22} color={colors.danger} />
                  ) : (
                    <Text style={[styles.keyText, { fontSize: scale(22) }]}>{key}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label={t('quickTap.cancel')}
          variant="ghost"
          onPress={onCancel}
          style={styles.cancelBtn}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('quickTap.confirm')}
          accessibilityState={{ disabled: !canConfirm, busy: confirming }}
          disabled={!canConfirm}
          onPress={() => {
            if (amountMinor > 0) onConfirm(amountMinor);
          }}
          style={({ pressed }) => [
            styles.confirmBtn,
            amountMinor > 0 ? styles.confirmBtnBetween : styles.confirmBtnCenter,
            !canConfirm ? styles.disabled : null,
            pressed && canConfirm ? styles.pressed : null,
          ]}
        >
          {confirming ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <View style={styles.confirmLeft}>
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                <Text style={styles.confirmText}>{t('quickTap.confirm')}</Text>
              </View>
              {amountMinor > 0 ? (
                <View style={styles.confirmBadge}>
                  <Text style={styles.confirmBadgeText}>{formatPkr(amountMinor)}</Text>
                </View>
              ) : null}
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 4,
    borderTopWidth: 1,
    borderColor: colors.border,
    ...shadows.modal,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm + 4,
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
    ...shadows.soft,
  },
  categoryPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  categoryPillText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  currencyPrefix: {
    ...typography.title,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  amountValue: {
    ...typography.amount,
    color: colors.text,
    ...tabular,
  },
  amountCompact: {
    fontSize: 28,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm + 4,
  },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  presetText: {
    ...typography.labelMd,
    color: colors.text,
    ...tabular,
  },
  keypad: {
    gap: spacing.sm,
  },
  keyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  key: {
    flex: 1,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  keyBackspace: {
    backgroundColor: colors.surfaceMuted,
  },
  keyCompact: {
    height: 44,
  },
  keyPressed: {
    backgroundColor: colors.surfaceMuted,
    transform: [{ scale: 0.98 }],
  },
  keyText: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '700',
    ...tabular,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 2,
    minHeight: 50,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmBtnBetween: {
    justifyContent: 'space-between',
  },
  confirmBtnCenter: {
    justifyContent: 'center',
  },
  confirmLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  confirmText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  confirmBadge: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confirmBadgeText: {
    ...typography.labelMd,
    color: colors.onNavy,
    ...tabular,
  },
}));
