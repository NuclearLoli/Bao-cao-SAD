import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { ConfirmActionBar } from '@/components/confirm-action-bar';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import {
  DemoTransaction,
  formatMoney,
  useDemoFinance,
} from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';

const filters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'expense', label: 'Chi tiêu' },
  { key: 'income', label: 'Bù quỹ' },
  { key: 'priority', label: 'Ưu tiên' },
] as const;

type FilterKey = (typeof filters)[number]['key'];

export default function TransactionsScreen() {
  const { state: authState } = useAuthSession();
  const { state } = useHousehold();
  const finance = useDemoFinance();
  const navigate = (href: string) => router.push(href as never);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    switch (activeFilter) {
      case 'expense':
        return finance.transactions.filter((transaction) => transaction.type === 'expense');
      case 'income':
        return finance.transactions.filter((transaction) => transaction.type === 'income');
      case 'priority':
        return finance.transactions.filter((transaction) => transaction.amount >= 1000000);
      default:
        return finance.transactions;
    }
  }, [activeFilter, finance.transactions]);

  const expenseCount = useMemo(
    () => finance.transactions.filter((transaction) => transaction.type === 'expense').length,
    [finance.transactions],
  );

  if (authState.status === 'loading') {
    return <LoadingState label="Đang tải account household…" />;
  }
  if (authState.status !== 'authenticated') {
    return <Redirect href="/auth/welcome" />;
  }

  if (state.status === 'loading' || state.status === 'creating') {
    return <LoadingState />;
  }
  if (state.status !== 'ready') {
    return <Redirect href="/" />;
  }
  if (!finance.isReady) {
    return <LoadingState label="Đang tải giao dịch…" />;
  }

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="GIAO DỊCH"
        title="Dòng tiền gần đây"
        subtitle="Danh sách này đã giống app thật hơn: có lọc nhanh, trạng thái rỗng, và xoá giao dịch để số liệu tổng quan cập nhật ngay."
        backLabel="← Về dashboard"
        actionLabel="Thêm mới"
        onActionPress={() => navigate('/transactions/new')}
      />

      <View style={styles.topStrip}>
        <MiniStat label="Tổng giao dịch" value={String(finance.transactions.length)} />
        <MiniStat label="Chi tháng này" value={formatMoney(finance.totalSpent)} />
        <MiniStat label="Khoản chi" value={String(expenseCount)} />
      </View>

      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <Pressable
              key={filter.key}
              accessibilityRole="button"
              onPress={() => setActiveFilter(filter.key)}
              style={[styles.filterChip, active ? styles.filterChipActive : null]}>
              <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.listCard}>
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              isPendingDelete={pendingDeleteId === transaction.id}
              onAskDelete={() => setPendingDeleteId(transaction.id)}
              onCancelDelete={() => setPendingDeleteId(null)}
              onConfirmDelete={() => {
                finance.removeTransaction(transaction.id);
                setPendingDeleteId(null);
              }}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Chưa có giao dịch phù hợp</Text>
            <Text style={styles.emptyText}>
              Hãy thêm giao dịch mới hoặc chuyển bộ lọc khác để xem dữ liệu.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigate('/transactions/new')}
              style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Thêm giao dịch</Text>
            </Pressable>
          </View>
        )}
      </View>

      <PrimaryTabBar />
    </AppScreen>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue}>{value}</Text>
    </View>
  );
}

function TransactionRow({
  transaction,
  isPendingDelete,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  transaction: DemoTransaction;
  isPendingDelete: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionRow}>
        <View style={styles.transactionPill}>
          <Text style={styles.transactionPillText}>
            {transaction.type === 'income' ? 'Bù quỹ' : 'Chi'}
          </Text>
        </View>
        <View style={styles.transactionBody}>
          <Text style={styles.transactionTitle}>{transaction.title}</Text>
          <Text style={styles.transactionMeta}>
            {transaction.category} · {transaction.dateLabel}
          </Text>
          {transaction.note ? <Text style={styles.transactionNote}>{transaction.note}</Text> : null}
        </View>
        <View style={styles.amountCol}>
          <Text
            style={[
              styles.transactionAmount,
              transaction.type === 'income' ? styles.positive : styles.negative,
            ]}>
            {transaction.type === 'income' ? '+' : '-'}
            {formatMoney(transaction.amount)}
          </Text>
          <Pressable accessibilityRole="button" onPress={onAskDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Xoá</Text>
          </Pressable>
        </View>
      </View>

      {isPendingDelete ? (
        <ConfirmActionBar
          title="Xác nhận xoá giao dịch"
          description="Giao dịch này sẽ bị gỡ khỏi danh sách và số dư các quỹ liên quan sẽ được cập nhật lại."
          confirmLabel="Xác nhận xoá"
          tone="danger"
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 18, paddingBottom: 32 },
  topStrip: { flexDirection: 'row', gap: 12 },
  miniStat: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5DF',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  miniStatLabel: { color: '#708078', fontSize: 12, fontWeight: '800', letterSpacing: 0.9 },
  miniStatValue: { color: '#16231C', fontSize: 18, fontWeight: '900', marginTop: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterChip: {
    backgroundColor: '#E9EFEB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: { backgroundColor: '#153E29' },
  filterChipText: { color: '#5D6B63', fontSize: 13, fontWeight: '700' },
  filterChipTextActive: { color: '#FFFFFF' },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5DF',
    borderRadius: 26,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  transactionCard: {
    borderBottomColor: '#E8EDE9',
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  transactionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  transactionPill: {
    backgroundColor: '#E9F4EC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  transactionPillText: { color: '#1D6B41', fontSize: 11, fontWeight: '800' },
  transactionBody: { flex: 1 },
  transactionTitle: { color: '#15211B', fontSize: 15, fontWeight: '800' },
  transactionMeta: { color: '#708078', fontSize: 12, marginTop: 4 },
  transactionNote: { color: '#55645B', fontSize: 13, lineHeight: 19, marginTop: 8 },
  amountCol: { alignItems: 'flex-end', gap: 10 },
  transactionAmount: { fontSize: 14, fontWeight: '900', marginTop: 2, textAlign: 'right' },
  positive: { color: '#0F766E' },
  negative: { color: '#B45309' },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#F3F6F4',
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonText: { color: '#4A5A51', fontSize: 12, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 14 },
  emptyTitle: { color: '#17231D', fontSize: 18, fontWeight: '900' },
  emptyText: { color: '#66756B', fontSize: 14, lineHeight: 22, marginTop: 8, textAlign: 'center' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#153E29',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 50,
    minWidth: 170,
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
