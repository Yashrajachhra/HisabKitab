import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { categoryVisual, radii, shadows, spacing, typography } from '../config/theme';
import type { ExpenseWithCategory } from '../db/types';
import { MAX_CONTENT_WIDTH } from '../hooks/useResponsive';
import { useAppStore } from '../store/appStore';
import { makeStyles } from '../theme/ThemeProvider';
import { parseAmountInput, toMajorUnits } from '../utils/money';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { TextField } from './ui/TextField';
import { ExpenseListItem } from './ExpenseListItem';

type ExpenseListProps = {
  expenses: ExpenseWithCategory[];
};

export function ExpenseList({ expenses }: ExpenseListProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const categories = useAppStore((s) => s.categories);
  const updateExpense = useAppStore((s) => s.updateExpense);
  const removeExpense = useAppStore((s) => s.removeExpense);

  const [editing, setEditing] = useState<ExpenseWithCategory | null>(null);
  const [amountMajor, setAmountMajor] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = (expense: ExpenseWithCategory) => {
    setEditing(expense);
    setAmountMajor(String(toMajorUnits(expense.amountMinor)));
    setCategoryId(expense.categoryId);
    setNote(expense.note ?? '');
    setDate(expense.date);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const minor = parseAmountInput(amountMajor);
    if (minor === null || minor <= 0) return;
    setSaving(true);
    try {
      await updateExpense(editing.id, {
        amountMinor: minor,
        categoryId: categoryId || editing.categoryId,
        note: note.trim() ? note.trim() : null,
        date: date.trim() || editing.date,
      });
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (expense: ExpenseWithCategory) => {
    void removeExpense(expense.id);
    if (editing?.id === expense.id) {
      setEditing(null);
    }
  };

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon="receipt-outline"
        title={t('home.emptyTitle')}
        body={t('home.emptyBody')}
      />
    );
  }

  return (
    <View>
      {expenses.map((expense) => (
        <ExpenseListItem
          key={expense.id}
          expense={expense}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ))}

      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Expense</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <TextField
                label={t('manual.amount')}
                value={amountMajor}
                onChangeText={setAmountMajor}
                keyboardType="decimal-pad"
              />

              <Text style={styles.chipSectionLabel}>{t('manual.category')}</Text>
              <View style={styles.chips}>
                {categories.map((cat) => {
                  const selected = cat.id === categoryId;
                  const visual = categoryVisual(cat);
                  return (
                    <Pressable
                      key={cat.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setCategoryId(cat.id)}
                      style={[
                        styles.chip,
                        selected
                          ? { backgroundColor: visual.color, borderColor: visual.color }
                          : null,
                      ]}
                    >
                      <Text
                        style={[styles.chipText, selected ? styles.chipTextSelected : null]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextField
                label={t('manual.note')}
                value={note}
                onChangeText={setNote}
                placeholder={t('manual.notePlaceholder')}
              />
              <TextField
                label={t('manual.date')}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setEditing(null)}
                style={styles.flex}
              />
              <Button
                label={t('quickTap.confirm')}
                loading={saving}
                onPress={() => void handleSaveEdit()}
                style={styles.flex}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    maxHeight: '85%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.modal,
  },
  modalTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
  },
  chipSectionLabel: {
    ...typography.labelMd,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  chipText: {
    ...typography.labelMd,
    color: colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
}));
