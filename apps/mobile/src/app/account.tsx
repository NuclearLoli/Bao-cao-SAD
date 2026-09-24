import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { ConfirmActionBar } from '@/components/confirm-action-bar';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { useDemoFinance } from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';

export default function AccountScreen() {
  const {
    state: authState,
    signOut,
    sharedHousehold,
    pendingShareInvites,
  } = useAuthSession();
  const finance = useDemoFinance();
  const { state: householdState, reset } = useHousehold();
  const [pendingAction, setPendingAction] = useState<'reset' | 'signout' | null>(null);

  if (authState.status === 'loading') {
    return <LoadingState label="Đang tải hồ sơ demo…" />;
  }
  if (authState.status !== 'authenticated') {
    return <Redirect href="/auth/welcome" />;
  }
  if (householdState.status === 'loading' || householdState.status === 'creating') {
    return <LoadingState />;
  }

  const account = authState.account;
  const collaborationLabel = sharedHousehold
    ? `Đang cộng tác với ${sharedHousehold.members.length} thành viên`
    : pendingShareInvites.length > 0
      ? `Có ${pendingShareInvites.length} lời mời đang chờ`
      : 'Đang dùng household cá nhân';

  const resetCurrentExperience = async () => {
    finance.resetDemoData();
    await reset();
    router.replace('/household/create' as never);
  };

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="TÀI KHOẢN"
        title={account.displayName}
        subtitle="Màn tài khoản giờ đóng vai trò như settings page của app thật: có hồ sơ, plan, trạng thái cộng tác, và các thao tác quản trị phiên demo."
      />

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{account.displayName.slice(0, 1)}</Text>
        </View>
        <Text style={styles.profileName}>{account.displayName}</Text>
        <Text style={styles.profileMeta}>{account.email}</Text>
        <Text style={styles.profileMeta}>{account.roleLabel}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{collaborationLabel}</Text>
        </View>
      </View>

      <View style={styles.actionGrid}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/household/share' as never)}
          style={styles.actionTile}>
          <Text style={styles.actionTitle}>Quản lý chia sẻ household</Text>
          <Text style={styles.actionText}>Mời thêm account, chấp nhận invite, theo dõi thành viên.</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/budget/setup' as never)}
          style={styles.actionTile}>
          <Text style={styles.actionTitle}>Cấu hình tổng quan</Text>
          <Text style={styles.actionText}>Điều chỉnh thu nhập tháng và 4 quỹ để dashboard phản ánh đúng dữ liệu.</Text>
        </Pressable>
      </View>

      <View style={styles.planCard}>
        <Text style={styles.sectionEyebrow}>GÓI HIỆN TẠI</Text>
        <Text style={styles.planName}>{account.plan}</Text>
        <Text style={styles.planDescription}>
          {account.plan === 'Pro'
            ? 'Mở khóa AI insight, gợi ý điều chỉnh ngân sách, tóm tắt household và các agent thông minh hơn.'
            : account.plan === 'Plus'
              ? 'Có dashboard nâng cao, cộng tác gia đình, lời mời chia sẻ và sẵn chỗ cho AI về sau.'
              : 'Bản cơ bản đủ để theo dõi household, ghi giao dịch và xem overview ngân sách.'}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>TÌNH TRẠNG DỮ LIỆU</Text>
        <Text style={styles.sectionTitle}>Snapshot hiện tại</Text>
        <Text style={styles.sectionText}>
          {householdState.status === 'ready'
            ? `Household "${householdState.aggregate.household.name}" đang có ${finance.transactions.length} giao dịch và ${finance.funds.length} quỹ hiển thị trên front-end.`
            : 'Bạn chưa tạo household trong scope hiện tại.'}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionEyebrow}>AI & AGENT</Text>
        <Text style={styles.sectionTitle}>Những gì front-end đang gợi mở</Text>
        <View style={styles.bulletList}>
          <Text style={styles.sectionText}>• Gợi ý phân loại chi tiêu bằng AI theo quỹ</Text>
          <Text style={styles.sectionText}>• Cảnh báo chạm ngưỡng ngân sách theo tuần hoặc theo quỹ</Text>
          <Text style={styles.sectionText}>• Tóm tắt household để 2 người cùng xem và ra quyết định</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setPendingAction('reset')}
        style={styles.resetButton}>
        <Text style={styles.resetButtonText}>Reset household hiện tại để demo lại từ đầu</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => setPendingAction('signout')}
        style={styles.signOutButton}>
        <Text style={styles.signOutButtonText}>Đăng xuất khỏi phiên demo</Text>
      </Pressable>

      {pendingAction === 'reset' ? (
        <ConfirmActionBar
          title="Xác nhận reset dữ liệu household"
          description="Toàn bộ household hiện tại sẽ quay về trạng thái ban đầu của scope này để bạn demo lại từ đầu."
          confirmLabel="Reset ngay"
          tone="danger"
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            void resetCurrentExperience();
            setPendingAction(null);
          }}
        />
      ) : null}

      {pendingAction === 'signout' ? (
        <ConfirmActionBar
          title="Xác nhận đăng xuất"
          description="Bạn sẽ rời phiên demo hiện tại, nhưng dữ liệu local của account này vẫn được giữ lại."
          confirmLabel="Đăng xuất"
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            void signOut();
            setPendingAction(null);
          }}
        />
      ) : null}

      <PrimaryTabBar />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 18, paddingBottom: 32 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#163B29',
    borderRadius: 28,
    padding: 24,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#DCF5E5',
    borderRadius: 999,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: { color: '#166534', fontSize: 30, fontWeight: '900' },
  profileName: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginTop: 16 },
  profileMeta: { color: '#D4E4DA', fontSize: 14, lineHeight: 21, marginTop: 6 },
  statusBadge: {
    backgroundColor: '#255A3F',
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBadgeText: { color: '#DDF5E7', fontSize: 12, fontWeight: '800' },
  actionGrid: { gap: 12 },
  actionTile: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5DF',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  actionTitle: { color: '#17231D', fontSize: 16, fontWeight: '800' },
  actionText: { color: '#67776D', fontSize: 13, lineHeight: 20, marginTop: 6 },
  planCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F4D38A',
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5DF',
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
  },
  sectionEyebrow: { color: '#6A7A70', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  planName: { color: '#7C2D12', fontSize: 28, fontWeight: '900', marginTop: 10 },
  planDescription: { color: '#7C5D28', fontSize: 14, lineHeight: 22, marginTop: 8 },
  sectionTitle: { color: '#17231D', fontSize: 22, fontWeight: '800', marginTop: 6 },
  sectionText: { color: '#637267', fontSize: 14, lineHeight: 22, marginTop: 10 },
  bulletList: { marginTop: 4 },
  resetButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D99A4E',
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 54,
  },
  resetButtonText: { color: '#9A5B0D', fontSize: 15, fontWeight: '800' },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: '#8B1E1E',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 54,
  },
  signOutButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
