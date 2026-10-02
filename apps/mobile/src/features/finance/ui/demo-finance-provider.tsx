import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { sanitizeInput, sanitizeMoneyAmount } from '@/core/security/security-utils';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { useHousehold } from '@/features/household/ui/household-provider';

const FINANCE_STORAGE_PREFIX = 'cashflow.finance.v2';

export type DemoFundId = 'fixed' | 'family' | 'emergency' | 'savings' | 'goals';
export type DemoTransactionType = 'expense' | 'income';
export type DemoPayer = 'husband' | 'wife' | 'shared';
export type DemoSpendingSource = 'joint_fund' | 'pocket_money' | 'reimbursable';

export type DemoFund = {
  id: DemoFundId;
  name: string;
  description: string;
  allocated: number;
  spent: number;
  color: string;
};

export type DemoTransaction = {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: DemoTransactionType;
  fundId: DemoFundId;
  paidBy: DemoPayer;
  source: DemoSpendingSource;
  receiptUrl?: string;
  note?: string;
  dateLabel: string;
  rawBankText?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
};

export type RecurringBill = {
  id: string;
  title: string;
  amount: number;
  dueDay: number;
  fundId: DemoFundId;
  category: string;
  isPaid: boolean;
  paidAt?: string;
};

export type SavingsGoal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadlineMonth: string;
  category: string;
  icon: string;
};

export type WeeklyCheckInRecord = {
  id: string;
  weekLabel: string;
  totalSpent: number;
  topExpenseTitle: string;
  topExpenseAmount: number;
  burnRateStatus: 'safe' | 'warning' | 'danger';
  agreedBy: string;
  agreedAt: string;
  tradeOffDecision?: string;
};

export type CoupleFinances = {
  husbandIncome: number;
  wifeIncome: number;
  husbandPocketMoney: number;
  wifePocketMoney: number;
  husbandPocketSpent: number;
  wifePocketSpent: number;
};

export type DemoFinanceSnapshot = {
  householdId: string;
  monthlyIncome: number;
  couple: CoupleFinances;
  funds: DemoFund[];
  transactions: DemoTransaction[];
  bills: RecurringBill[];
  goals: SavingsGoal[];
  checkInRecords: WeeklyCheckInRecord[];
};

export type AddDemoTransactionInput = {
  title: string;
  category: string;
  amount: number;
  type: DemoTransactionType;
  fundId: DemoFundId;
  paidBy?: DemoPayer;
  source?: DemoSpendingSource;
  receiptUrl?: string;
  note?: string;
  rawBankText?: string;
};

export type DemoBudgetSetupInput = {
  monthlyIncome?: number;
  husbandIncome?: number;
  wifeIncome?: number;
  husbandPocketMoney?: number;
  wifePocketMoney?: number;
  allocations: Record<DemoFundId, number>;
};

export type DemoFinanceContextValue = {
  funds: DemoFund[];
  transactions: DemoTransaction[];
  bills: RecurringBill[];
  goals: SavingsGoal[];
  checkInRecords: WeeklyCheckInRecord[];
  couple: CoupleFinances;
  monthlyIncome: number;
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  householdPulse: string;
  isReady: boolean;
  settlement: {
    husbandSpentForShared: number;
    wifeSpentForShared: number;
    totalSharedSpent: number;
    difference: number;
  };
  addTransaction: (input: AddDemoTransactionInput) => void;
  updateTransaction: (transactionId: string, input: Partial<AddDemoTransactionInput>) => void;
  updateBudgetSetup: (input: DemoBudgetSetupInput) => void;
  removeTransaction: (transactionId: string) => void;
  payBill: (billId: string) => void;
  toggleBill: (billId: string) => void;
  addBill: (bill: Omit<RecurringBill, 'id' | 'isPaid'>) => void;
  deleteBill: (billId: string) => void;
  contributeToGoal: (goalId: string, amount: number) => void;
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  deleteGoal: (goalId: string) => void;
  confirmWeeklyCheckIn: (input: { tradeOffDecision?: string; agreedBy: string }) => void;
  exportTransactionsCsv: () => string;
  resetDemoData: () => void;
};

