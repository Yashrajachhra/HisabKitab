import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { AddCategoryField } from '../../src/components/AddCategoryField';
import { Button } from '../../src/components/ui/Button';
import { SettingsButton, ThemeToggle } from '../../src/components/ui/HeaderToggles';
import { PressableScale } from '../../src/components/ui/PressableScale';
import { Screen } from '../../src/components/ui/Screen';
import { TextField } from '../../src/components/ui/TextField';
import { categoryVisual, radii, shadows, spacing, tabular, typography } from '../../src/config/theme';
import { makeStyles, useTheme } from '../../src/theme/ThemeProvider';
import { deleteAllLocalData } from '../../src/db/repositories/dataLifecycle';
import { listRecentExpenses } from '../../src/db/repositories/expensesRepo';
import { isAppLockEnabled, setAppLockEnabled, setAppPin } from '../../src/services/appLock';
import { exportExpensesCsv, exportExpensesPdf } from '../../src/services/export';
import { useAuthStore } from '../../src/store/authStore';
import { useAppStore } from '../../src/store/appStore';
import { currentMonthKey } from '../../src/utils/date';
import { formatPkr } from '../../src/utils/money';
import { getSecureItem, setSecureItem } from '../../src/utils/secureStorage';

type ViewMode = 'profile' | 'settings';

type StudentProfile = {
  displayName: string;
  campus: string;
  hostelRoom: string;
  walletNumber: string;
};

const PROFILE_KEY = 'hk_student_profile';
const AUTH_USER_KEY = 'hk_auth_user';

const EMPTY_PROFILE: StudentProfile = {
  displayName: '',
  campus: '',
  hostelRoom: '',
  walletNumber: '',
};

