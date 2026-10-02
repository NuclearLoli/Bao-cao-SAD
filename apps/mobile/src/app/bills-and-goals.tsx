import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import {
  formatMoney,
  useDemoFinance,
} from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';
import { useAppSecurity } from '@/features/security/ui/app-security-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export default function BillsAndGoalsScreen() {
  const { state: authState } = useAuthSession();
  const { state } = useHousehold();
  const finance = useDemoFinance();
  const { formatMoneySecure } = useAppSecurity();
  const navigate = (href: string) => router.push(href as never);

  const [activeTab, setActiveTab] = useState<'bills' | 'goals'>('bills');

  // Form Thêm Hóa đơn
  const [showAddBill, setShowAddBill] = useState(false);
  const [newBillTitle, setNewBillTitle] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDueDay, setNewBillDueDay] = useState('15');
  const [newBillCategory, setNewBillCategory] = useState('Hóa đơn');

  // Form Góp tiền vào mục tiêu
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('500000');

  // Form Thêm Mục tiêu mới
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('Tháng 12/2026');
  const [newGoalEmoji, setNewGoalEmoji] = useState('🎯');

  if (authState.status === 'loading') {
    return <LoadingState label="Đang tải phiên làm việc…" />;
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
    return <LoadingState label="Đang tải danh sách hóa đơn & mục tiêu…" />;
  }

  const handleCreateBill = () => {
    const parsedAmt = Number(newBillAmount.replace(/[^\d]/g, ''));
    if (!newBillTitle.trim() || parsedAmt <= 0) return;

    finance.addBill({
      title: newBillTitle.trim(),
      amount: parsedAmt,
      dueDay: Number(newBillDueDay) || 15,
      fundId: 'fixed',
      category: newBillCategory,
    });

    setNewBillTitle('');
    setNewBillAmount('');
    setShowAddBill(false);
  };

  const handleCreateGoal = () => {
    const parsedTarget = Number(newGoalTarget.replace(/[^\d]/g, ''));
    if (!newGoalTitle.trim() || parsedTarget <= 0) return;

    finance.addGoal({
      title: newGoalTitle.trim(),
      targetAmount: parsedTarget,
      deadlineMonth: newGoalDeadline,
      category: 'Kế hoạch',
      icon: newGoalEmoji || '🎯',
    });

    setNewGoalTitle('');
    setNewGoalTarget('');
    setShowAddGoal(false);
  };

  const handleContribute = (goalId: string) => {
    const amt = Number(contributeAmount.replace(/[^\d]/g, ''));
    if (amt > 0) {
      finance.contributeToGoal(goalId, amt);
      setContributeGoalId(null);
    }
  };

  const unpaidBills = finance.bills.filter((b) => !b.isPaid);
  const totalUnpaidBills = unpaidBills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="RECURRING LIABILITIES & SAVINGS TARGETS"
        title="Hóa đơn & Quỹ Mục tiêu"
        subtitle="Quản lý các khoản chi cố định định kỳ và theo dõi các cột mốc tài chính dài hạn của gia đình."
        backLabel="← Về dashboard"
      />

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <AnimatedPressable
          onPress={() => setActiveTab('bills')}
          style={[styles.tabButton, activeTab === 'bills' ? styles.tabButtonActive : null]}>
          <Ionicons
            name={activeTab === 'bills' ? 'calendar' : 'calendar-outline'}
            size={15}
            color={activeTab === 'bills' ? AnalyticsTheme.colors.cyan : AnalyticsTheme.colors.textMuted}
          />
          <Text style={[styles.tabButtonText, activeTab === 'bills' ? styles.tabButtonTextActive : null]}>
            Hóa đơn ({unpaidBills.length})
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => setActiveTab('goals')}
          style={[styles.tabButton, activeTab === 'goals' ? styles.tabButtonActive : null]}>
          <Ionicons
            name={activeTab === 'goals' ? 'flag' : 'flag-outline'}
            size={15}
            color={activeTab === 'goals' ? AnalyticsTheme.colors.cyan : AnalyticsTheme.colors.textMuted}
          />
          <Text style={[styles.tabButtonText, activeTab === 'goals' ? styles.tabButtonTextActive : null]}>
            Quỹ Mục tiêu ({finance.goals.length})
          </Text>
        </AnimatedPressable>
      </View>

      {/* TAB 1: RECURRING BILLS */}
      {activeTab === 'bills' && (
        <View style={styles.card}>
          <View style={styles.billsSummaryBox}>
            <View>
              <Text style={styles.billsSummaryLabel}>Hóa đơn còn phải đóng tháng này:</Text>
              <Text style={styles.billsSummaryAmount}>{formatMoney(totalUnpaidBills)}</Text>
            </View>
            <AnimatedPressable onPress={() => setShowAddBill(!showAddBill)} style={styles.smallAddBtn}>
              <Text style={styles.smallAddBtnText}>{showAddBill ? 'Đóng' : '+ Thêm bill'}</Text>
            </AnimatedPressable>
          </View>

          {showAddBill && (
            <View style={styles.addForm}>
              <Text style={styles.formTitle}>Thêm hóa đơn định kỳ</Text>
              <TextInput
                onChangeText={setNewBillTitle}
                placeholder="Tên hóa đơn (VD: Tiền điện, Internet...)"
                placeholderTextColor="#64748B"
                style={styles.formInput}
                value={newBillTitle}
              />
              <TextInput
                keyboardType="numeric"
                onChangeText={setNewBillAmount}
                placeholder="Số tiền dự kiến (VD: 1500000)"
                placeholderTextColor="#64748B"
                style={styles.formInput}
                value={newBillAmount}
              />
              <TextInput
                keyboardType="numeric"
                onChangeText={setNewBillDueDay}
                placeholder="Ngày đến hạn trong tháng (1-28)"
                placeholderTextColor="#64748B"
                style={styles.formInput}
                value={newBillDueDay}
              />
              <AnimatedPressable onPress={handleCreateBill} style={styles.submitFormBtn}>
                <Text style={styles.submitFormText}>Lưu hóa đơn</Text>
              </AnimatedPressable>
            </View>
          )}

          <View style={styles.billsList}>
            {finance.bills.map((bill) => (
              <View key={bill.id} style={[styles.billCard, bill.isPaid ? styles.billPaid : null]}>
                <View style={styles.billLeft}>
                  <Text style={styles.billDayBadge}>Ngày {bill.dueDay}</Text>
                  <View style={styles.billTextGroup}>
                    <Text style={[styles.billTitle, bill.isPaid ? styles.lineThrough : null]}>
                      {bill.title}
                    </Text>
                    <Text style={styles.billMeta}>
                      {bill.category} • {formatMoneySecure(bill.amount, formatMoney(bill.amount))}
                      {bill.paidAt ? ` • Đã đóng ngày ${bill.paidAt}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.billRightActions}>
                  {bill.isPaid ? (
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeText}>✓ Đã đóng</Text>
                    </View>
                  ) : (
                    <AnimatedPressable onPress={() => finance.payBill(bill.id)} style={styles.payBtn}>
                      <Text style={styles.payBtnText}>Đóng tiền</Text>
                    </AnimatedPressable>
                  )}
                  <AnimatedPressable onPress={() => finance.deleteBill(bill.id)} style={styles.deleteBillBtn}>
                    <Text style={styles.deleteBillBtnText}>✕</Text>
                  </AnimatedPressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* TAB 2: SAVINGS GOALS */}
      {activeTab === 'goals' && (
        <View style={styles.card}>
          <View style={styles.billsSummaryBox}>
            <View>
              <Text style={styles.billsSummaryLabel}>Tổng mục tiêu đang tích lũy</Text>
              <Text style={styles.billsSummaryAmount}>
                {finance.goals.length} kế hoạch lớn
              </Text>
            </View>
            <AnimatedPressable onPress={() => setShowAddGoal(!showAddGoal)} style={styles.smallAddBtn}>
              <Text style={styles.smallAddBtnText}>{showAddGoal ? 'Đóng' : '+ Tạo mục tiêu'}</Text>
            </AnimatedPressable>
          </View>

          {showAddGoal && (
            <View style={styles.addForm}>
              <Text style={styles.formTitle}>Thiết lập mục tiêu mới</Text>
              <TextInput
                onChangeText={setNewGoalTitle}
                placeholder="Tên mục tiêu (VD: Du lịch Thái Lan...)"
                placeholderTextColor="#64748B"
                style={styles.formInput}
                value={newGoalTitle}
              />
              <TextInput
                keyboardType="numeric"
                onChangeText={setNewGoalTarget}
                placeholder="Số tiền cần đạt (VD: 25000000)"
                placeholderTextColor="#64748B"
                style={styles.formInput}
                value={newGoalTarget}
              />
              <TextInput
                onChangeText={setNewGoalDeadline}
                placeholder="Hạn chót (VD: Tháng 12/2026)"
                placeholderTextColor="#64748B"
                style={styles.formInput}
                value={newGoalDeadline}
              />
              <AnimatedPressable onPress={handleCreateGoal} style={styles.submitFormBtn}>
                <Text style={styles.submitFormText}>Tạo mục tiêu</Text>
              </AnimatedPressable>
            </View>
          )}

          <View style={styles.goalsList}>
            {finance.goals.map((goal) => {
              const progressPct =
                goal.targetAmount > 0 ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100) : 0;

              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalEmoji}>{goal.icon}</Text>
                    <View style={styles.goalHeaderText}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalMeta}>Hạn: {goal.deadlineMonth}</Text>
                    </View>
                    <Text style={styles.goalPct}>{progressPct}%</Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                  </View>

                  <View style={styles.goalBottomRow}>
                    <Text style={styles.goalAmountText}>
                      Đã có: <Text style={styles.boldWhite}>{formatMoneySecure(goal.currentAmount, formatMoney(goal.currentAmount))}</Text> / {formatMoneySecure(goal.targetAmount, formatMoney(goal.targetAmount))}
                    </Text>
                    <View style={styles.goalActionsRow}>
                      <AnimatedPressable
                        onPress={() => setContributeGoalId(contributeGoalId === goal.id ? null : goal.id)}
                        style={styles.contributeBtn}>
                        <Text style={styles.contributeBtnText}>+ Góp thêm</Text>
                      </AnimatedPressable>
                      <AnimatedPressable
                        onPress={() => finance.deleteGoal(goal.id)}
                        style={styles.deleteGoalBtn}>
                        <Text style={styles.deleteGoalBtnText}>✕</Text>
                      </AnimatedPressable>
                    </View>
                  </View>

                  {contributeGoalId === goal.id && (
                    <View style={styles.contributeInputRow}>
                      <TextInput
                        keyboardType="numeric"
                        onChangeText={setContributeAmount}
                        placeholder="Số tiền góp"
                        placeholderTextColor="#64748B"
                        style={styles.contributeField}
                        value={contributeAmount}
                      />
                      <AnimatedPressable
                        onPress={() => handleContribute(goal.id)}
                        style={styles.submitContributeBtn}>
                        <Text style={styles.submitContributeText}>Xác nhận góp</Text>
                      </AnimatedPressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      <PrimaryTabBar />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 16, paddingBottom: 24 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
    marginTop: 10,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 1,
  },
  tabButtonText: { color: AnalyticsTheme.colors.textMuted, fontSize: 12, fontWeight: '700' },
  tabButtonTextActive: { color: AnalyticsTheme.colors.cyan, fontWeight: '800' },

  card: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  billsSummaryBox: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  billsSummaryLabel: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, fontWeight: '700' },
  billsSummaryAmount: { color: AnalyticsTheme.colors.rose, fontSize: 20, fontWeight: '900', marginTop: 2 },
  smallAddBtn: {
    backgroundColor: AnalyticsTheme.colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  smallAddBtnText: { color: '#090D16', fontSize: 12, fontWeight: '800' },

  addForm: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  formTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  formInput: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 13,
    marginBottom: 8,
  },
  submitFormBtn: {
    backgroundColor: AnalyticsTheme.colors.emerald,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  submitFormText: { color: '#090D16', fontSize: 13, fontWeight: '900' },

  billsList: { gap: 8 },
  billCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billPaid: { opacity: 0.6 },
  billLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  billDayBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: AnalyticsTheme.colors.cyan,
    fontWeight: '800',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
  },
  billTextGroup: { flex: 1 },
  billTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 13, fontWeight: '800' },
  lineThrough: { textDecorationLine: 'line-through', color: AnalyticsTheme.colors.textMuted },
  billMeta: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, marginTop: 2 },
  payBtn: {
    backgroundColor: AnalyticsTheme.colors.rose,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  payBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  paidBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  paidBadgeText: { color: AnalyticsTheme.colors.emerald, fontSize: 11, fontWeight: '800' },

  goalsList: { gap: 12 },
  goalCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'center' },
  goalEmoji: { fontSize: 22, marginRight: 8 },
  goalHeaderText: { flex: 1 },
  goalTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  goalMeta: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, marginTop: 1 },
  goalPct: { color: AnalyticsTheme.colors.purple, fontSize: 15, fontWeight: '900' },

  progressTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: AnalyticsTheme.colors.purple, borderRadius: 3 },

  goalBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalAmountText: { color: AnalyticsTheme.colors.textSecondary, fontSize: 11 },
  boldWhite: { fontWeight: '800', color: AnalyticsTheme.colors.textPrimary },
  contributeBtn: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  contributeBtnText: { color: AnalyticsTheme.colors.purple, fontSize: 11, fontWeight: '800' },

  contributeInputRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  contributeField: {
    flex: 1,
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 12,
  },
  submitContributeBtn: {
    backgroundColor: AnalyticsTheme.colors.purple,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 8,
  },
  submitContributeText: { color: '#090D16', fontSize: 11, fontWeight: '900' },
  billRightActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteBillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
  },
  deleteBillBtnText: { color: AnalyticsTheme.colors.rose, fontSize: 10, fontWeight: '800' },
  goalActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteGoalBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
  },
  deleteGoalBtnText: { color: AnalyticsTheme.colors.rose, fontSize: 10, fontWeight: '800' },
});
