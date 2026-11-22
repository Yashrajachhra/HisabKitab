import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { categoryVisual, radii, shadows, spacing, tabular, typography } from '../config/theme';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import type { ExpenseWithCategory } from '../db/types';
import { formatPkr } from '../utils/money';

type IconName = ComponentProps<typeof Ionicons>['name'];

type ExpenseListItemProps = {
  expense: ExpenseWithCategory;
  onEdit?: (expense: ExpenseWithCategory) => void;
  onDelete?: (expense: ExpenseWithCategory) => void;
};

export function ExpenseListItem({ expense, onEdit, onDelete }: ExpenseListItemProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const visual = categoryVisual({
    name: expense.categoryName,
    icon: expense.categoryIcon,
    color: expense.categoryColor,
  });
  const hasNote = Boolean(expense.note?.trim());
  const title = hasNote ? expense.note!.trim() : expense.categoryName;

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${expense.categoryName}, ${formatPkr(expense.amountMinor)}, ${expense.date}`}
    >
      <View style={[styles.iconBox, { backgroundColor: visual.bgColor }]}>
        <Ionicons name={visual.icon as IconName} size={22} color={visual.color} />
      </View>

      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.tagRow}>
          <Text style={styles.dateText}>{expense.date}</Text>
          <View style={[styles.catBadge, { backgroundColor: visual.bgColor }]}>
            <Text style={[styles.catBadgeText, { color: visual.color }]}>
              {expense.categoryName}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>-{formatPkr(expense.amountMinor)}</Text>
        {onEdit || onDelete ? (
          <View style={styles.actions}>
            {onEdit ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit expense"
                onPress={() => onEdit(expense)}
                hitSlop={6}
                style={({ pressed }) => [styles.actionBtn, pressed ? styles.pressed : null]}
              >
                <Ionicons name="create-outline" size={15} color={colors.textSecondary} />
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete expense"
                onPress={() => onDelete(expense)}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.deleteBtn,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Ionicons name="trash-outline" size={15} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: 10,
    ...shadows.soft,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  meta: {
    flex: 1,
  },
  title: {
    ...typography.labelLg,
    color: colors.text,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  catBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  amount: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.danger,
    ...tabular,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: colors.dangerSoft,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
}));
