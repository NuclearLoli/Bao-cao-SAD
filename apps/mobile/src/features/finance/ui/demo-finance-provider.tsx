import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { useHousehold } from '@/features/household/ui/household-provider';

const FINANCE_STORAGE_PREFIX = 'cashflow.finance';

type DemoFundId = 'fixed' | 'family' | 'emergency' | 'savings' | 'goals';
type DemoTransactionType = 'expense' | 'income';

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
  note?: string;
  dateLabel: string;
};

type DemoFinanceSnapshot = {
  householdId: string;
  monthlyIncome: number;
  funds: DemoFund[];
  transactions: DemoTransaction[];
};

type AddDemoTransactionInput = {
  title: string;
  category: string;
  amount: number;
  type: DemoTransactionType;
  fundId: DemoFundId;
  note?: string;
};

type DemoBudgetSetupInput = {
  monthlyIncome: number;
  allocations: Record<DemoFundId, number>;
};

type DemoFinanceContextValue = {
  funds: DemoFund[];
  transactions: DemoTransaction[];
  monthlyIncome: number;
  totalBudgeted: number;
  totalSpent: number;
  remainingBudget: number;
  householdPulse: string;
  isReady: boolean;
  addTransaction: (input: AddDemoTransactionInput) => void;
  updateBudgetSetup: (input: DemoBudgetSetupInput) => void;
  removeTransaction: (transactionId: string) => void;
  resetDemoData: () => void;
};

const DemoFinanceContext = createContext<DemoFinanceContextValue | null>(null);

function createSharedDemoSnapshot(householdId: string): DemoFinanceSnapshot {
  return {
    householdId,
    monthlyIncome: 32500000,
    funds: [
      {
        id: 'fixed',
        name: 'Quỹ cố định',
        description: 'Nhà ở, điện nước, internet, học phí.',
        allocated: 12000000,
        spent: 8300000,
        color: '#1D8348',
      },
      {
        id: 'family',
        name: 'Quỹ gia đình & con',
        description: 'Ăn uống, nhu yếu phẩm, sinh hoạt gia đình.',
        allocated: 8000000,
        spent: 5600000,
        color: '#0F766E',
      },
      {
        id: 'emergency',
        name: 'Quỹ khẩn cấp',
        description: 'Đệm an toàn để phòng các tháng phát sinh.',
        allocated: 4500000,
        spent: 1200000,
        color: '#B45309',
      },
      {
        id: 'savings',
        name: 'Quỹ tiết kiệm',
        description: 'Khoản để dành đều mỗi tháng cho kế hoạch dài hạn.',
        allocated: 3000000,
        spent: 500000,
        color: '#2563EB',
      },
      {
        id: 'goals',
        name: 'Quỹ mục tiêu',
        description: 'Du lịch, thiết bị mới, nâng cấp cuộc sống.',
        allocated: 2000000,
        spent: 2100000,
        color: '#7C3AED',
      },
    ],
    transactions: [
      {
        id: 'txn_1',
        title: 'Tiền điện tháng này',
        category: 'Hóa đơn',
        amount: 1250000,
        type: 'expense',
        fundId: 'fixed',
        note: 'Thanh toán qua banking',
        dateLabel: 'Hôm nay, 08:30',
      },
      {
        id: 'txn_2',
        title: 'Đi siêu thị cuối tuần',
        category: 'Ăn uống',
        amount: 870000,
        type: 'expense',
        fundId: 'family',
        note: 'Mua cho cả tuần',
        dateLabel: 'Hôm qua, 18:10',
      },
      {
        id: 'txn_3',
        title: 'Đóng thêm quỹ dự phòng',
        category: 'Tiết kiệm',
        amount: 1500000,
        type: 'income',
        fundId: 'emergency',
        note: 'Bù sau tháng vừa rồi',
        dateLabel: 'Thứ 2, 20:15',
      },
    ],
  };
}

function createBlankSnapshot(householdId: string): DemoFinanceSnapshot {
  return {
    householdId,
    monthlyIncome: 0,
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
        name: 'Quỹ khẩn cấp',
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
    transactions: [],
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
          setSnapshot(parsed);
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
    const monthlyIncome = activeSnapshot?.monthlyIncome ?? 0;
    const totalBudgeted = funds.reduce((sum, fund) => sum + fund.allocated, 0);
    const totalSpent = funds.reduce((sum, fund) => sum + fund.spent, 0);
    const remainingBudget = totalBudgeted - totalSpent;
    const hottestFund = funds.reduce<DemoFund | null>(
      (selected, fund) => {
        if (!selected) {
          return fund;
        }
        const selectedRatio = selected.allocated > 0 ? selected.spent / selected.allocated : 0;
        const currentRatio = fund.allocated > 0 ? fund.spent / fund.allocated : 0;
        return currentRatio > selectedRatio ? fund : selected;
      },
      null,
    );

    return {
      funds,
      transactions,
      monthlyIncome,
      totalBudgeted,
      totalSpent,
      remainingBudget,
      isReady,
      householdPulse: hottestFund && hottestFund.allocated > 0
        ? `${hottestFund.name} đã dùng ${Math.round((hottestFund.spent / hottestFund.allocated) * 100)}% ngân sách.`
        : 'Bạn có thể tự setup ngân sách ở tab Ngân sách để tổng quan phản ánh đúng household này.',
      addTransaction: (input) => {
        setSnapshot((current) => {
          if (!current || !activeHouseholdId) {
            return current;
          }

          const nextTransaction: DemoTransaction = {
            id: `txn_${Date.now()}`,
            title: input.title,
            category: input.category,
            amount: input.amount,
            type: input.type,
            fundId: input.fundId,
            note: input.note,
            dateLabel: 'Vừa xong',
          };

          const nextFunds = current.funds.map((fund) => {
            if (fund.id !== input.fundId) {
              return fund;
            }

            if (input.type === 'income') {
              return {
                ...fund,
                allocated: fund.allocated + input.amount,
              };
            }

            return {
              ...fund,
              spent: fund.spent + input.amount,
            };
          });

          return {
            ...current,
            funds: nextFunds,
            transactions: [nextTransaction, ...current.transactions],
          };
        });
      },
      updateBudgetSetup: (input) => {
        setSnapshot((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            monthlyIncome: input.monthlyIncome,
            funds: current.funds.map((fund) => ({
              ...fund,
              allocated: input.allocations[fund.id],
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