const DemoFinanceContext = createContext<DemoFinanceContextValue | null>(null);

function createSharedDemoSnapshot(householdId: string): DemoFinanceSnapshot {
  return {
    householdId,
    monthlyIncome: 35000000,
    couple: {
      husbandIncome: 20000000,
      wifeIncome: 15000000,
      husbandPocketMoney: 3000000,
      wifePocketMoney: 3000000,
      husbandPocketSpent: 1250000,
      wifePocketSpent: 980000,
    },
    funds: [
      {
        id: 'fixed',
        name: 'Quỹ cố định',
        description: 'Tiền nhà, điện nước, internet, học phí, bảo hiểm.',
        allocated: 13000000,
        spent: 8550000,
        color: '#1D8348',
      },
      {
        id: 'family',
        name: 'Quỹ gia đình & con',
        description: 'Ăn uống, sinh hoạt, tã sữa, y tế, mua sắm hàng ngày.',
        allocated: 10000000,
        spent: 6420000,
        color: '#0F766E',
      },
      {
        id: 'emergency',
        name: 'Quỹ dự phòng',
        description: 'Đệm an toàn tích lũy 3-6 tháng chi phí thiết yếu.',
        allocated: 3500000,
        spent: 500000,
        color: '#B45309',
      },
      {
        id: 'savings',
        name: 'Quỹ tiết kiệm',
        description: 'Khoản để dành đều mỗi tháng cho kế hoạch tương lai.',
        allocated: 1500000,
        spent: 0,
        color: '#2563EB',
      },
      {
        id: 'goals',
        name: 'Quỹ mục tiêu',
        description: 'Du lịch hè, quỹ đổi xe, thiết bị mới cho gia đình.',
        allocated: 1000000,
        spent: 450000,
        color: '#7C3AED',
      },
    ],
    bills: [
      {
        id: 'bill_1',
        title: 'Tiền thuê căn hộ / Phí quản lý',
        amount: 6000000,
        dueDay: 5,
        fundId: 'fixed',
        category: 'Nhà ở',
        isPaid: true,
        paidAt: '05/10/2026',
      },
      {
        id: 'bill_2',
        title: 'Học phí mầm non cho bé Bơ',
        amount: 3500000,
        dueDay: 10,
        fundId: 'fixed',
        category: 'Giáo dục',
        isPaid: false,
      },
      {
        id: 'bill_3',
        title: 'Điện lực EVN & Nước sinh hoạt',
        amount: 1450000,
        dueDay: 15,
        fundId: 'fixed',
        category: 'Hóa đơn',
        isPaid: false,
      },
      {
        id: 'bill_4',
        title: 'Internet cáp quang Viettel',
        amount: 280000,
        dueDay: 20,
        fundId: 'fixed',
        category: 'Hóa đơn',
        isPaid: false,
      },
    ],
    goals: [
      {
        id: 'goal_1',
        title: 'Du lịch gia đình Đà Lạt / Phú Quốc',
        targetAmount: 15000000,
        currentAmount: 9500000,
        deadlineMonth: 'Tháng 12/2026',
        category: 'Nghỉ dưỡng',
        icon: '🏖️',
      },
      {
        id: 'goal_2',
        title: 'Quỹ dự phòng an toàn 6 tháng',
        targetAmount: 60000000,
        currentAmount: 32000000,
        deadlineMonth: 'Tháng 06/2027',
        category: 'An toàn',
        icon: '🛡️',
      },
      {
        id: 'goal_3',
        title: 'Mua máy giặt sấy mới',
        targetAmount: 18000000,
        currentAmount: 7000000,
        deadlineMonth: 'Tháng 11/2026',
        category: 'Thiết bị',
        icon: '🧺',
      },
    ],
    transactions: [
      {
        id: 'txn_1',
        title: 'Tiền thuê căn hộ đầu tháng',
        category: 'Nhà ở',
        amount: 6000000,
        type: 'expense',
        fundId: 'fixed',
        paidBy: 'husband',
        source: 'joint_fund',
        note: 'Chuyển khoản chủ nhà',
        dateLabel: '05/10, 09:15',
      },
      {
        id: 'txn_2',
        title: 'Đi siêu thị WinMart cả tuần',
        category: 'Ăn uống',
        amount: 1250000,
        type: 'expense',
        fundId: 'family',
        paidBy: 'wife',
        source: 'joint_fund',
        note: 'Thịt cá, rau củ và sữa chua',
        dateLabel: 'Hôm qua, 18:30',
      },
      {
        id: 'txn_3',
        title: 'Mua tã bỉm & sữa bột cho bé',
        category: 'Con cái',
        amount: 980000,
        type: 'expense',
        fundId: 'family',
        paidBy: 'wife',
        source: 'joint_fund',
        note: 'Shop Con Cưng',
        dateLabel: '03/10, 16:40',
      },
      {
        id: 'txn_4',
        title: 'Bảo dưỡng xe máy gia đình',
        category: 'Di chuyển',
        amount: 450000,
        type: 'expense',
        fundId: 'fixed',
        paidBy: 'husband',
        source: 'reimbursable',
        note: 'Chồng ứng tiền túi ra sửa xe',
        dateLabel: '02/10, 11:20',
      },
      {
        id: 'txn_5',
        title: 'Góp thêm vào quỹ du lịch',
        category: 'Mục tiêu',
        amount: 450000,
        type: 'expense',
        fundId: 'goals',
        paidBy: 'shared',
        source: 'joint_fund',
        note: 'Trích từ thưởng quý',
        dateLabel: '01/10, 20:00',
      },
    ],
    checkInRecords: [
      {
        id: 'checkin_w1',
        weekLabel: 'Tuần 1 Tháng 10',
        totalSpent: 8680000,
        topExpenseTitle: 'Tiền thuê căn hộ đầu tháng',
        topExpenseAmount: 6000000,
        burnRateStatus: 'safe',
        agreedBy: 'Chồng & Vợ',
        agreedAt: '04/10/2026',
        tradeOffDecision: 'Đã thanh toán khoản cố định lớn, các tuần sau chi tiêu bình thường.',
      },
    ],
  };
}

