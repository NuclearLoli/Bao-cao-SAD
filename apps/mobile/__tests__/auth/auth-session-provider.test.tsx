import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { PropsWithChildren } from 'react';

import { useAuthSession, AuthSessionProvider } from '@/features/auth/ui/auth-session-provider';
import { HOUSEHOLD_STORAGE_KEY } from '@/features/household/data/household-repository';

function wrapper({ children }: PropsWithChildren) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}

describe('AuthSessionProvider sharing flow', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('creates an invite and lets another account accept into the same shared scope', async () => {
    const hook = await renderHook(() => useAuthSession(), { wrapper });
    await waitFor(() => expect(hook.result.current.state.status).toBe('guest'));

    await act(async () => {
      await hook.result.current.signUp({
        displayName: 'Owner',
        email: 'owner@example.com',
        password: '123456',
        plan: 'Plus',
      });
    });

    await act(async () => {
      await hook.result.current.createShareInvite({ email: 'partner@example.com' });
    });

    const sharedScopeKey = hook.result.current.storageScopeKey;
    expect(sharedScopeKey).toMatch(/^shared-/);

    await act(async () => {
      await hook.result.current.signOut();
    });

    await act(async () => {
      await hook.result.current.signUp({
        displayName: 'Partner',
        email: 'partner@example.com',
        password: '123456',
        plan: 'Free',
      });
    });

    expect(hook.result.current.pendingShareInvites).toHaveLength(1);

    await act(async () => {
      await hook.result.current.acceptShareInvite(
        hook.result.current.pendingShareInvites[0].id,
      );
    });

    expect(hook.result.current.storageScopeKey).toBe(sharedScopeKey);
    expect(hook.result.current.sharedHousehold?.members).toHaveLength(2);
  });

  test('copies existing household data into the new shared scope on first invite', async () => {
    const hook = await renderHook(() => useAuthSession(), { wrapper });
    await waitFor(() => expect(hook.result.current.state.status).toBe('guest'));

    await act(async () => {
      await hook.result.current.signUp({
        displayName: 'Owner',
        email: 'owner2@example.com',
        password: '123456',
        plan: 'Pro',
      });
    });

    const ownerState = hook.result.current.state;
    if (ownerState.status !== 'authenticated') {
      throw new Error('Expected authenticated state.');
    }

    const ownerScope = `account-${ownerState.account.id}`;
    const householdPayload = JSON.stringify({
      version: 1,
      data: {
        household: {
          id: 'household_1',
          name: 'Gia đình test',
          createdAt: '2026-09-25T00:00:00.000Z',
        },
        members: [],
      },
    });
    const financePayload = JSON.stringify({
      householdId: 'household_1',
      monthlyIncome: 10000000,
      funds: [],
      transactions: [],
    });

    await AsyncStorage.setItem(`${HOUSEHOLD_STORAGE_KEY}.${ownerScope}`, householdPayload);
    await AsyncStorage.setItem(
      `cashflow.finance.${ownerScope}.household_1`,
      financePayload,
    );

    await act(async () => {
      await hook.result.current.createShareInvite({ email: 'another@example.com' });
    });

    const sharedScope = hook.result.current.storageScopeKey;
    expect(sharedScope).toMatch(/^shared-/);

    const copiedHousehold = await AsyncStorage.getItem(
      `${HOUSEHOLD_STORAGE_KEY}.${sharedScope}`,
    );
    const copiedFinance = await AsyncStorage.getItem(
      `cashflow.finance.${sharedScope}.household_1`,
    );

    expect(copiedHousehold).toBe(householdPayload);
    expect(copiedFinance).toBe(financePayload);
  });
});
