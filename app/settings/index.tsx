import { useEffect, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '../../src/components/ui/Button';
import { ThemeToggle } from '../../src/components/ui/HeaderToggles';
import { Screen } from '../../src/components/ui/Screen';
import { TextField } from '../../src/components/ui/TextField';
import { radii, spacing, typography } from '../../src/config/theme';
import { makeStyles } from '../../src/theme/ThemeProvider';
import { deleteAllLocalData } from '../../src/db/repositories/dataLifecycle';
import { listRecentExpenses } from '../../src/db/repositories/expensesRepo';
import { isAppLockEnabled, setAppLockEnabled, setAppPin } from '../../src/services/appLock';
import { exportExpensesCsv, exportExpensesPdf } from '../../src/services/export';
import { useAuthStore } from '../../src/store/authStore';
import { useAppStore } from '../../src/store/appStore';
export default function SettingsScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useAppStore((s) => s.hydrate);

  const [lockEnabled, setLockEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      setLockEnabled(await isAppLockEnabled());
    })();
  }, []);

  const onExportCsv = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const expenses = await listRecentExpenses(500);
      await exportExpensesCsv(expenses);
      setMessage(t('settings.exportDone'));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const onExportPdf = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const expenses = await listRecentExpenses(500);
      await exportExpensesPdf(expenses);
      setMessage(t('settings.exportDone'));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const onSavePin = async () => {
    try {
      await setAppPin(pin);
      setLockEnabled(true);
      setPin('');
      setMessage(t('settings.lockEnabled'));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t('common.error'));
    }
  };

  const onToggleLock = async (value: boolean) => {
    if (!value) {
      await setAppLockEnabled(false);
      setLockEnabled(false);
      setMessage(t('settings.lockDisabled'));
      return;
    }
    setMessage(t('settings.lockNeedPin'));
  };

  const onDeleteData = () => {
    Alert.alert(t('settings.deleteDataTitle'), t('settings.deleteDataBody'), [
      { text: t('common.back'), style: 'cancel' },
      {
        text: t('settings.deleteConfirm'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteAllLocalData();
            await hydrate();
            setMessage(t('settings.dataDeleted'));
          })();
        },
      },
    ]);
  };

  const onDeleteAccount = () => {
    Alert.alert(t('settings.deleteAccountTitle'), t('settings.deleteAccountBody'), [
      { text: t('common.back'), style: 'cancel' },
      {
        text: t('settings.deleteConfirm'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await logout();
            setMessage(t('settings.loggedOut'));
          })();
        },
      },
    ]);
  };

  return (
    <Screen title={t('settings.title')} scroll>
      <Text style={[styles.section, styles.firstSection]}>{t('settings.export')}</Text>
      <Button label={t('settings.exportCsv')} loading={busy} onPress={() => void onExportCsv()} />
      <Button
        label={t('settings.exportPdf')}
        variant="secondary"
        style={styles.gap}
        loading={busy}
        onPress={() => void onExportPdf()}
      />

      <Text style={styles.section}>{t('settings.appLock')}</Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{t('settings.enableLock')}</Text>
        <Switch value={lockEnabled} onValueChange={(v) => void onToggleLock(v)} />
      </View>
      <TextField
        label={t('settings.pin')}
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
      />
      <Button label={t('settings.savePin')} onPress={() => void onSavePin()} />

      <Text style={styles.section}>{t('settings.appearance')}</Text>
      <View style={styles.themeRow}>
        <View style={styles.themeCopy}>
          <Text style={styles.rowLabel}>{t('settings.darkMode')}</Text>
          <Text style={styles.themeHint}>{t('settings.themeHint')}</Text>
        </View>
        <ThemeToggle />
      </View>

      <Text style={styles.section}>{t('settings.account')}</Text>
      {user ? (
        <>
          <Text style={styles.meta}>{user.email}</Text>
          <Button label={t('settings.logout')} variant="ghost" onPress={() => void logout()} />
          <Button
            label={t('settings.deleteAccount')}
            variant="danger"
            style={styles.gap}
            onPress={onDeleteAccount}
          />
        </>
      ) : (
        <Button label={t('auth.login')} onPress={() => router.push('/auth/login' as Href)} />
      )}

      <Button
        label={t('settings.groups')}
        variant="secondary"
        style={styles.gap}
        onPress={() => router.push('/groups' as Href)}
      />

      <Text style={styles.section}>{t('settings.danger')}</Text>
      <Button label={t('settings.deleteData')} variant="danger" onPress={onDeleteData} />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>{t('common.back')}</Text>
      </Pressable>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  section: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  firstSection: { marginTop: spacing.sm },
  gap: { marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  themeCopy: {
    flex: 1,
  },
  rowLabel: { ...typography.body, color: colors.text },
  themeHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  message: { ...typography.caption, color: colors.success, marginTop: spacing.md },
  back: { marginTop: spacing.xl, padding: spacing.sm },
  backText: { color: colors.primary, fontWeight: '700', textAlign: 'center' },
}));
