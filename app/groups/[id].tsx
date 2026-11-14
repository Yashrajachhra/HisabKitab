import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '../../src/components/ui/Button';
import { Screen } from '../../src/components/ui/Screen';
import { TextField } from '../../src/components/ui/TextField';
import { radii, spacing, typography } from '../../src/config/theme';
import { makeStyles, useTheme } from '../../src/theme/ThemeProvider';
import { equalSplits, percentageSplits } from '../../src/features/groups/simplifyDebts';
import { useAuthStore } from '../../src/store/authStore';
import { apiRequest } from '../../src/services/api/client';
import { fetchBalances, recordSettlement } from '../../src/services/sync';
import { createId } from '../../src/utils/id';
import { formatPkr, parseAmountInput } from '../../src/utils/money';

type Member = { userId: string; displayName: string };
type ExpenseRow = {
  clientId: string;
  amountMinor: number;
  paidBy: string;
  note: string | null;
  date: string;
  splitType: string;
};

type Tab = 'overview' | 'expenses' | 'settle';
type SplitMode = 'equal' | 'custom' | 'percentage';

export default function GroupDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [tab, setTab] = useState<Tab>('overview');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [simplified, setSimplified] = useState<
    Array<{ from: string; to: string; amountMinor: number }>
  >([]);

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [percentShares, setPercentShares] = useState<Record<string, string>>({});

  const [settleFrom, setSettleFrom] = useState('');
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await apiRequest<{
        group: {
          name: string;
          inviteCode: string;
          members: Member[];
          expenses: ExpenseRow[];
        };
      }>(`/groups/${id}`);
      setGroupName(data.group.name);
      setInviteCode(data.group.inviteCode);
      setMembers(data.group.members);
      setExpenses([...data.group.expenses].sort((a, b) => b.date.localeCompare(a.date)));

      const emptyCustom: Record<string, string> = {};
      const emptyPct: Record<string, string> = {};
      const evenPct = data.group.members.length ? Math.floor(100 / data.group.members.length) : 0;
      data.group.members.forEach((m, idx) => {
        emptyCustom[m.userId] = '';
        emptyPct[m.userId] =
          idx === data.group.members.length - 1
            ? String(100 - evenPct * (data.group.members.length - 1))
            : String(evenPct);
      });
      setCustomShares((prev) => (Object.keys(prev).length ? prev : emptyCustom));
      setPercentShares((prev) => (Object.keys(prev).length ? prev : emptyPct));

      setSettleFrom((prev) => prev || data.group.members[0]?.userId || '');
      setSettleTo(
        (prev) => prev || data.group.members[1]?.userId || data.group.members[0]?.userId || '',
      );

      const bal = await fetchBalances(id);
      setBalances(bal.balances);
      setSimplified(bal.simplified);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const nameFor = (userId: string) =>
    members.find((m) => m.userId === userId)?.displayName ?? userId.slice(0, 6);

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amountMinor, 0), [expenses]);

  const yourBalance = user ? (balances[user.id] ?? 0) : 0;

  const buildSplits = (): Array<{ userId: string; amountMinor: number }> | null => {
    const amountMinor = parseAmountInput(amount);
    if (amountMinor === null || amountMinor <= 0) return null;
    const memberIds = members.map((m) => m.userId);

    if (splitMode === 'equal') {
      const map = equalSplits(memberIds, amountMinor);
      return Object.entries(map).map(([userId, share]) => ({ userId, amountMinor: share }));
    }

    if (splitMode === 'percentage') {
      const percents: Record<string, number> = {};
      let sumPct = 0;
      for (const m of members) {
        const n = Number(percentShares[m.userId] ?? 0);
        if (!Number.isFinite(n) || n < 0) return null;
        percents[m.userId] = n;
        sumPct += n;
      }
      if (Math.round(sumPct) !== 100) {
        setError('Percentages must add up to 100.');
        return null;
      }
      const map = percentageSplits(percents, amountMinor);
      return Object.entries(map).map(([userId, share]) => ({ userId, amountMinor: share }));
    }

    // custom PKR amounts
    const splits: Array<{ userId: string; amountMinor: number }> = [];
    let sum = 0;
    for (const m of members) {
      const share = parseAmountInput(customShares[m.userId] ?? '');
      if (share === null || share < 0) return null;
      splits.push({ userId: m.userId, amountMinor: share });
      sum += share;
    }
    if (sum !== amountMinor) {
      setError('Custom shares must equal the total amount.');
      return null;
    }
    return splits;
  };

  const addExpense = async () => {
    if (!user || !id) return;
    const amountMinor = parseAmountInput(amount);
    if (amountMinor === null || amountMinor <= 0) return;
    const splits = buildSplits();
    if (!splits) return;

    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/groups/${id}/expenses`, {
        method: 'POST',
        body: {
          clientId: createId(),
          amountMinor,
          paidBy: user.id,
          splitType: splitMode,
          splits,
          note: note.trim() || null,
          date: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
        },
      });
      setAmount('');
      setNote('');
      await load();
      setTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const onSettle = async () => {
    if (!id || !settleFrom || !settleTo) return;
    const amountMinor = parseAmountInput(settleAmount);
    if (amountMinor === null || amountMinor <= 0) return;
    if (settleFrom === settleTo) {
      setError('Pick two different members.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await recordSettlement({
        serverGroupId: id,
        clientId: createId(),
        fromMember: settleFrom,
        toMember: settleTo,
        amountMinor,
        date: new Date().toISOString().slice(0, 10),
      });
      setSettleAmount('');
      await load();
      setTab('overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const settleSuggested = (transfer: { from: string; to: string; amountMinor: number }) => {
    setSettleFrom(transfer.from);
    setSettleTo(transfer.to);
    setSettleAmount((transfer.amountMinor / 100).toFixed(0));
    setTab('settle');
  };

  return (
    <Screen title={groupName || t('groups.detail')}>
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Text style={styles.back}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.meta}>
        {t('groups.inviteLabel')}: {inviteCode}
      </Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.statLabel}>{t('groups.totalSpent')}</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatPkr(totalSpent)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.statLabel}>{t('groups.yourBalance')}</Text>
          <Text
            style={[styles.statValue, { color: yourBalance >= 0 ? colors.success : colors.danger }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {yourBalance >= 0 ? '+' : ''}
            {formatPkr(yourBalance)}
          </Text>
        </View>
      </View>

      <View style={styles.members}>
        {members.map((m) => (
          <View key={m.userId} style={styles.chip}>
            <Text style={styles.chipText}>{m.displayName}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tabs}>
        {(['overview', 'expenses', 'settle'] as Tab[]).map((key) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key ? styles.tabActive : null]}
          >
            <Text style={[styles.tabLabel, tab === key ? styles.tabLabelActive : null]}>
              {t(`groups.${key}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {tab === 'overview' ? (
        <View>
          <Text style={styles.section}>{t('groups.whoOwes')}</Text>
          {simplified.length === 0 ? (
            <Text style={styles.empty}>{t('groups.settled')}</Text>
          ) : (
            simplified.map((row) => (
              <View key={`${row.from}-${row.to}`} style={styles.debtRow}>
                <Text style={styles.debtText}>
                  {nameFor(row.from)} → {nameFor(row.to)}: {formatPkr(row.amountMinor)}
                </Text>
                <Button
                  label={t('groups.settle')}
                  variant="secondary"
                  onPress={() => settleSuggested(row)}
                />
              </View>
            ))
          )}
        </View>
      ) : null}

      {tab === 'expenses' ? (
        <View>
          <Text style={styles.section}>{t('groups.addShared')}</Text>
          <TextField
            label={t('groups.amount')}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <TextField label={t('groups.note')} value={note} onChangeText={setNote} />

          <Text style={styles.splitLabel}>{t('groups.splitType')}</Text>
          <View style={styles.splitModes}>
            {(['equal', 'custom', 'percentage'] as SplitMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setSplitMode(mode)}
                style={[styles.splitChip, splitMode === mode ? styles.splitChipActive : null]}
              >
                <Text
                  style={[
                    styles.splitChipText,
                    splitMode === mode ? styles.splitChipTextActive : null,
                  ]}
                >
                  {t(
                    mode === 'equal'
                      ? 'groups.splitEqual'
                      : mode === 'custom'
                        ? 'groups.splitCustom'
                        : 'groups.splitPercentage',
                  )}
                </Text>
              </Pressable>
            ))}
          </View>

          {splitMode === 'custom'
            ? members.map((m) => (
                <TextField
                  key={m.userId}
                  label={`${m.displayName} (PKR)`}
                  value={customShares[m.userId] ?? ''}
                  onChangeText={(v) => setCustomShares((prev) => ({ ...prev, [m.userId]: v }))}
                  keyboardType="decimal-pad"
                />
              ))
            : null}

          {splitMode === 'percentage'
            ? members.map((m) => (
                <TextField
                  key={m.userId}
                  label={`${m.displayName} (%)`}
                  value={percentShares[m.userId] ?? ''}
                  onChangeText={(v) => setPercentShares((prev) => ({ ...prev, [m.userId]: v }))}
                  keyboardType="decimal-pad"
                />
              ))
            : null}

          <Button
            label={t('groups.saveExpense')}
            loading={busy}
            onPress={() => void addExpense()}
          />

          <Text style={[styles.section, styles.sectionGap]}>{t('groups.expenses')}</Text>
          {expenses.length === 0 ? (
            <Text style={styles.empty}>{t('groups.empty')}</Text>
          ) : (
            expenses.map((e) => (
              <View key={e.clientId} style={styles.expenseRow}>
                <View style={styles.flex}>
                  <Text style={styles.expenseAmount}>{formatPkr(e.amountMinor)}</Text>
                  <Text style={styles.expenseMeta}>
                    {e.date} · {nameFor(e.paidBy)} · {e.splitType}
                    {e.note ? ` · ${e.note}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      ) : null}

      {tab === 'settle' ? (
        <View>
          <Text style={styles.section}>{t('groups.settleAction')}</Text>
          <Text style={styles.splitLabel}>{t('groups.from')}</Text>
          <View style={styles.splitModes}>
            {members.map((m) => (
              <Pressable
                key={`from-${m.userId}`}
                onPress={() => setSettleFrom(m.userId)}
                style={[styles.splitChip, settleFrom === m.userId ? styles.splitChipActive : null]}
              >
                <Text
                  style={[
                    styles.splitChipText,
                    settleFrom === m.userId ? styles.splitChipTextActive : null,
                  ]}
                >
                  {m.displayName}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.splitLabel}>{t('groups.to')}</Text>
          <View style={styles.splitModes}>
            {members.map((m) => (
              <Pressable
                key={`to-${m.userId}`}
                onPress={() => setSettleTo(m.userId)}
                style={[styles.splitChip, settleTo === m.userId ? styles.splitChipActive : null]}
              >
                <Text
                  style={[
                    styles.splitChipText,
                    settleTo === m.userId ? styles.splitChipTextActive : null,
                  ]}
                >
                  {m.displayName}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextField
            label={t('groups.amount')}
            value={settleAmount}
            onChangeText={setSettleAmount}
            keyboardType="decimal-pad"
          />
          <Button label={t('groups.settleAction')} loading={busy} onPress={() => void onSettle()} />
        </View>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((colors) => ({
  backRow: { marginBottom: spacing.sm },
  back: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  meta: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  statValue: { ...typography.subtitle, color: colors.text, marginTop: 4 },
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.caption, color: colors.text },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  tabLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  tabLabelActive: { color: colors.onPrimary },
  error: { color: colors.danger, marginBottom: spacing.sm },
  section: { ...typography.subtitle, color: colors.text, marginBottom: spacing.sm },
  sectionGap: { marginTop: spacing.lg },
  empty: { ...typography.body, color: colors.textSecondary },
  debtRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  debtText: { ...typography.body, color: colors.text },
  splitLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  splitModes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  splitChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  splitChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  splitChipText: { ...typography.caption, color: colors.textSecondary },
  splitChipTextActive: { color: colors.primary, fontWeight: '700' },
  expenseRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  expenseAmount: { ...typography.subtitle, color: colors.text },
  expenseMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  flex: { flex: 1 },
}));
