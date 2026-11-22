import { useCallback, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { HkLogo } from '../../src/components/HkLogo';
import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { TextField } from '../../src/components/ui/TextField';
import { radii, spacing, typography } from '../../src/config/theme';
import { makeStyles, useTheme } from '../../src/theme/ThemeProvider';
import * as groupsRepo from '../../src/db/repositories/groupsRepo';
import { useAuthStore } from '../../src/store/authStore';
import {
  createRemoteGroup,
  fetchBalances,
  flushPendingGroupSync,
  joinRemoteGroup,
} from '../../src/services/sync';
import { apiRequest } from '../../src/services/api/client';
import { formatPkr } from '../../src/utils/money';

type GroupCardModel = {
  localId: string;
  serverId: string | null;
  name: string;
  members: Array<{ userId: string; displayName: string }>;
  totalSpentMinor: number;
  yourBalanceMinor: number;
};

export default function GroupsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [cards, setCards] = useState<GroupCardModel[]>([]);
  const [name, setName] = useState('');
  const [invite, setInvite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    try {
      await flushPendingGroupSync();
    } catch {
      // offline — show local cache
    }

    const local = await groupsRepo.listLocalGroups();
    const next: GroupCardModel[] = [];

    for (const g of local) {
      let members: Array<{ userId: string; displayName: string }> = [];
      try {
        const parsed: unknown = JSON.parse(g.membersJson);
        if (Array.isArray(parsed)) {
          members = parsed as Array<{ userId: string; displayName: string }>;
        }
      } catch {
        members = [];
      }

      if (members.length > 0 && !members.some((m) => m.userId === user.id)) {
        continue;
      }

      let totalSpentMinor = 0;
      let yourBalanceMinor = 0;

      if (g.serverId) {
        try {
          const detail = await apiRequest<{
            group: {
              expenses: Array<{ amountMinor: number }>;
            };
          }>(`/groups/${g.serverId}`);
          totalSpentMinor = detail.group.expenses.reduce((sum, e) => sum + e.amountMinor, 0);
          const balances = await fetchBalances(g.serverId);
          yourBalanceMinor = balances.balances[user.id] ?? 0;
        } catch {
          // keep zeros when offline
        }
      }

      next.push({
        localId: g.id,
        serverId: g.serverId,
        name: g.name,
        members,
        totalSpentMinor,
        yourBalanceMinor,
      });
    }

    setCards(next);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        router.replace('/auth/login' as Href);
        return;
      }
      void reload();
    }, [user, router, reload]),
  );

  const onCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      await createRemoteGroup(name.trim());
      setName('');
      setShowCreate(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async () => {
    setBusy(true);
    setError(null);
    try {
      await joinRemoteGroup(invite.trim());
      setInvite('');
      setShowJoin(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const displayName = user?.displayName?.split(' ')[0] ?? 'there';

  return (
    <Screen headerLeft={<HkLogo size={36} />} title="">
      <Text style={styles.welcome}>{t('groups.welcome', { name: displayName })}</Text>
      <Text style={styles.manage}>{t('groups.manage')}</Text>

      <View style={styles.actions}>
        <Button
          label={t('groups.join')}
          variant="ghost"
          style={styles.actionBtn}
          onPress={() => {
            setError(null);
            setShowJoin(true);
          }}
        />
        <Button
          label={t('groups.create')}
          style={styles.actionBtn}
          onPress={() => {
            setError(null);
            setShowCreate(true);
          }}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {cards.length === 0 ? <Text style={styles.empty}>{t('groups.empty')}</Text> : null}

      {cards.map((card) => {
        const balancePositive = card.yourBalanceMinor >= 0;
        return (
          <View key={card.localId} style={styles.card}>
            <Text style={styles.cardTitle}>{card.name}</Text>
            <Text style={styles.cardMeta}>
              {t('groups.memberCount', { count: card.members.length || 1 })}
            </Text>
            <View style={styles.avatars}>
              {(card.members.length ? card.members : [{ userId: 'x', displayName: '?' }])
                .slice(0, 5)
                .map((m) => (
                  <View key={m.userId} style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(m.displayName || '?').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                ))}
            </View>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{t('groups.totalSpent')}</Text>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {formatPkr(card.totalSpentMinor)}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{t('groups.yourBalance')}</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: balancePositive ? colors.success : colors.danger },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {balancePositive ? '+' : ''}
                  {formatPkr(card.yourBalanceMinor)}
                </Text>
              </View>
            </View>
            <Button
              label={t('groups.viewDetails')}
              variant="secondary"
              disabled={!card.serverId}
              onPress={() => {
                if (card.serverId) router.push(`/groups/${card.serverId}` as Href);
              }}
            />
          </View>
        );
      })}

      <Modal
        visible={showCreate}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreate(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('groups.create')}</Text>
            <TextField label={t('groups.name')} value={name} onChangeText={setName} />
            <Button label={t('groups.create')} loading={busy} onPress={() => void onCreate()} />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              style={styles.modalGap}
              onPress={() => setShowCreate(false)}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showJoin}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoin(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('groups.join')}</Text>
            <TextField
              label={t('groups.inviteCode')}
              value={invite}
              onChangeText={setInvite}
              autoCapitalize="characters"
            />
            <Button label={t('groups.join')} loading={busy} onPress={() => void onJoin()} />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              style={styles.modalGap}
              onPress={() => setShowJoin(false)}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  backLink: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  welcome: { ...typography.title, color: colors.text, marginTop: spacing.sm },
  manage: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  actionBtn: { flex: 1 },
  error: { color: colors.danger, marginBottom: spacing.sm },
  empty: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.subtitle, color: colors.text },
  cardMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  avatars: { flexDirection: 'row', marginVertical: spacing.sm, gap: spacing.xs },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: { ...typography.caption, color: colors.text, fontWeight: '700' },
  stats: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.md },
  stat: { flex: 1 },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  statValue: { ...typography.subtitle, color: colors.text, marginTop: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { ...typography.title, color: colors.text, marginBottom: spacing.md },
  modalGap: { marginTop: spacing.sm },
}));