function createBlankSnapshot(householdId: string): DemoFinanceSnapshot {
  return {
    householdId,
    monthlyIncome: 0,
    couple: {
      husbandIncome: 0,
      wifeIncome: 0,
      husbandPocketMoney: 0,
      wifePocketMoney: 0,
      husbandPocketSpent: 0,
      wifePocketSpent: 0,
    },
    funds: [
      {
        id: 'fixed',
        name: 'Quỹ cố định',
        description: 'Tiền nhà, điện nước, internet, học phí.',
        allocated: 0,
        spent: 0,
        color: '#1D8348',
      },
      {
        id: 'family',
        name: 'Quỹ gia đình & con',
        description: 'Ăn uống, nhu yếu phẩm, sinh hoạt gia đình.',
        allocated: 0,
        spent: 0,
        color: '#0F766E',
      },
      {
        id: 'emergency',
        name: 'Quỹ dự phòng',
        description: 'Phòng trường hợp phát sinh trong tháng.',
        allocated: 0,
        spent: 0,
        color: '#B45309',
      },
      {
        id: 'savings',
        name: 'Quỹ tiết kiệm',
        description: 'Để dành cho các mục tiêu tài chính dài hạn.',
        allocated: 0,
        spent: 0,
        color: '#2563EB',
      },
      {
        id: 'goals',
        name: 'Quỹ mục tiêu',
        description: 'Du lịch, tiết kiệm dài hạn, mua sắm lớn.',
        allocated: 0,
        spent: 0,
        color: '#7C3AED',
      },
    ],
    bills: [],
    goals: [],
    transactions: [],
    checkInRecords: [],
  };
}

