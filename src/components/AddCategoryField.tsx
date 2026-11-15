import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from './ui/Button';
import { TextField } from './ui/TextField';
import { spacing, typography } from '../config/theme';
import { makeStyles } from '../theme/ThemeProvider';
import type { Category } from '../db/types';
import { useAppStore } from '../store/appStore';

type AddCategoryFieldProps = {
  onCreated?: (category: Category) => void;
  compact?: boolean;
};

export function AddCategoryField({ onCreated, compact }: AddCategoryFieldProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  const addCategory = useAppStore((s) => s.addCategory);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await addCategory({ name, isQuickTap: true });
      setName('');
      onCreated?.(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={compact ? styles.compact : styles.wrap}>
      <TextField
        label={t('settings.categoryName')}
        value={name}
        onChangeText={setName}
        placeholder={t('settings.categoryPlaceholder')}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={() => {
          void onSubmit();
        }}
        error={error ?? undefined}
      />
      <Button
        label={t('settings.addCategory')}
        loading={busy}
        onPress={() => {
          void onSubmit();
        }}
        style={styles.btn}
      />
      {!compact ? (
        <Text style={styles.hint}>{t('settings.categoryHint')}</Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { marginBottom: spacing.sm },
  compact: { marginTop: spacing.sm, marginBottom: spacing.sm },
  btn: { marginTop: spacing.xs },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
}));
