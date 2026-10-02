import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { HOUSEHOLD_STORAGE_KEY } from '@/features/household/data/household-repository';

import { AuthSessionIdentityProvider, AuthSessionProvider, useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { DemoFinanceProvider } from '@/features/finance/ui/demo-finance-provider';
import { createAsyncStorageHouseholdRepository } from '@/features/household/data/async-storage-household-repository';
import { createDefaultHouseholdServices, HouseholdProvider } from '@/features/household/ui/household-provider';
import { AppSecurityProvider } from '@/features/security/ui/app-security-provider';

export default function RootLayout() {
  return (
    <AppSecurityProvider>
      <AuthSessionProvider>
        <AppProviders />
      </AuthSessionProvider>
    </AppSecurityProvider>
  );
}

function AppProviders() {
  const { state, storageScopeKey } = useAuthSession();
  const householdServices = useMemo(() => {
    const identityProvider = new AuthSessionIdentityProvider(() => {
      if (state.status !== 'authenticated') {
        return null;
      }

      return {
        userId: state.account.id,
        displayName: state.account.displayName,
      };
    });

    const storageKey = storageScopeKey
      ? `${HOUSEHOLD_STORAGE_KEY}.${storageScopeKey}`
      : HOUSEHOLD_STORAGE_KEY;

    return createDefaultHouseholdServices(
      identityProvider,
      createAsyncStorageHouseholdRepository(storageKey),
    );
  }, [state, storageScopeKey]);

  return (
    <HouseholdProvider services={householdServices}>
      <DemoFinanceProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#090D16' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/welcome" />
          <Stack.Screen name="auth/sign-in" />
          <Stack.Screen name="auth/sign-up" />
          <Stack.Screen name="auth/forgot-password" />
          <Stack.Screen name="household/create" />
          <Stack.Screen name="household/share" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="budget/setup" />
          <Stack.Screen name="transactions/index" />
          <Stack.Screen name="transactions/new" />
          <Stack.Screen name="weekly-checkin" />
          <Stack.Screen name="bills-and-goals" />
          <Stack.Screen name="monthly-close" />
          <Stack.Screen name="account" />
          <Stack.Screen name="recovery" />
        </Stack>
      </DemoFinanceProvider>
    </HouseholdProvider>
  );
}