function createInitialSnapshot(householdId: string, storageScopeKey: string): DemoFinanceSnapshot {
  return storageScopeKey === 'shared-demo-household'
    ? createSharedDemoSnapshot(householdId)
    : createBlankSnapshot(householdId);
}

export function DemoFinanceProvider({ children }: PropsWithChildren) {
  const { state } = useHousehold();
  const { storageScopeKey } = useAuthSession();
  const [snapshot, setSnapshot] = useState<DemoFinanceSnapshot | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const activeHouseholdId = state.status === 'ready' ? state.aggregate.household.id : null;
  const storageKey =
    activeHouseholdId && storageScopeKey
      ? `${FINANCE_STORAGE_PREFIX}.${storageScopeKey}.${activeHouseholdId}`
      : null;

  useEffect(() => {
    let active = true;

    if (!activeHouseholdId || !storageScopeKey || !storageKey) {
      return () => {
        active = false;
      };
    }

    void AsyncStorage.getItem(storageKey).then((serialized) => {
      if (!active) {
        return;
      }

      if (!serialized) {
        setSnapshot(createInitialSnapshot(activeHouseholdId, storageScopeKey));
        setLoadedKey(storageKey);
        return;
      }

      try {
        const parsed = JSON.parse(serialized) as DemoFinanceSnapshot;
        if (parsed.householdId !== activeHouseholdId) {
          setSnapshot(createInitialSnapshot(activeHouseholdId, storageScopeKey));
        } else {
          // Bổ sung các trường v2 nếu data cũ chưa có
          const upgraded: DemoFinanceSnapshot = {
            ...createSharedDemoSnapshot(activeHouseholdId),
            ...parsed,
            couple: parsed.couple ?? createSharedDemoSnapshot(activeHouseholdId).couple,
            bills: parsed.bills ?? createSharedDemoSnapshot(activeHouseholdId).bills,
            goals: parsed.goals ?? createSharedDemoSnapshot(activeHouseholdId).goals,
            checkInRecords: parsed.checkInRecords ?? createSharedDemoSnapshot(activeHouseholdId).checkInRecords,
          };
          setSnapshot(upgraded);
        }
      } catch {
        setSnapshot(createInitialSnapshot(activeHouseholdId, storageScopeKey));
      }
      setLoadedKey(storageKey);
    });

    return () => {
      active = false;
    };
  }, [activeHouseholdId, storageKey, storageScopeKey]);

  const isReady = Boolean(storageKey) && loadedKey === storageKey;
  const activeSnapshot = isReady ? snapshot : null;

  useEffect(() => {
    if (!storageKey || !activeSnapshot || !isReady) {
      return;
    }

    void AsyncStorage.setItem(storageKey, JSON.stringify(activeSnapshot));
  }, [activeSnapshot, isReady, storageKey]);

  const value = useMemo<DemoFinanceContextValue>(() => {
    const funds = activeSnapshot?.funds ?? [];
    const transactions = activeSnapshot?.transactions ?? [];
    const bills = activeSnapshot?.bills ?? [];
    const goals = activeSnapshot?.goals ?? [];
    const checkInRecords = activeSnapshot?.checkInRecords ?? [];
    const couple = activeSnapshot?.couple ?? {
      husbandIncome: 0,
      wifeIncome: 0,
      husbandPocketMoney: 0,
      wifePocketMoney: 0,
      husbandPocketSpent: 0,
      wifePocketSpent: 0,
    };
    const monthlyIncome = activeSnapshot?.monthlyIncome ?? (couple.husbandIncome + couple.wifeIncome);
    const totalBudgeted = funds.reduce((sum, fund) => sum + fund.allocated, 0);
    const totalSpent = funds.reduce((sum, fund) => sum + fund.spent, 0);
    const remainingBudget = totalBudgeted - totalSpent;

    // Tính toán đối soát đóng góp Chồng / Vợ
    const husbandSpentForShared = transactions
      .filter((t) => t.type === 'expense' && (t.paidBy === 'husband' || t.source === 'reimbursable'))
      .reduce((sum, t) => sum + t.amount, 0);

    const wifeSpentForShared = transactions
      .filter((t) => t.type === 'expense' && t.paidBy === 'wife' && t.source !== 'pocket_money')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSharedSpent = husbandSpentForShared + wifeSpentForShared;
    const difference = Math.abs(husbandSpentForShared - wifeSpentForShared);

    const hottestFund = funds.reduce<DemoFund | null>((selected, fund) => {
      if (!selected) {
        return fund;
      }
      const selectedRatio = selected.allocated > 0 ? selected.spent / selected.allocated : 0;
      const currentRatio = fund.allocated > 0 ? fund.spent / fund.allocated : 0;
      return currentRatio > selectedRatio ? fund : selected;
    }, null);

    return {
      funds,
      transactions,
      bills,
      goals,
      checkInRecords,
      couple,
      monthlyIncome,
      totalBudgeted,
      totalSpent,
      remainingBudget,
      isReady,
      settlement: {
        husbandSpentForShared,
        wifeSpentForShared,
        totalSharedSpent,
        difference,
      },
      householdPulse:
        hottestFund && hottestFund.allocated > 0
          ? `${hottestFund.name} đã dùng ${Math.round((hottestFund.spent / hottestFund.allocated) * 100)}% ngân sách.`
          : 'Hãy thiết lập ngân sách và nhịp nhận lương để quản lý dòng tiền gia đình hiệu quả.',
      addTransaction: (input) => {
        setSnapshot((current) => {
          if (!current || !activeHouseholdId) {
            return current;
          }

          const amountValidation = sanitizeMoneyAmount(input.amount);
          const cleanAmount = amountValidation.valid ? amountValidation.value : Math.max(1, input.amount);
          const cleanTitle = sanitizeInput(input.title) || 'Khoản chi tiêu';
          const cleanCategory = sanitizeInput(input.category) || 'Sinh hoạt';
          const cleanNote = input.note ? sanitizeInput(input.note) : undefined;

          const paidBy = input.paidBy ?? 'shared';
          const source = input.source ?? 'joint_fund';

          const nextTransaction: DemoTransaction = {
            id: `txn_${Date.now()}`,
            title: cleanTitle,
            category: cleanCategory,
            amount: cleanAmount,
            type: input.type,
            fundId: input.fundId,
            paidBy,
            source,
            receiptUrl: input.receiptUrl,
            note: cleanNote,
            rawBankText: input.rawBankText,
            dateLabel: 'Vừa xong',
            createdAt: new Date().toISOString(),
          };

          // Nếu chi từ tiêu vặt riêng (pocket money)
          let nextCouple = { ...current.couple };
          if (source === 'pocket_money') {
            if (paidBy === 'husband') {
              nextCouple.husbandPocketSpent += cleanAmount;
            } else if (paidBy === 'wife') {
              nextCouple.wifePocketSpent += cleanAmount;
            }
          }

          const nextFunds = current.funds.map((fund) => {
            if (fund.id !== input.fundId) {
              return fund;
            }

            if (input.type === 'income') {
              return {
                ...fund,
                allocated: fund.allocated + cleanAmount,
              };
            }

            return {
              ...fund,
              spent: fund.spent + cleanAmount,
            };
          });

          return {
            ...current,
            couple: nextCouple,
            funds: nextFunds,
            transactions: [nextTransaction, ...current.transactions],
          };
        });
      },
      updateTransaction: (transactionId, input) => {
        setSnapshot((current) => {
          if (!current || !activeHouseholdId) {
            return current;
          }

          const existing = current.transactions.find((t) => t.id === transactionId);
          if (!existing) {
            return current;
          }

          // 1. Hoàn tác ảnh hưởng của giao dịch cũ
          let rollbackCouple = { ...current.couple };
          if (existing.source === 'pocket_money') {
            if (existing.paidBy === 'husband') {
              rollbackCouple.husbandPocketSpent = Math.max(0, rollbackCouple.husbandPocketSpent - existing.amount);
            } else if (existing.paidBy === 'wife') {
              rollbackCouple.wifePocketSpent = Math.max(0, rollbackCouple.wifePocketSpent - existing.amount);
            }
          }

          let rollbackFunds = current.funds.map((fund) => {
            if (fund.id !== existing.fundId) return fund;
            if (existing.type === 'income') {
              return { ...fund, allocated: Math.max(0, fund.allocated - existing.amount) };
            }
            return { ...fund, spent: Math.max(0, fund.spent - existing.amount) };
          });

          // 2. Tính toán giá trị mới đã sanitize
          const nextAmount = input.amount !== undefined ? (sanitizeMoneyAmount(input.amount).valid ? sanitizeMoneyAmount(input.amount).value : existing.amount) : existing.amount;
          const nextTitle = input.title !== undefined ? (sanitizeInput(input.title) || existing.title) : existing.title;
          const nextCategory = input.category !== undefined ? (sanitizeInput(input.category) || existing.category) : existing.category;
          const nextType = input.type ?? existing.type;
          const nextFundId = input.fundId ?? existing.fundId;
          const nextPaidBy = input.paidBy ?? existing.paidBy;
          const nextSource = input.source ?? existing.source;
          const nextNote = input.note !== undefined ? (input.note ? sanitizeInput(input.note) : undefined) : existing.note;

          const updatedTransaction: DemoTransaction = {
            ...existing,
            title: nextTitle,
            category: nextCategory,
            amount: nextAmount,
            type: nextType,
            fundId: nextFundId,
            paidBy: nextPaidBy,
            source: nextSource,
            note: nextNote,
            receiptUrl: input.receiptUrl !== undefined ? input.receiptUrl : existing.receiptUrl,
            updatedAt: new Date().toISOString(),
          };

          // 3. Áp dụng ảnh hưởng của giao dịch mới
          if (nextSource === 'pocket_money') {
            if (nextPaidBy === 'husband') {
              rollbackCouple.husbandPocketSpent += nextAmount;
            } else if (nextPaidBy === 'wife') {
              rollbackCouple.wifePocketSpent += nextAmount;
            }
          }

          const appliedFunds = rollbackFunds.map((fund) => {
            if (fund.id !== nextFundId) return fund;
            if (nextType === 'income') {
              return { ...fund, allocated: fund.allocated + nextAmount };
            }
            return { ...fund, spent: fund.spent + nextAmount };
          });

          return {
            ...current,
            couple: rollbackCouple,
            funds: appliedFunds,
            transactions: current.transactions.map((t) => (t.id === transactionId ? updatedTransaction : t)),
          };
        });
      },
      updateBudgetSetup: (input) => {
        setSnapshot((current) => {
          if (!current) {
            return current;
          }

          const husbandInc = input.husbandIncome ?? current.couple.husbandIncome;
          const wifeInc = input.wifeIncome ?? current.couple.wifeIncome;
          const totalInc = input.monthlyIncome ?? (husbandInc + wifeInc);

          return {
            ...current,
            monthlyIncome: totalInc,
            couple: {
              ...current.couple,
              husbandIncome: husbandInc,
              wifeIncome: wifeInc,
              husbandPocketMoney: input.husbandPocketMoney ?? current.couple.husbandPocketMoney,
              wifePocketMoney: input.wifePocketMoney ?? current.couple.wifePocketMoney,
            },
            funds: current.funds.map((fund) => ({
              ...fund,
              allocated: input.allocations[fund.id] ?? fund.allocated,
            })),
          };
        });
      },
      removeTransaction: (transactionId) => {
        setSnapshot((current) => {
          if (!current) {
            return current;
          }

          const transaction = current.transactions.find((item) => item.id === transactionId);
          if (!transaction) {
            return current;
          }

          return {
            ...current,
            funds: current.funds.map((fund) => {
              if (fund.id !== transaction.fundId) {
                return fund;
              }

              if (transaction.type === 'income') {
                return {
                  ...fund,
                  allocated: Math.max(0, fund.allocated - transaction.amount),
                };
              }

              return {
                ...fund,
                spent: Math.max(0, fund.spent - transaction.amount),
              };
            }),
            transactions: current.transactions.filter((item) => item.id !== transactionId),
          };
        });
      },
      payBill: (billId) => {
        setSnapshot((current) => {
          if (!current) {
            return current;
          }

          const bill = current.bills.find((b) => b.id === billId);
          if (!bill || bill.isPaid) {
            return current;
          }

          const updatedBills = current.bills.map((b) =>
            b.id === billId
              ? { ...b, isPaid: true, paidAt: new Date().toLocaleDateString('vi-VN') }
              : b,
          );

          // Tự động sinh transaction thanh toán hóa đơn
          const billTxn: DemoTransaction = {
            id: `txn_bill_${Date.now()}`,
            title: `Thanh toán: ${bill.title}`,
            category: bill.category,
            amount: bill.amount,
            type: 'expense',
            fundId: bill.fundId,
            paidBy: 'shared',
            source: 'joint_fund',
            dateLabel: 'Vừa xong',
            note: 'Tự động ghi nhận khi thanh toán hóa đơn định kỳ',
          };

          const updatedFunds = current.funds.map((f) =>
            f.id === bill.fundId ? { ...f, spent: f.spent + bill.amount } : f,
          );

          return {
            ...current,
            bills: updatedBills,
            funds: updatedFunds,
            transactions: [billTxn, ...current.transactions],
          };
        });
      },
      toggleBill: (billId) => {
        setSnapshot((current) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            bills: current.bills.map((b) => (b.id === billId ? { ...b, isPaid: !b.isPaid } : b)),
          };
        });
      },
      addBill: (billInput) => {
        setSnapshot((current) => {
          if (!current) {
            return current;
          }
          const cleanTitle = sanitizeInput(billInput.title) || 'Hóa đơn định kỳ';
          const cleanCategory = sanitizeInput(billInput.category) || 'Cố định';
          const amountValid = sanitizeMoneyAmount(billInput.amount);
          const cleanAmount = amountValid.valid ? amountValid.value : Math.max(1, billInput.amount);
          const newBill: RecurringBill = {
            ...billInput,
            id: `bill_${Date.now()}`,
            title: cleanTitle,
            category: cleanCategory,
            amount: cleanAmount,
            isPaid: false,
          };
          return {
            ...current,
            bills: [...current.bills, newBill],
          };
        });
      },
      deleteBill: (billId) => {
        setSnapshot((current) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            bills: current.bills.filter((b) => b.id !== billId),
          };
        });
      },
      contributeToGoal: (goalId, amount) => {
        setSnapshot((current) => {
          if (!current || amount <= 0) {
            return current;
          }

          const goal = current.goals.find((g) => g.id === goalId);
          if (!goal) {
            return current;
          }

          const updatedGoals = current.goals.map((g) =>
            g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g,
          );

          // Tạo transaction ghi vào quỹ mục tiêu
          const goalTxn: DemoTransaction = {
            id: `txn_goal_${Date.now()}`,
            title: `Góp tích lũy: ${goal.title}`,
            category: 'Mục tiêu',
            amount,
            type: 'expense',
            fundId: 'goals',
            paidBy: 'shared',
            source: 'joint_fund',
            dateLabel: 'Vừa xong',
            createdAt: new Date().toISOString(),
          };

          const updatedFunds = current.funds.map((f) =>
            f.id === 'goals' ? { ...f, spent: f.spent + amount } : f,
          );

          return {
            ...current,
            goals: updatedGoals,
            funds: updatedFunds,
            transactions: [goalTxn, ...current.transactions],
          };
        });
      },
      addGoal: (goalInput) => {
        setSnapshot((current) => {
          if (!current) {
            return current;
          }
          const cleanTitle = sanitizeInput(goalInput.title) || 'Mục tiêu tài chính';
          const cleanCategory = sanitizeInput(goalInput.category) || 'Tích lũy';
          const amountValid = sanitizeMoneyAmount(goalInput.targetAmount);
          const cleanTarget = amountValid.valid ? amountValid.value : Math.max(100000, goalInput.targetAmount);
          const newGoal: SavingsGoal = {
            ...goalInput,
            id: `goal_${Date.now()}`,
            title: cleanTitle,
            category: cleanCategory,
            targetAmount: cleanTarget,
            currentAmount: 0,
          };
          return {
            ...current,
            goals: [...current.goals, newGoal],
          };
        });
      },
      deleteGoal: (goalId) => {
        setSnapshot((current) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            goals: current.goals.filter((g) => g.id !== goalId),
          };
        });
      },
      confirmWeeklyCheckIn: (input) => {
        setSnapshot((current) => {
          if (!current) {
            return current;
          }

          // Lấy top chi tiêu
          const topTxn = [...current.transactions]
            .filter((t) => t.type === 'expense')
            .sort((a, b) => b.amount - a.amount)[0];

          const weeklySpent = current.funds.reduce((sum, f) => sum + f.spent, 0);

          const record: WeeklyCheckInRecord = {
            id: `checkin_${Date.now()}`,
            weekLabel: `Tuần ${Math.ceil(new Date().getDate() / 7)} Tháng ${new Date().getMonth() + 1}`,
            totalSpent: weeklySpent,
            topExpenseTitle: topTxn ? topTxn.title : 'Chưa có khoản lớn',
            topExpenseAmount: topTxn ? topTxn.amount : 0,
            burnRateStatus: weeklySpent > current.monthlyIncome * 0.75 ? 'danger' : 'safe',
            agreedBy: input.agreedBy,
            agreedAt: new Date().toLocaleDateString('vi-VN'),
            tradeOffDecision: input.tradeOffDecision,
          };

          return {
            ...current,
            checkInRecords: [record, ...current.checkInRecords],
          };
        });
      },
      exportTransactionsCsv: () => {
        if (!snapshot || snapshot.transactions.length === 0) {
          return 'Ngày,Tên giao dịch,Danh mục,Số tiền,Loại,Quỹ,Người chi,Nguồn,Ghi chú\n';
        }
        const headers = 'Ngày,Tên giao dịch,Danh mục,Số tiền,Loại,Quỹ,Người chi,Nguồn,Ghi chú';
        const rows = snapshot.transactions.map((t) => {
          const type = t.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
          const payer = t.paidBy === 'husband' ? 'Chồng' : t.paidBy === 'wife' ? 'Vợ' : 'Chung';
          const src = t.source === 'pocket_money' ? 'Ví riêng' : t.source === 'reimbursable' ? 'Ứng trước' : 'Quỹ chung';
          const fund = snapshot.funds.find((f) => f.id === t.fundId)?.name ?? t.fundId;
          const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : '';
          return `${t.dateLabel},"${t.title.replace(/"/g, '""')}","${t.category}",${t.amount},${type},"${fund}",${payer},${src},${note}`;
        });
        return [headers, ...rows].join('\n');
      },
      resetDemoData: () => {
        setSnapshot((current) => {
          if (!current || !storageScopeKey) {
            return current;
          }

          return createInitialSnapshot(current.householdId, storageScopeKey);
        });
      },
    };
  }, [activeHouseholdId, activeSnapshot, isReady, storageScopeKey]);

  return <DemoFinanceContext.Provider value={value}>{children}</DemoFinanceContext.Provider>;
}

export function useDemoFinance() {
  const context = useContext(DemoFinanceContext);
  if (!context) {
    throw new Error('useDemoFinance must be used inside DemoFinanceProvider.');
  }
  return context;
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}
