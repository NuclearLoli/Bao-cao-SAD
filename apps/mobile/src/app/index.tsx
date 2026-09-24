import { Redirect } from 'expo-router';

import { LoadingState } from '@/components/loading-state';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { useHousehold } from '@/features/household/ui/household-provider';

export default function HomeScreen() {
  const { state: authState, pendingShareInvites } = useAuthSession();
  const { state } = useHousehold();

  if (authState.status === 'loading') {
    return <LoadingState label="Đang chuẩn bị phiên đăng nhập demo…" />;
  }
  if (authState.status !== 'authenticated') {
    return <Redirect href="/auth/welcome" />;
  }

  if (state.status === 'loading' || state.status === 'creating') {
    return <LoadingState />;
  }
  if (state.status === 'empty') {
    if (pendingShareInvites.length > 0) {
      return <Redirect href="/household/share" />;
    }
    return <Redirect href="/household/create" />;
  }
  if (state.status === 'ready') {
    return <Redirect href="/dashboard" />;
  }
  return <Redirect href="/recovery" />;
}
