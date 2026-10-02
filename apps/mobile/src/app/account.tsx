import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { ConfirmActionBar } from '@/components/confirm-action-bar';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { useDemoFinance } from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';
import { useAppSecurity } from '@/features/security/ui/app-security-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export default function AccountScreen() {
  const {
    state: authState,
    signOut,
    changePassword,
    updateProfile,
    sharedHousehold,
    pendingShareInvites,
  } = useAuthSession();
  const finance = useDemoFinance();
  const { state: householdState, reset } = useHousehold();
  const {
    hasPin,
    setPin,
    removePin,
    lockApp,
    isPrivacyMode,
    togglePrivacyMode,
  } = useAppSecurity();

  const [pendingAction, setPendingAction] = useState<'reset' | 'signout' | null>(null);

  // State PIN
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  // State Đổi Mật Khẩu
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  // State Sửa Tên
  const [showEditName, setShowEditName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  // State Xuất CSV
  const [showCsvModal, setShowCsvModal] = useState(false);

  if (authState.status === 'loading') {
    return <LoadingState label="Đang tải hồ sơ tài khoản…" />;
  }
  if (authState.status !== 'authenticated') {
    return <Redirect href="/auth/welcome" />;
  }
  if (householdState.status === 'loading' || householdState.status === 'creating') {
    return <LoadingState />;
  }

  const account = authState.account;
  const collaborationLabel = sharedHousehold
    ? `Cộng tác: ${sharedHousehold.members.length} thành viên`
    : pendingShareInvites.length > 0
      ? `Có ${pendingShareInvites.length} lời mời đang chờ`
      : 'Household cá nhân';

  const resetCurrentExperience = async () => {
    finance.resetDemoData();
    await reset();
    router.replace('/household/create' as never);
  };

  const handleSavePin = async () => {
    if (!/^\d{4}$/.test(pinInput)) {
      setPinMessage('Mã PIN phải gồm đúng 4 chữ số (0-9).');
      return;
    }
    const success = await setPin(pinInput);
    if (success) {
      setPinMessage('Đã thiết lập mã PIN 4 số thành công!');
      setTimeout(() => {
        setShowPinSetup(false);
        setPinInput('');
        setPinMessage(null);
      }, 1000);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordFeedback('Vui lòng điền mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback('Mật khẩu xác nhận mới không khớp.');
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordFeedback('Đổi mật khẩu thành công!');
      setTimeout(() => {
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordFeedback(null);
      }, 1200);
    } catch (err) {
      setPasswordFeedback(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại.');
    }
  };

  const handleUpdateProfile = async () => {
    if (!displayNameInput.trim()) {
      setProfileFeedback('Tên hiển thị không được rỗng.');
      return;
    }

    try {
      await updateProfile({ displayName: displayNameInput.trim() });
      setProfileFeedback('Đã cập nhật tên hiển thị!');
      setTimeout(() => {
        setShowEditName(false);
        setDisplayNameInput('');
        setProfileFeedback(null);
      }, 1000);
    } catch (err) {
      setProfileFeedback(err instanceof Error ? err.message : 'Cập nhật thất bại.');
    }
  };

  const csvExportData = finance.exportTransactionsCsv();

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="THIẾT LẬP HỒ SƠ"
        title={account.displayName}
        subtitle="Quản lý tài khoản, trạng thái đồng bộ hai vợ chồng và các công cụ quản trị dữ liệu tài chính."
        backLabel="← Về dashboard"
      />

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{account.displayName.slice(0, 1)}</Text>
        </View>
        <Text style={styles.profileName}>{account.displayName}</Text>
        <Text style={styles.profileMeta}>{account.email}</Text>
        <Text style={styles.profileRole}>{account.roleLabel}</Text>
        <View style={styles.statusBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.statusBadgeText}>{collaborationLabel}</Text>
        </View>

        <AnimatedPressable
          onPress={() => {
            setDisplayNameInput(account.displayName);
            setShowEditName(!showEditName);
          }}
          style={styles.editProfileBtn}>
          <Ionicons name="create-outline" size={13} color={AnalyticsTheme.colors.cyan} />
          <Text style={styles.editProfileBtnText}>Đổi tên hiển thị</Text>
        </AnimatedPressable>

        {showEditName && (
          <View style={styles.subFormBox}>
            <Text style={styles.subFormLabel}>TÊN HIỂN THỊ MỚI</Text>
            <TextInput
              style={styles.subFormInput}
              value={displayNameInput}
              onChangeText={setDisplayNameInput}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#64748B"
            />
            {profileFeedback ? <Text style={styles.feedbackText}>{profileFeedback}</Text> : null}
            <AnimatedPressable onPress={handleUpdateProfile} style={styles.subFormSubmitBtn}>
              <Text style={styles.subFormSubmitText}>Lưu Tên Mới</Text>
            </AnimatedPressable>
          </View>
        )}
      </View>

      {/* Action Navigation Grid */}
      <View style={styles.actionGrid}>
        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => router.push('/household/share' as never)}
          style={styles.actionTile}>
          <View style={styles.actionHeaderRow}>
            <Text style={styles.actionTitle}>👥 Quản lý liên kết vợ chồng</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
          <Text style={styles.actionText}>Mời bạn đời, chấp nhận mã ghép đôi, theo dõi phân quyền chi tiêu.</Text>
        </AnimatedPressable>

        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => router.push('/budget/setup' as never)}
          style={styles.actionTile}>
          <View style={styles.actionHeaderRow}>
            <Text style={styles.actionTitle}>⚙️ Cấu hình lương & 4 Quỹ</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
          <Text style={styles.actionText}>Điều chỉnh chu kỳ nhận lương, ví riêng vợ chồng và hạn mức quỹ.</Text>
        </AnimatedPressable>

        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => router.push('/bills-and-goals' as never)}
          style={styles.actionTile}>
          <View style={styles.actionHeaderRow}>
            <Text style={styles.actionTitle}>🎯 Hóa đơn định kỳ & Mục tiêu</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
          <Text style={styles.actionText}>Quản lý các khoản nợ, hóa đơn cố định và tiến độ tích lũy dài hạn.</Text>
        </AnimatedPressable>
      </View>

      {/* Security & PIN Section */}
      <View style={styles.securityCard}>
        <View style={styles.planHeaderRow}>
          <Text style={styles.sectionEyebrow}>BẢO MẬT & QUYỀN RIÊNG TƯ</Text>
          <View style={styles.secBadge}>
            <Text style={styles.secBadgeText}>{hasPin ? 'PIN KHÓA: BẬT' : 'CHƯA CÀI PIN'}</Text>
          </View>
        </View>

        <Text style={styles.securityTitle}>Khóa Ứng Dụng (Mã PIN 4 Số)</Text>
        <Text style={styles.securityDesc}>
          Bảo vệ số liệu tài chính gia đình khỏi người ngoài khi cho mượn điện thoại.
        </Text>

        <View style={styles.securityActionRow}>
          {hasPin ? (
            <>
              <AnimatedPressable onPress={lockApp} style={styles.lockNowBtn}>
                <Ionicons name="lock-closed-outline" size={14} color="#090D16" />
                <Text style={styles.lockNowBtnText}>Khóa App Ngay</Text>
              </AnimatedPressable>
              <AnimatedPressable onPress={() => removePin()} style={styles.disablePinBtn}>
                <Ionicons name="lock-open-outline" size={14} color={AnalyticsTheme.colors.rose} />
                <Text style={styles.disablePinBtnText}>Tắt mã PIN</Text>
              </AnimatedPressable>
            </>
          ) : (
            <AnimatedPressable onPress={() => setShowPinSetup(!showPinSetup)} style={styles.setupPinBtn}>
              <Ionicons name="key-outline" size={14} color={AnalyticsTheme.colors.amber} />
              <Text style={styles.setupPinBtnText}>Thiết Lập Mã PIN 4 Số</Text>
            </AnimatedPressable>
          )}

          <AnimatedPressable onPress={togglePrivacyMode} style={styles.privacyModeBtn}>
            <Ionicons
              name={isPrivacyMode ? 'eye-off-outline' : 'eye-outline'}
              size={13}
              color={AnalyticsTheme.colors.cyan}
            />
            <Text style={styles.privacyModeBtnText}>
              {isPrivacyMode ? 'Ẩn số dư: BẬT' : 'Ẩn số dư: TẮT'}
            </Text>
          </AnimatedPressable>
        </View>

        {showPinSetup && (
          <View style={styles.subFormBox}>
            <Text style={styles.subFormLabel}>NHẬP MÃ PIN MỚI (4 CHỮ SỐ)</Text>
            <TextInput
              style={styles.subFormInput}
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="VD: 1234"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
            {pinMessage ? <Text style={styles.feedbackText}>{pinMessage}</Text> : null}
            <AnimatedPressable onPress={handleSavePin} style={styles.subFormSubmitBtn}>
              <Text style={styles.subFormSubmitText}>Kích Hoạt Khóa PIN</Text>
            </AnimatedPressable>
          </View>
        )}

        {/* Recovery Code Display */}
        <View style={styles.recoveryCodeBox}>
          <Text style={styles.recoveryCodeLabel}>MÃ KHÔI PHỤC BÍ MẬT (RECOVERY CODE)</Text>
          <Text selectable style={styles.recoveryCodeValue}>
            {account.recoveryCode ?? 'REC-NU-2026'}
          </Text>
          <Text style={styles.recoveryCodeHint}>
            Lưu mã này ở nơi an toàn để lấy lại mật khẩu tài khoản nếu lỡ quên.
          </Text>
        </View>

        {/* Change Password Button */}
        <AnimatedPressable
          onPress={() => setShowChangePassword(!showChangePassword)}
          style={styles.changePasswordToggleBtn}>
          <Text style={styles.changePasswordToggleText}>
            {showChangePassword ? '▲ Đóng đổi mật khẩu' : '▼ Đổi Mật Khẩu Tài Khoản'}
          </Text>
        </AnimatedPressable>

        {showChangePassword && (
          <View style={styles.subFormBox}>
            <Text style={styles.subFormLabel}>MẬT KHẨU HIỆN TẠI</Text>
            <TextInput
              style={styles.subFormInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Nhập mật khẩu cũ"
              placeholderTextColor="#64748B"
              secureTextEntry
            />
            <Text style={styles.subFormLabel}>MẬT KHẨU MỚI</Text>
            <TextInput
              style={styles.subFormInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Tối thiểu 6 ký tự"
              placeholderTextColor="#64748B"
              secureTextEntry
            />
            <Text style={styles.subFormLabel}>XÁC NHẬN MẬT KHẨU MỚI</Text>
            <TextInput
              style={styles.subFormInput}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor="#64748B"
              secureTextEntry
            />
            {passwordFeedback ? <Text style={styles.feedbackText}>{passwordFeedback}</Text> : null}
            <AnimatedPressable onPress={handleChangePassword} style={styles.subFormSubmitBtn}>
              <Text style={styles.subFormSubmitText}>Xác Nhận Đổi Mật Khẩu</Text>
            </AnimatedPressable>
          </View>
        )}
      </View>

      {/* Plan Card */}
      <View style={styles.planCard}>
        <View style={styles.planHeaderRow}>
          <Text style={styles.sectionEyebrow}>GÓI DỊCH VỤ</Text>
          <View style={styles.proTag}>
            <Text style={styles.proTagText}>ACTIVE</Text>
          </View>
        </View>
        <Text style={styles.planName}>{account.plan} Analytics</Text>
        <Text style={styles.planDescription}>
          {account.plan === 'Pro'
            ? 'Mở khóa AI gợi ý đánh đổi, radar dự báo chi tiêu cuối tháng, trích xuất SMS ngân hàng và báo cáo tài chính gia đình thời gian thực.'
            : account.plan === 'Plus'
              ? 'Mở khóa đồng bộ 2 thiết bị vợ chồng, phân chia ví riêng cá nhân và quản lý hóa đơn định kỳ.'
              : 'Gói cơ bản theo dõi thu chi gia đình, ngân sách 4 quỹ và ghi chép thủ công.'}
        </Text>
      </View>

      {/* Data Export & Snapshot */}
      <View style={styles.sectionCard}>
        <View style={styles.planHeaderRow}>
          <Text style={styles.sectionEyebrow}>DỮ LIỆU & BÁO CÁO</Text>
          <AnimatedPressable onPress={() => setShowCsvModal(true)} style={styles.exportCsvBtn}>
            <Ionicons name="document-text-outline" size={13} color={AnalyticsTheme.colors.emerald} />
            <Text style={styles.exportCsvBtnText}>Xuất CSV</Text>
          </AnimatedPressable>
        </View>
        <Text style={styles.sectionTitle}>Tình trạng lưu trữ</Text>
        <Text style={styles.sectionText}>
          {householdState.status === 'ready'
            ? `Tổ ấm "${householdState.aggregate.household.name}" đang lưu trữ ${finance.transactions.length} giao dịch, ${finance.funds.length} quỹ ngân sách và ${finance.goals.length} mục tiêu tiết kiệm.`
            : 'Chưa khởi tạo dữ liệu trong scope hiện tại.'}
        </Text>
      </View>

      {/* Administrative Actions */}
      <View style={styles.dangerZone}>
        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => setPendingAction('reset')}
          style={styles.resetButton}>
          <Ionicons name="refresh-outline" size={16} color={AnalyticsTheme.colors.amber} />
          <Text style={styles.resetButtonText}>Reset Dữ Liệu Household Về Mặc Định</Text>
        </AnimatedPressable>

        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => setPendingAction('signout')}
          style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={18} color={AnalyticsTheme.colors.rose} />
          <Text style={styles.signOutButtonText}>Đăng Xuất Khỏi Tài Khoản</Text>
        </AnimatedPressable>
      </View>

      {pendingAction === 'reset' ? (
        <ConfirmActionBar
          title="Xác nhận reset dữ liệu household"
          description="Toàn bộ ngân sách, mục tiêu và giao dịch hiện tại sẽ được khởi tạo lại về bộ mẫu mặc định."
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
          description="Bạn sẽ đăng xuất khỏi phiên làm việc này. Dữ liệu trên thiết bị vẫn được bảo lưu an toàn."
          confirmLabel="Đăng xuất ngay"
          tone="danger"
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            void signOut();
            setPendingAction(null);
            router.replace('/auth/welcome' as never);
          }}
        />
      ) : null}

      {/* CSV Modal */}
      <Modal visible={showCsvModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.csvModalCard}>
            <Text style={styles.csvModalTitle}>📄 Xuất Dữ Liệu Sổ Chi Tiêu</Text>
            <Text style={styles.csvModalSubtitle}>
              Sao chép nội dung dưới đây để dán vào Excel / Google Sheets:
            </Text>
            <ScrollView style={styles.csvScrollView}>
              <Text selectable style={styles.csvCodeText}>
                {csvExportData}
              </Text>
            </ScrollView>
            <AnimatedPressable onPress={() => setShowCsvModal(false)} style={styles.closeCsvBtn}>
              <Text style={styles.closeCsvBtnText}>Đóng</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      <PrimaryTabBar />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 16, paddingBottom: 24 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderColor: AnalyticsTheme.colors.borderLight,
    borderWidth: 1,
    padding: 24,
    marginTop: 8,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1.5,
    borderRadius: 999,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 26,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  profileName: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: AnalyticsTheme.typography.weightBlack,
    marginTop: 14,
  },
  profileMeta: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  profileRole: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 12,
    fontWeight: AnalyticsTheme.typography.weightBold,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: AnalyticsTheme.colors.emerald,
    borderWidth: 1,
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AnalyticsTheme.colors.emerald,
  },
  statusBadgeText: {
    color: AnalyticsTheme.colors.emerald,
    fontSize: 12,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  editProfileBtn: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
  },
  editProfileBtnText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },

  actionGrid: { gap: 10 },
  actionTile: {
    backgroundColor: AnalyticsTheme.colors.card,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    padding: 16,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  arrowIcon: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 16,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  actionText: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },

  securityCard: {
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderWidth: 1,
    padding: 20,
  },
  secBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  secBadgeText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  securityTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 17,
    fontWeight: AnalyticsTheme.typography.weightBold,
    marginTop: 10,
  },
  securityDesc: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  securityActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  lockNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AnalyticsTheme.colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  lockNowBtnText: { color: '#041B2D', fontSize: 12, fontWeight: '800' },
  disablePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: AnalyticsTheme.colors.rose,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disablePinBtnText: { color: AnalyticsTheme.colors.rose, fontSize: 12, fontWeight: '700' },
  setupPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  setupPinBtnText: { color: AnalyticsTheme.colors.cyan, fontSize: 12, fontWeight: '800' },
  privacyModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  privacyModeBtnText: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, fontWeight: '700' },

  recoveryCodeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  recoveryCodeLabel: {
    color: AnalyticsTheme.colors.amber,
    fontSize: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.8,
  },
  recoveryCodeValue: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: AnalyticsTheme.typography.weightBlack,
    marginTop: 4,
  },
  recoveryCodeHint: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },

  changePasswordToggleBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  changePasswordToggleText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 12,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },

  subFormBox: {
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    width: '100%',
  },
  subFormLabel: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.6,
    marginBottom: 4,
    marginTop: 6,
  },
  subFormInput: {
    backgroundColor: '#090D16',
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 13,
  },
  subFormSubmitBtn: {
    backgroundColor: AnalyticsTheme.colors.cyan,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  subFormSubmitText: {
    color: '#041B2D',
    fontSize: 12,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  feedbackText: {
    color: AnalyticsTheme.colors.emerald,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    marginTop: 6,
  },

  planCard: {
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderWidth: 1,
    padding: 20,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionEyebrow: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 1,
  },
  proTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proTagText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 9,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.8,
  },
  planName: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: AnalyticsTheme.typography.weightBlack,
    marginTop: 8,
  },
  planDescription: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  sectionCard: {
    backgroundColor: AnalyticsTheme.colors.card,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderWidth: 1,
    padding: 18,
  },
  exportCsvBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: AnalyticsTheme.colors.emerald,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exportCsvBtnText: {
    color: AnalyticsTheme.colors.emerald,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  sectionTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: AnalyticsTheme.typography.weightBold,
    marginTop: 6,
  },
  sectionText: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  dangerZone: {
    gap: 12,
    marginTop: 6,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  resetButtonText: {
    color: AnalyticsTheme.colors.amber,
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: AnalyticsTheme.colors.rose,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  signOutButtonText: {
    color: AnalyticsTheme.colors.rose,
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
    maxHeight: 320,
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
