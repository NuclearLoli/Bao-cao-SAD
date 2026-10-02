import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React, { PropsWithChildren } from 'react';

import { AuthSessionProvider, useAuthSession } from '@/features/auth/ui/auth-session-provider';
import {
  DemoFinanceProvider,
  DemoTransaction,
  RecurringBill,
  SavingsGoal,
  useDemoFinance,
} from '@/features/finance/ui/demo-finance-provider';
import { HouseholdProvider } from '@/features/household/ui/household-provider';

import { makeHouseholdAggregate } from '../../test-utils/household-fixtures';

function createWrapper() {
  const aggregate = makeHouseholdAggregate();
  const services = {
    repository: {
      load: jest.fn().mockResolvedValue({ status: 'ready' as const, aggregate }),
      save: jest.fn().mockResolvedValue(undefined),
      reset: jest.fn().mockResolvedValue(undefined),
    },
    identityProvider: {
      getCurrentIdentity: jest.fn().mockResolvedValue({ userId: 'demo_nu', displayName: 'Nguyễn Văn Nu' }),
    },
    telemetry: { track: jest.fn().mockResolvedValue(undefined) },
    createId: (kind: 'household' | 'member') => `${kind}_1`,
    now: () => '2026-10-01T00:00:00.000Z',
  };

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <AuthSessionProvider>
        <HouseholdProvider services={services}>
          <DemoFinanceProvider>{children}</DemoFinanceProvider>
        </HouseholdProvider>
      </AuthSessionProvider>
    );
  };
}

describe('Transaction & Financial Management Operations', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('allows updating an existing transaction and recalculates funds and pocket money', async () => {
    const wrapper = createWrapper();
    const hook = await renderHook(
      () => ({
        auth: useAuthSession(),
        finance: useDemoFinance(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(hook.result.current?.auth?.state?.status).toBe('guest'));

    // Continue with demo account
    await act(async () => {
      await hook.result.current.auth.continueWithDemoAccount('demo_nu');
    });

    await waitFor(() => expect(hook.result.current.finance.isReady).toBe(true));

    const initialHusbandSpent = hook.result.current.finance.couple.husbandPocketSpent;

    // Add a new transaction
    await act(async () => {
      hook.result.current.finance.addTransaction({
        title: 'Cà phê sáng',
        category: 'Cá nhân',
        amount: 50000,
        type: 'expense',
        fundId: 'family',
        paidBy: 'husband',
        source: 'pocket_money',
        note: 'Highlands Coffee',
      });
    });

    const addedTxn = hook.result.current.finance.transactions.find((t: DemoTransaction) => t.title === 'Cà phê sáng');
    expect(addedTxn).toBeDefined();
    expect(addedTxn?.amount).toBe(50000);

    // Update the transaction to 80,000 and different title
    await act(async () => {
      if (addedTxn) {
        hook.result.current.finance.updateTransaction(addedTxn.id, {
          title: 'Cà phê sáng + bánh ngọt',
          amount: 80000,
          note: 'Ăn sáng cùng đồng nghiệp',
        });
      }
    });

    const updatedTxn = hook.result.current.finance.transactions.find((t: DemoTransaction) => t.id === addedTxn?.id);
    expect(updatedTxn?.title).toBe('Cà phê sáng + bánh ngọt');
    expect(updatedTxn?.amount).toBe(80000);
    expect(updatedTxn?.note).toBe('Ăn sáng cùng đồng nghiệp');
    expect(updatedTxn?.updatedAt).toBeDefined();

    // Verify husband pocket spent increased by delta (+80k total from initial)
    expect(hook.result.current.finance.couple.husbandPocketSpent).toBe(initialHusbandSpent + 80000);
  });

  it('allows deleting recurring bills and savings goals', async () => {
    const wrapper = createWrapper();
    const hook = await renderHook(
      () => ({
        auth: useAuthSession(),
        finance: useDemoFinance(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(hook.result.current?.auth?.state?.status).toBe('guest'));

    await act(async () => {
      await hook.result.current.auth.continueWithDemoAccount('demo_nu');
    });

    await waitFor(() => expect(hook.result.current.finance.isReady).toBe(true));

    // Add a bill then delete it
    await act(async () => {
      hook.result.current.finance.addBill({
        title: 'Hóa đơn rác',
        amount: 60000,
        dueDay: 20,
        fundId: 'fixed',
        category: 'Dịch vụ',
      });
    });

    const bill = hook.result.current.finance.bills.find((b: RecurringBill) => b.title === 'Hóa đơn rác');
    expect(bill).toBeDefined();

    await act(async () => {
      if (bill) {
        hook.result.current.finance.deleteBill(bill.id);
      }
    });

    expect(hook.result.current.finance.bills.find((b: RecurringBill) => b.title === 'Hóa đơn rác')).toBeUndefined();

    // Add a goal then delete it
    await act(async () => {
      hook.result.current.finance.addGoal({
        title: 'Mua máy pha cà phê',
        targetAmount: 5000000,
        deadlineMonth: '11/2026',
        category: 'Gia dụng',
        icon: '☕',
      });
    });

    const goal = hook.result.current.finance.goals.find((g: SavingsGoal) => g.title === 'Mua máy pha cà phê');
    expect(goal).toBeDefined();

    await act(async () => {
      if (goal) {
        hook.result.current.finance.deleteGoal(goal.id);
      }
    });

    expect(hook.result.current.finance.goals.find((g: SavingsGoal) => g.title === 'Mua máy pha cà phê')).toBeUndefined();
  });

  it('exports transactions as valid CSV format', async () => {
    const wrapper = createWrapper();
    const hook = await renderHook(
      () => ({
        auth: useAuthSession(),
        finance: useDemoFinance(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(hook.result.current?.auth?.state?.status).toBe('guest'));

    await act(async () => {
      await hook.result.current.auth.continueWithDemoAccount('demo_nu');
    });

    await waitFor(() => expect(hook.result.current.finance.isReady).toBe(true));

    const csv = hook.result.current.finance.exportTransactionsCsv();
    expect(csv).toContain('Ngày,Tên giao dịch,Danh mục,Số tiền,Loại,Quỹ,Người chi,Nguồn,Ghi chú');
    expect(csv.split('\n').length).toBeGreaterThan(1);
  });
});
