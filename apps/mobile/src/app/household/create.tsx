import { Redirect, router } from 'expo-router';

import { AppScreen } from '@/components/app-screen';
import { LoadingState } from '@/components/loading-state';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { CreateHouseholdForm } from '@/features/household/ui/create-household-form';
import { useHousehold } from '@/features/household/ui/household-provider';

export default function CreateHouseholdScreen() {
  const { state: authState } = useAuthSession();
  const { state, create } = useHousehold();

  if (authState.status === 'loading') {
    return <LoadingState label="Đang kiểm tra phiên household…" />;
  }
  if (authState.status !== 'authenticated') {
    return <Redirect href="/auth/welcome" />;
  }

  if (state.status === 'loading') {
    return <LoadingState />;
  }
  if (state.status === 'ready') {
    return <Redirect href="/dashboard" />;
  }
  if (state.status === 'corrupted' || state.status === 'unavailable') {
    return <Redirect href="/recovery" />;
  }

  return (
    <AppScreen centered>
      <CreateHouseholdForm
        onSubmit={async (name) => {
          await create(name);
          router.replace('/dashboard');
        }}
      />
    </AppScreen>
  );
}
