import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { ConfirmActionBar } from '@/components/confirm-action-bar';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import {
  DemoFundId,
  DemoPayer,
  DemoSpendingSource,
  DemoTransaction,
  formatMoney,
  useDemoFinance,
} from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';
import { useAppSecurity } from '@/features/security/ui/app-security-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

const filters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'husband', label: '👨 Chồng chi' },
  { key: 'wife', label: '👩 Vợ chi' },
  { key: 'reimbursable', label: '⚡ Ứng trước' },
  { key: 'priority', label: '🔥 Lớn (≥1tr)' },
] as const;

type FilterKey = (typeof filters)[number]['key'];

export default function TransactionsScreen() {
  const { state: authState } = useAuthSession();
  const { state } = useHousehold();
  const finance = useDemoFinance();
  const { formatMoneySecure, togglePrivacyMode, isPrivacyMode } = useAppSecurity();
  const navigate = (href: string) => router.push(href as never);

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<DemoTransaction | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);

  const filteredTransactions = useMemo(() => {
    switch (activeFilter) {
      case 'husband':
        return finance.transactions.filter((t) => t.paidBy === 'husband');
      case 'wife':
        return finance.transactions.filter((t) => t.paidBy === 'wife');
      case 'reimbursable':
        return finance.transactions.filter((t) => t.source === 'reimbursable');
      case 'priority':
        return finance.transactions.filter((t) => t.amount >= 1000000);
      default:
        return finance.transactions;
    }
  }, [activeFilter, finance.transactions]);

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

  const csvContent = finance.exportTransactionsCsv();

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="TRANSACTION ACTIVITY LOG"
        title="Dòng Tiền & Đối Soát"
        subtitle="Theo dõi mọi khoản chi, phân định rõ ai là người trả (Chồng hay Vợ) và nguồn trích từ quỹ chung hay tiền túi ứng trước."
        backLabel="← Về dashboard"
        actionLabel="Thêm mới"
        onActionPress={() => navigate('/transactions/new')}
      />

      <View style={styles.topControlRow}>
        <AnimatedPressable onPress={togglePrivacyMode} style={styles.privacyToggleBtn}>
          <Ionicons
            name={isPrivacyMode ? 'eye-off-outline' : 'eye-outline'}
            size={14}
            color={AnalyticsTheme.colors.cyan}
          />
          <Text style={styles.privacyToggleText}>
            {isPrivacyMode ? 'Ẩn số dư' : 'Hiện số'}
          </Text>
        </AnimatedPressable>
        <AnimatedPressable onPress={() => setShowCsvModal(true)} style={styles.csvExportBtn}>
          <Ionicons name="document-text-outline" size={14} color={AnalyticsTheme.colors.emerald} />
          <Text style={styles.csvExportText}>Xuất CSV</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.topStrip}>
        <MiniStat label="TỔNG SỐ GD" value={String(finance.transactions.length)} />
        <MiniStat
          label="ĐÃ CHI THÁNG"
          value={formatMoneySecure(finance.totalSpent, formatMoney(finance.totalSpent))}
          accent="rose"
        />
        <MiniStat
          label="CHỒNG CHI"
          value={formatMoneySecure(
            finance.settlement.husbandSpentForShared,
            formatMoney(finance.settlement.husbandSpentForShared),
          )}
          accent="cyan"
        />
        <MiniStat
          label="VỢ CHI"
          value={formatMoneySecure(
            finance.settlement.wifeSpentForShared,
            formatMoney(finance.settlement.wifeSpentForShared),
          )}
          accent="emerald"
        />
      </View>

      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <AnimatedPressable
              key={filter.key}
              accessibilityRole="button"
              onPress={() => setActiveFilter(filter.key)}
              style={[styles.filterChip, active ? styles.filterChipActive : null]}>
              <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                {filter.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View style={styles.listCard}>
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((item) => (
            <TransactionRow
              key={item.id}
              transaction={item}
              formatMoneySecure={formatMoneySecure}
              isPendingDelete={pendingDeleteId === item.id}
              onPressEdit={() => setEditingTransaction(item)}
              onAskDelete={() => setPendingDeleteId(item.id)}
              onCancelDelete={() => setPendingDeleteId(null)}
              onConfirmDelete={() => {
                finance.removeTransaction(item.id);
                setPendingDeleteId(null);
              }}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍃</Text>
            <Text style={styles.emptyTitle}>Chưa có giao dịch phù hợp</Text>
            <Text style={styles.emptyText}>
              Thử đổi bộ lọc hoặc bấm nút bên dưới để ghi nhận khoản chi tiêu mới.
            </Text>
            <AnimatedPressable
              accessibilityRole="button"
              onPress={() => navigate('/transactions/new')}
              style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Thêm giao dịch ngay</Text>
            </AnimatedPressable>
          </View>
        )}
      </View>

      {/* Edit Transaction Modal */}
      {editingTransaction ? (
        <TransactionEditModal
          transaction={editingTransaction}
          funds={finance.funds}
          onClose={() => setEditingTransaction(null)}
          onSave={(updated) => {
            finance.updateTransaction(editingTransaction.id, updated);
            setEditingTransaction(null);
          }}
          onDelete={() => {
            finance.removeTransaction(editingTransaction.id);
            setEditingTransaction(null);
          }}
        />
      ) : null}

      {/* CSV Export Modal */}
      <Modal visible={showCsvModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.csvModalCard}>
            <Text style={styles.csvModalTitle}>📄 Dữ Liệu Giao Dịch (CSV)</Text>
            <Text style={styles.csvModalSubtitle}>
              Sao chép nội dung bên dưới để mở trong Microsoft Excel hoặc Google Sheets:
            </Text>
            <ScrollView style={styles.csvScrollView}>
              <Text selectable style={styles.csvCodeText}>
                {csvContent}
              </Text>
            </ScrollView>
            <AnimatedPressable onPress={() => setShowCsvModal(false)} style={styles.closeCsvBtn}>
              <Text style={styles.closeCsvBtnText}>Đóng Lại</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      <PrimaryTabBar />
    </AppScreen>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'cyan' | 'emerald' | 'rose';
}) {
  const valueColor =
    accent === 'cyan'
      ? AnalyticsTheme.colors.cyan
      : accent === 'emerald'
      ? AnalyticsTheme.colors.emerald
      : accent === 'rose'
      ? AnalyticsTheme.colors.rose
      : AnalyticsTheme.colors.textPrimary;

  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={[styles.miniStatValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function TransactionRow({
  transaction,
  formatMoneySecure,
  isPendingDelete,
  onPressEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  transaction: DemoTransaction;
  formatMoneySecure: (amount: number, fallback: string) => string;
  isPendingDelete: boolean;
  onPressEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const payerLabel =
    transaction.paidBy === 'husband'
      ? '👨 Chồng'
      : transaction.paidBy === 'wife'
      ? '👩 Vợ'
      : '👥 Chung';

  const sourceLabel =
    transaction.source === 'reimbursable'
      ? '⚡ Ứng túi'
      : transaction.source === 'pocket_money'
      ? '👛 Riêng'
      : '🏦 Quỹ chung';

  return (
    <View style={styles.transactionCard}>
      <AnimatedPressable onPress={onPressEdit} style={styles.transactionRow}>
        <View
          style={[
            styles.transactionPill,
            transaction.type === 'income' ? styles.pillIncome : styles.pillExpense,
          ]}>
          <Text
            style={[
              styles.transactionPillText,
              transaction.type === 'income' ? styles.pillTextIncome : styles.pillTextExpense,
            ]}>
            {transaction.type === 'income' ? '+' : '-'}
          </Text>
        </View>

        <View style={styles.transactionBody}>
          <Text style={styles.transactionTitle}>{transaction.title}</Text>
          <Text style={styles.transactionMeta}>
            {transaction.category} • {transaction.dateLabel}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.payerBadge}>
              <Text style={styles.payerBadgeText}>{payerLabel}</Text>
            </View>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeText}>{sourceLabel}</Text>
            </View>
            {transaction.receiptUrl ? (
              <View style={styles.receiptBadge}>
                <Text style={styles.receiptBadgeText}>🧾 Bill</Text>
              </View>
            ) : null}
          </View>

          {transaction.note ? <Text style={styles.transactionNote}>{transaction.note}</Text> : null}
        </View>

        <View style={styles.amountCol}>
          <Text
            style={[
              styles.transactionAmount,
              transaction.type === 'income' ? styles.positive : styles.negative,
            ]}>
            {transaction.type === 'income' ? '+' : '-'}
            {formatMoneySecure(transaction.amount, formatMoney(transaction.amount))}
          </Text>
          <View style={styles.rowActions}>
            <AnimatedPressable accessibilityRole="button" onPress={onPressEdit} style={styles.editButton}>
              <Text style={styles.editButtonText}>Sửa</Text>
            </AnimatedPressable>
            <AnimatedPressable accessibilityRole="button" onPress={onAskDelete} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Xoá</Text>
            </AnimatedPressable>
          </View>
        </View>
      </AnimatedPressable>

      {isPendingDelete ? (
        <ConfirmActionBar
          title="Xác nhận xoá giao dịch"
          description="Giao dịch này sẽ bị gỡ khỏi danh sách và số dư các quỹ liên quan sẽ được hoàn trả tự động."
          confirmLabel="Xác nhận xoá"
          tone="danger"
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
        />
      ) : null}
    </View>
  );
}

function TransactionEditModal({
  transaction,
  funds,
  onClose,
  onSave,
  onDelete,
}: {
  transaction: DemoTransaction;
  funds: { id: DemoFundId; name: string }[];
  onClose: () => void;
  onSave: (updated: Partial<DemoTransaction>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(transaction.title);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [category, setCategory] = useState(transaction.category);
  const [fundId, setFundId] = useState<DemoFundId>(transaction.fundId);
  const [paidBy, setPaidBy] = useState<DemoPayer>(transaction.paidBy);
  const [source, setSource] = useState<DemoSpendingSource>(transaction.source);
  const [note, setNote] = useState(transaction.note ?? '');

  const handleSave = () => {
    const num = parseInt(amount.replace(/[^0-9]/g, ''), 10) || transaction.amount;
    onSave({
      title,
      amount: num,
      category,
      fundId,
      paidBy,
      source,
      note,
    });
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.editModalCard}>
          <View style={styles.editModalHeader}>
            <Text style={styles.editModalTitle}>Chỉnh Sửa Giao Dịch</Text>
            <AnimatedPressable onPress={onClose}>
              <Text style={styles.closeModalText}>✕ Đóng</Text>
            </AnimatedPressable>
          </View>

          <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLabel}>TÊN KHOẢN CHI</Text>
            <TextInput style={styles.modalInput} value={title} onChangeText={setTitle} />

            <Text style={styles.modalLabel}>SỐ TIỀN (VNĐ)</Text>
            <TextInput
              style={styles.modalInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>DANH MỤC</Text>
            <TextInput style={styles.modalInput} value={category} onChangeText={setCategory} />

            <Text style={styles.modalLabel}>PHÂN BỔ VÀO QUỸ</Text>
            <View style={styles.choiceRow}>
              {funds.map((f) => {
                const active = fundId === f.id;
                return (
                  <AnimatedPressable
                    key={f.id}
                    onPress={() => setFundId(f.id)}
                    style={[styles.choiceChip, active ? styles.choiceChipActive : null]}>
                    <Text style={[styles.choiceChipText, active ? styles.choiceChipTextActive : null]}>
                      {f.name}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>AI CHI TRẢ</Text>
            <View style={styles.choiceRow}>
              {(['husband', 'wife', 'shared'] as DemoPayer[]).map((p) => {
                const active = paidBy === p;
                const label = p === 'husband' ? '👨 Chồng' : p === 'wife' ? '👩 Vợ' : '👥 Cả hai';
                return (
                  <AnimatedPressable
                    key={p}
                    onPress={() => setPaidBy(p)}
                    style={[styles.choiceChip, active ? styles.choiceChipActive : null]}>
                    <Text style={[styles.choiceChipText, active ? styles.choiceChipTextActive : null]}>
                      {label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>NGUỒN TIỀN</Text>
            <View style={styles.choiceRow}>
              {(['joint_fund', 'pocket_money', 'reimbursable'] as DemoSpendingSource[]).map((s) => {
                const active = source === s;
                const label =
                  s === 'joint_fund'
                    ? '🏦 Quỹ chung'
                    : s === 'pocket_money'
                    ? '👛 Ví riêng'
                    : '⚡ Ứng trước';
                return (
                  <AnimatedPressable
                    key={s}
                    onPress={() => setSource(s)}
                    style={[styles.choiceChip, active ? styles.choiceChipActive : null]}>
                    <Text style={[styles.choiceChipText, active ? styles.choiceChipTextActive : null]}>
                      {label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>GHI CHÚ</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 60 }]}
              value={note}
              onChangeText={setNote}
              multiline
            />

            {/* Audit info */}
            <View style={styles.auditInfoBox}>
              <Text style={styles.auditText}>
                ID: {transaction.id} • Ngày: {transaction.dateLabel}
              </Text>
              {transaction.updatedAt ? (
                <Text style={styles.auditText}>Cập nhật lần cuối: {transaction.updatedAt}</Text>
              ) : null}
            </View>

            <View style={styles.modalActions}>
              <AnimatedPressable onPress={handleSave} style={styles.modalSaveBtn}>
                <Text style={styles.modalSaveBtnText}>💾 Lưu Thay Đổi</Text>
              </AnimatedPressable>
              <AnimatedPressable onPress={onDelete} style={styles.modalDeleteBtn}>
                <Text style={styles.modalDeleteBtnText}>🗑️ Xóa Giao Dịch</Text>
              </AnimatedPressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 16, paddingBottom: 24 },
  topControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privacyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  privacyToggleText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  csvExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  csvExportText: {
    color: AnalyticsTheme.colors.emerald,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  topStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniStat: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: '47%',
    padding: 12,
  },
  miniStatLabel: { color: AnalyticsTheme.colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  miniStatValue: { fontSize: 15, fontWeight: '900', marginTop: 4 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterChipActive: { backgroundColor: '#1E293B', borderColor: AnalyticsTheme.colors.cyan },
  filterChipText: { color: AnalyticsTheme.colors.textSecondary, fontSize: 11, fontWeight: '700' },
  filterChipTextActive: { color: AnalyticsTheme.colors.cyan, fontWeight: '800' },

  listCard: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  transactionCard: {
    borderBottomColor: '#1E293B',
    borderBottomWidth: 1,
    paddingBottom: 14,
  },
  transactionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  transactionPill: {
    borderRadius: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillIncome: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  pillExpense: { backgroundColor: 'rgba(244, 63, 94, 0.15)' },
  transactionPillText: { fontSize: 14, fontWeight: '900' },
  pillTextIncome: { color: AnalyticsTheme.colors.emerald },
  pillTextExpense: { color: AnalyticsTheme.colors.rose },

  transactionBody: { flex: 1 },
  transactionTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  transactionMeta: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  payerBadge: { backgroundColor: '#1E293B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  payerBadgeText: { color: AnalyticsTheme.colors.cyan, fontSize: 10, fontWeight: '800' },
  sourceBadge: { backgroundColor: '#1E293B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sourceBadgeText: { color: AnalyticsTheme.colors.purple, fontSize: 10, fontWeight: '800' },
  receiptBadge: { backgroundColor: '#1E293B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  receiptBadgeText: { color: AnalyticsTheme.colors.amber, fontSize: 10, fontWeight: '800' },
  transactionNote: { color: AnalyticsTheme.colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 4 },

  amountCol: { alignItems: 'flex-end', gap: 6 },
  transactionAmount: { fontSize: 14, fontWeight: '900', marginTop: 2, textAlign: 'right' },
  positive: { color: AnalyticsTheme.colors.emerald },
  negative: { color: AnalyticsTheme.colors.rose },
  rowActions: { flexDirection: 'row', gap: 6 },
  editButton: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  editButtonText: { color: AnalyticsTheme.colors.cyan, fontSize: 10, fontWeight: '800' },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deleteButtonText: { color: AnalyticsTheme.colors.textMuted, fontSize: 10, fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
  emptyText: { color: AnalyticsTheme.colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 4, textAlign: 'center' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.cyan,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 44,
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: '#090D16', fontSize: 13, fontWeight: '900' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  editModalCard: {
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.borderLight,
    borderWidth: 1,
    borderRadius: AnalyticsTheme.borderRadius.large,
    width: '100%',
    maxHeight: '90%',
    padding: 20,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editModalTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  closeModalText: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  editModalScroll: { maxHeight: 520 },
  modalLabel: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choiceChip: {
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  choiceChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: AnalyticsTheme.colors.cyan,
  },
  choiceChipText: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightMedium,
  },
  choiceChipTextActive: {
    color: AnalyticsTheme.colors.cyan,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  auditInfoBox: {
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },
  auditText: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: AnalyticsTheme.colors.emerald,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 46,
  },
  modalSaveBtnText: {
    color: '#062817',
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  modalDeleteBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: AnalyticsTheme.colors.rose,
    borderWidth: 1,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 46,
  },
  modalDeleteBtnText: {
    color: AnalyticsTheme.colors.rose,
    fontSize: 12,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },

  csvModalCard: {
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.borderLight,
    borderWidth: 1,
    borderRadius: AnalyticsTheme.borderRadius.large,
    width: '100%',
    maxHeight: '85%',
    padding: 20,
  },
  csvModalTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  csvModalSubtitle: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  csvScrollView: {
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    maxHeight: 340,
  },
  csvCodeText: {
    color: AnalyticsTheme.colors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  closeCsvBtn: {
    backgroundColor: AnalyticsTheme.colors.cyan,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 46,
    marginTop: 16,
  },
  closeCsvBtnText: {
    color: '#041B2D',
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
});