export default function SettingsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string }>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hydrate = useAppStore((s) => s.hydrate);
  const categories = useAppStore((s) => s.categories);
  const expenses = useAppStore((s) => s.expenses);

  const [activeView, setActiveView] = useState<ViewMode>(
    params.view === 'settings' ? 'settings' : 'profile',
  );
  const [profile, setProfile] = useState<StudentProfile>(EMPTY_PROFILE);
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftCampus, setDraftCampus] = useState('');
  const [draftHostel, setDraftHostel] = useState('');
  const [draftWallet, setDraftWallet] = useState('');

  const [lockEnabled, setLockEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setActiveView(params.view === 'settings' ? 'settings' : 'profile');
  }, [params.view]);

  useEffect(() => {
    void (async () => {
      setLockEnabled(await isAppLockEnabled());
      const raw = await getSecureItem(PROFILE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<StudentProfile>;
          setProfile({
            displayName: parsed.displayName ?? '',
            campus: parsed.campus ?? '',
            hostelRoom: parsed.hostelRoom ?? '',
            walletNumber: parsed.walletNumber ?? '',
          });
        } catch {
          // keep empty profile
        }
      }
    })();
  }, []);

  const effectiveName = (profile.displayName || user?.displayName || '').trim();
  const initial = effectiveName ? effectiveName.charAt(0).toUpperCase() : null;

  const monthSpendMinor = useMemo(() => {
    const month = currentMonthKey();
    return expenses
      .filter((e) => e.date.startsWith(month))
      .reduce((sum, e) => sum + e.amountMinor, 0);
  }, [expenses]);

  const openProfileEditor = () => {
    setDraftName(effectiveName);
    setDraftCampus(profile.campus);
    setDraftHostel(profile.hostelRoom);
    setDraftWallet(profile.walletNumber);
    setMessage(null);
    setEditingProfile(true);
  };

  const onSaveProfile = async () => {
    const cleanName = draftName.trim();
    const next: StudentProfile = {
      displayName: cleanName,
      campus: draftCampus.trim(),
      hostelRoom: draftHostel.trim(),
      walletNumber: draftWallet.trim(),
    };
    setProfile(next);
    await setSecureItem(PROFILE_KEY, JSON.stringify(next));

    if (user && cleanName.length >= 2 && cleanName !== user.displayName) {
      const updatedUser = { ...user, displayName: cleanName };
      useAuthStore.setState({ user: updatedUser });
      await setSecureItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    }

    setEditingProfile(false);
    setMessage('Profile updated.');
  };

  const onExportCsv = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const recent = await listRecentExpenses(500);
      await exportExpensesCsv(recent);
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
      const recent = await listRecentExpenses(500);
      await exportExpensesPdf(recent);
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

  if (activeView === 'profile') {
    return (
      <Screen
        title={t('nav.profile', 'Profile')}
        scroll
        headerRight={
          <SettingsButton
            accessibilityLabel={t('settings.title')}
            onPress={() => {
              setMessage(null);
              setActiveView('settings');
            }}
          />
        }
      >
        {/* 1. User Identity & Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              {initial ? (
                <Text style={styles.avatarInitial}>{initial}</Text>
              ) : (
                <Ionicons name="person-outline" size={30} color={colors.primaryDark} />
              )}
            </View>
            <View style={styles.flex}>
              <Text style={styles.profileName} numberOfLines={1}>
                {effectiveName || 'Student Profile'}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user ? user.email : 'Personal on-device profile'}
              </Text>
              <View style={styles.statusPill}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: user ? colors.success : colors.primary },
                  ]}
                />
                <Text style={styles.statusText}>
                  {user ? 'Synced Account' : 'Local Student Mode'}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              onPress={openProfileEditor}
              style={({ pressed }) => [styles.editPill, pressed ? styles.pressed : null]}
            >
              <Ionicons name="create-outline" size={16} color={colors.primaryDark} />
              <Text style={styles.editPillText}>Edit</Text>
            </Pressable>
          </View>

          {/* Student Details List */}
          <View style={styles.detailsDivider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="person-outline" size={16} color={colors.primaryDark} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.detailLabel}>{t('auth.displayName')}</Text>
              <Text style={styles.detailValue}>{effectiveName || 'Tap Edit to set your name'}</Text>
            </View>
          </View>

          {user ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="mail-outline" size={16} color={colors.primaryDark} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.detailLabel}>{t('auth.email')}</Text>
                <Text style={styles.detailValue}>{user.email}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="school-outline" size={16} color={colors.primaryDark} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.detailLabel}>University / Campus</Text>
              <Text style={styles.detailValue}>
                {profile.campus || 'Not set — tap Edit to add'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="business-outline" size={16} color={colors.primaryDark} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.detailLabel}>Hostel / Room</Text>
              <Text style={styles.detailValue}>
                {profile.hostelRoom || 'Not set — tap Edit to add'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="wallet-outline" size={16} color={colors.primaryDark} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.detailLabel}>JazzCash / Easypaisa Number</Text>
              <Text style={styles.detailValue}>
                {profile.walletNumber || 'Not set — tap Edit to add'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Edit Profile Form (when active) */}
        {editingProfile ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit Profile Details</Text>
            <TextField
              label={t('auth.displayName')}
              value={draftName}
              onChangeText={setDraftName}
              placeholder={t('auth.displayNamePlaceholder')}
            />
            <TextField
              label="University / Campus"
              value={draftCampus}
              onChangeText={setDraftCampus}
              placeholder="e.g. FAST, NUST, LUMS"
            />
            <TextField
              label="Hostel / Room"
              value={draftHostel}
              onChangeText={setDraftHostel}
              placeholder="e.g. Hostel 3, Room 204"
            />
            <TextField
              label="JazzCash / Easypaisa Number"
              value={draftWallet}
              onChangeText={setDraftWallet}
              keyboardType="phone-pad"
              placeholder="e.g. 0300-1234567"
            />
            <View style={styles.editActions}>
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setEditingProfile(false)}
                style={styles.flex}
              />
              <Button
                label="Save Profile"
                onPress={() => void onSaveProfile()}
                style={styles.flex}
              />
            </View>
          </View>
        ) : null}

        {/* 3. Quick Activity Snapshot */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('home.monthTotal')}</Text>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatPkr(monthSpendMinor)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Logged Expenses</Text>
            <Text style={styles.statValue}>{expenses.length}</Text>
          </View>
        </View>

        {/* 4. Account Sign-In / Session Controls */}
        <Text style={styles.section}>{t('settings.account')}</Text>
        <View style={styles.card}>
          {user ? (
            <>
              <Button label={t('settings.logout')} variant="ghost" onPress={() => void logout()} />
              <Button
                label={t('settings.deleteAccount')}
                variant="danger"
                style={styles.gap}
                onPress={onDeleteAccount}
              />
            </>
          ) : (
            <>
              <Text style={styles.accountHint}>{t('auth.loginHint')}</Text>
              <Button
                label={t('auth.login')}
                onPress={() => router.push('/auth/login' as Href)}
              />
              <Button
                label={t('auth.register')}
                variant="ghost"
                style={styles.gap}
                onPress={() => router.push('/auth/register' as Href)}
              />
            </>
          )}
        </View>

        {/* 5. Open App Settings Card */}
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('settings.title')}
          onPress={() => {
            setMessage(null);
            setActiveView('settings');
          }}
          style={styles.settingsLinkCard}
        >
          <View style={styles.settingsLinkIcon}>
            <Ionicons name="settings-outline" size={20} color={colors.primaryDark} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.rowLabel}>{t('settings.title')}</Text>
            <Text style={styles.themeHint}>
              {`${t('settings.appearance')} • ${t('settings.categories')} • ${t('settings.appLock')} • ${t('settings.export')}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </PressableScale>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </Screen>
    );
  }

  return (
    <Screen
      title={t('settings.title')}
      scroll
      onBack={() => {
        setMessage(null);
        if (params.view === 'settings') {
          if (router.canGoBack()) router.back();
          else router.replace('/');
        } else {
          setActiveView('profile');
        }
      }}
    >
      {/* Appearance */}
      <Text style={[styles.section, styles.firstSection]}>{t('settings.appearance')}</Text>
      <View style={styles.themeRow}>
        <View style={styles.themeCopy}>
          <Text style={styles.rowLabel}>{t('settings.darkMode')}</Text>
          <Text style={styles.themeHint}>{t('settings.themeHint')}</Text>
        </View>
        <ThemeToggle />
      </View>

      {/* Categories */}
      <Text style={styles.section}>{t('settings.categories')}</Text>
      <View style={styles.card}>
        <View style={styles.categoryList}>
          {categories.map((category) => {
            const visual = categoryVisual(category);
            return (
              <View key={category.id} style={styles.categoryChip}>
                <View style={[styles.categoryDot, { backgroundColor: visual.color }]} />
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
            );
          })}
        </View>
        <AddCategoryField
          onCreated={() => {
            setMessage(t('settings.categoryAdded'));
          }}
        />
      </View>

      {/* App Lock */}
      <Text style={styles.section}>{t('settings.appLock')}</Text>
      <View style={styles.card}>
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
      </View>

      {/* Export */}
      <Text style={styles.section}>{t('settings.export')}</Text>
      <View style={styles.card}>
        <Button label={t('settings.exportCsv')} loading={busy} onPress={() => void onExportCsv()} />
        <Button
          label={t('settings.exportPdf')}
          variant="secondary"
          style={styles.gap}
          loading={busy}
          onPress={() => void onExportPdf()}
        />
      </View>

      {/* Danger Zone */}
      <Text style={styles.section}>{t('settings.danger')}</Text>
      <View style={styles.card}>
        <Button label={t('settings.deleteData')} variant="danger" onPress={onDeleteData} />
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  flex: { flex: 1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
    ...shadows.soft,
  },
  cardTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.title,
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  profileName: {
    ...typography.title,
    color: colors.text,
  },
  profileEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
  },
  editPillText: {
    ...typography.labelMd,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  detailsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingVertical: 7,
  },
  detailIconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginTop: 1,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    ...shadows.soft,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.title,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
    ...tabular,
  },
  accountHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  settingsLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.md,
    marginTop: spacing.xs,
    ...shadows.soft,
  },
  settingsLinkIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  firstSection: { marginTop: spacing.xs },
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
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  themeCopy: {
    flex: 1,
  },
  rowLabel: {
    ...typography.labelLg,
    color: colors.text,
  },
  themeHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  message: {
    ...typography.labelMd,
    color: colors.primaryDark,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    ...typography.labelMd,
    color: colors.text,
  },
}));
