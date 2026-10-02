import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { ConfirmActionBar } from '@/components/confirm-action-bar';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { useHousehold } from '@/features/household/ui/household-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export default function HouseholdShareScreen() {
  const {
    state: authState,
    sharedHousehold,
    pendingShareInvites,
    createShareInvite,
    acceptShareInvite,
    declineShareInvite,
    revokeShareInvite,
    removeSharedMember,
    leaveSharedHousehold,
  } = useAuthSession();
  const { state: householdState } = useHousehold();
  const [inviteEmail, setInviteEmail] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    tone?: 'default' | 'danger';
    run: () => Promise<void> | void;
  } | null>(null);

  const canOpenSharingTools =
    householdState.status === 'ready' ||
    sharedHousehold !== null ||
    pendingShareInvites.length > 0 ||
    householdState.status === 'empty';

  const statusTitle = useMemo(() => {
    if (sharedHousehold) {
      return householdState.status === 'ready'
        ? householdState.aggregate.household.name
        : sharedHousehold.householdLabel;
    }
    if (pendingShareInvites.length > 0) {
      return 'Lời Mời Đang Chờ Phản Hồi';
    }
    if (householdState.status === 'ready') {
      return 'Không Gian Gia Đình Riêng Tư';
    }
    return 'Chưa Bật Đồng Bộ';
  }, [householdState, pendingShareInvites.length, sharedHousehold]);

  const statusText = useMemo(() => {
    if (sharedHousehold?.isDemoSharedHousehold) {
      return 'Không gian gia đình kết nối hai vợ chồng: cùng xem radar thu chi, phân bổ quỹ và kiểm soát dòng tiền chung.';
    }
    if (sharedHousehold) {
      return sharedHousehold.pendingInvites.length > 0
        ? `Đang có ${sharedHousehold.pendingInvites.length} lời mời chờ phản hồi. Hai người dùng chung một dashboard và cập nhật giao dịch thời gian thực.`
        : 'Cả hai thành viên đang dùng chung dashboard, phân bổ 4 quỹ và đối soát chi tiêu trong cùng một tổ ấm.';
    }
    if (pendingShareInvites.length > 0) {
      return 'Bạn có thể chấp nhận lời mời để đồng bộ dữ liệu tổ ấm chung, hoặc từ chối để giữ phiên riêng biệt.';
    }
    if (householdState.status === 'ready') {
      return 'Không gian này hiện chỉ do bạn quản lý. Gửi lời mời qua email để thêm bạn đời cùng theo dõi dòng tiền.';
    }
    return 'Tạo tổ ấm trước hoặc nhận lời mời từ gia đình có sẵn để bắt đầu đồng bộ hai thiết bị.';
  }, [householdState.status, pendingShareInvites.length, sharedHousehold]);

  if (authState.status === 'loading') {
    return <LoadingState label="Đang tải thiết lập chia sẻ…" />;
  }
  if (authState.status !== 'authenticated') {
    return <Redirect href="/auth/welcome" />;
  }
  if (householdState.status === 'loading' || householdState.status === 'creating') {
    return <LoadingState />;
  }
  if (!canOpenSharingTools) {
    return <Redirect href="/" />;
  }

  const submitInvite = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const invite = await createShareInvite({ email: inviteEmail });
      setInviteEmail('');
      setFeedback(`Đã tạo lời mời cho ${invite.invitedEmail} với mã ${invite.code}.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể tạo lời mời.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentMembers = sharedHousehold?.members ?? [];
  const currentPendingInvites = sharedHousehold?.pendingInvites ?? [];
  const canManageHousehold =
    sharedHousehold?.canManage && !sharedHousehold.isDemoSharedHousehold;

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="ĐỒNG BỘ 2 THIẾT BỊ VỢ CHỒNG"
        title="Quản Lý Ghép Đôi & Chia Sẻ"
        subtitle="Mô hình cộng tác 2 chiều: mời bạn đời, ghép đôi thiết bị, xem trạng thái lời mời và phân quyền thu chi thời gian thực."
        backLabel="← Về dashboard"
      />

      <View style={styles.statusCard}>
        <View style={styles.statusHeaderRow}>
          <Text style={styles.statusEyebrow}>TRẠNG THÁI LIÊN KẾT</Text>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>TELEMETRY ACTIVE</Text>
          </View>
        </View>
        <Text style={styles.statusTitle}>{statusTitle}</Text>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {pendingAction ? (
        <ConfirmActionBar
          title={pendingAction.title}
          description={pendingAction.description}
          confirmLabel={pendingAction.confirmLabel}
          tone={pendingAction.tone}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            void Promise.resolve(pendingAction.run()).finally(() => setPendingAction(null));
          }}
        />
      ) : null}

      {pendingShareInvites.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>LỜI MỜI DÀNH CHO BẠN</Text>
          <Text style={styles.sectionTitle}>Tham Gia Tổ Ấm Chung</Text>
          <View style={styles.stack}>
            {pendingShareInvites.map((invite) => (
              <View key={invite.id} style={styles.inviteCard}>
                <View style={styles.inviteHeader}>
                  <View>
                    <Text style={styles.inviteEmail}>{invite.invitedEmail}</Text>
                    <Text style={styles.inviteMeta}>
                      Mã ghép đôi: <Text style={styles.boldCyan}>{invite.code}</Text> · {invite.createdAtLabel}
                    </Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>PENDING</Text>
                  </View>
                </View>
                <View style={styles.inlineActions}>
                  <AnimatedPressable
                    accessibilityRole="button"
                    onPress={() =>
                      setPendingAction({
                        title: 'Xác nhận tham gia tổ ấm',
                        description:
                          'Sau khi chấp nhận, tài khoản này sẽ đồng bộ dashboard, ngân sách 4 quỹ và các giao dịch chung.',
                        confirmLabel: 'Tham gia ngay',
                        run: () => acceptShareInvite(invite.id),
                      })
                    }
                    style={styles.primaryInlineButton}>
                    <Text style={styles.primaryInlineButtonText}>Chấp nhận ghép đôi</Text>
                  </AnimatedPressable>
                  <AnimatedPressable
                    accessibilityRole="button"
                    onPress={() =>
                      setPendingAction({
                        title: 'Xác nhận từ chối lời mời',
                        description:
                          'Lời mời này sẽ bị hủy và bạn vẫn duy trì phiên làm việc độc lập.',
                        confirmLabel: 'Từ chối lời mời',
                        tone: 'danger',
                        run: () => declineShareInvite(invite.id),
                      })
                    }
                    style={styles.secondaryInlineButton}>
                    <Text style={styles.secondaryInlineButtonText}>Từ chối</Text>
                  </AnimatedPressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {householdState.status === 'ready' || sharedHousehold ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>MỜI BẠN ĐỜI</Text>
          <Text style={styles.sectionTitle}>Kết Nối Thiết Bị Hai Vợ Chồng</Text>
          <Text style={styles.sectionText}>
            Nhập email của bạn đời. Khi người đó đăng nhập app trên máy cá nhân,
            lời mời ghép đôi kèm mã xác thực sẽ hiển thị để phê duyệt tức thì.
          </Text>

          <Text style={styles.fieldLabel}>EMAIL BẠN ĐỜI ĐƯỢC MỜI</Text>
          <TextInput
            accessibilityLabel="Email người được mời"
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(value) => {
              setInviteEmail(value);
              setFeedback(null);
              setPendingAction(null);
            }}
            placeholder="Ví dụ: vo.yeu@example.com"
            placeholderTextColor={AnalyticsTheme.colors.textMuted}
            style={styles.input}
            value={inviteEmail}
          />

          <Text style={styles.helperText}>
            {feedback ??
              (sharedHousehold?.isDemoSharedHousehold
                ? 'Đang ở chế độ gia đình mẫu Nu/Mai. Mọi thay đổi thu chi được đồng bộ tức thời.'
                : 'Mẹo: Bạn có thể nhập email bất kỳ để tạo mã ghép đôi tức thời.')}
          </Text>

          <AnimatedPressable
            accessibilityRole="button"
            disabled={!canManageHousehold || submitting}
            onPress={() =>
              setPendingAction({
                title: 'Xác nhận tạo lời mời ghép đôi',
                description:
                  'Mã ghép đôi sẽ được cấp để bạn đời đăng nhập và kết nối với dữ liệu tổ ấm.',
                confirmLabel: 'Tạo lời mời',
                run: submitInvite,
              })
            }
            style={[
              styles.primaryButton,
              !canManageHousehold || submitting ? styles.buttonDisabled : null,
            ]}>
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Đang gửi mã...' : '📨 Gửi Lời Mời Ghép Đôi'}
            </Text>
          </AnimatedPressable>
        </View>
      ) : null}

      {currentPendingInvites.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>LỜI MỜI ĐÃ GỬI</Text>
          <Text style={styles.sectionTitle}>Đang Chờ Bạn Đời Chấp Nhận</Text>
          <View style={styles.stack}>
            {currentPendingInvites.map((invite) => (
              <View key={invite.id} style={styles.inviteCard}>
                <View style={styles.inviteHeader}>
                  <View>
                    <Text style={styles.inviteEmail}>{invite.invitedEmail}</Text>
                    <Text style={styles.inviteMeta}>
                      {invite.invitedDisplayName} · Mã ghép đôi: <Text style={styles.boldCyan}>{invite.code}</Text>
                    </Text>
                  </View>
                  <AnimatedPressable
                    accessibilityRole="button"
                    disabled={!canManageHousehold}
                    onPress={() =>
                      setPendingAction({
                        title: 'Xác nhận thu hồi lời mời',
                        description:
                          'Mã ghép đôi sẽ bị vô hiệu hóa ngay lập tức.',
                        confirmLabel: 'Thu hồi lời mời',
                        tone: 'danger',
                        run: () => revokeShareInvite(invite.id),
                      })
                    }
                    style={[styles.ghostButton, !canManageHousehold ? styles.buttonDisabled : null]}>
                    <Text style={styles.ghostButtonText}>Thu hồi</Text>
                  </AnimatedPressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {currentMembers.length > 0 ? (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>👥 Thành Viên Trong Tổ Ấm</Text>
            <Text style={styles.memberCountBadge}>{currentMembers.length} THÀNH VIÊN</Text>
          </View>
          <View style={styles.stack}>
            {currentMembers.map((member) => {
              const isCurrentUser = member.accountId === authState.account.id;
              const canRemove = canManageHousehold && !member.isCreator;
              const canLeave =
                isCurrentUser && !member.isCreator && !sharedHousehold?.isDemoSharedHousehold;

              return (
                <View key={member.accountId} style={styles.memberRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{member.displayName.slice(0, 1)}</Text>
                  </View>
                  <View style={styles.memberTextGroup}>
                    <Text style={styles.memberName}>{member.displayName}</Text>
                    <Text style={styles.memberMeta}>
                      {member.email} · {member.plan}
                    </Text>
                    <Text style={styles.memberPermission}>{member.permissionLabel}</Text>
                  </View>
                  <View style={styles.memberActionCol}>
                    <View style={[styles.roleBadge, member.isCreator ? styles.creatorBadge : null]}>
                      <Text
                        style={[
                          styles.roleBadgeText,
                          member.isCreator ? styles.creatorBadgeText : null,
                        ]}>
                        {member.isCreator ? 'Admin' : 'Thành viên'}
                      </Text>
                    </View>
                    {canRemove ? (
                      <AnimatedPressable
                        accessibilityRole="button"
                        onPress={() =>
                          setPendingAction({
                            title: 'Xác nhận ngắt kết nối thành viên',
                            description:
                              'Thành viên này sẽ rời khỏi tổ ấm chung và trở về dữ liệu độc lập.',
                            confirmLabel: 'Ngắt kết nối',
                            tone: 'danger',
                            run: () => removeSharedMember(member.accountId),
                          })
                        }
                        style={styles.memberActionButton}>
                        <Text style={styles.memberActionText}>Gỡ</Text>
                      </AnimatedPressable>
                    ) : null}
                    {canLeave ? (
                      <AnimatedPressable
                        accessibilityRole="button"
                        onPress={() =>
                          setPendingAction({
                            title: 'Xác nhận rời khỏi tổ ấm',
                            description:
                              'Tài khoản của bạn sẽ tách khỏi nhóm và quay về không gian riêng.',
                            confirmLabel: 'Rời tổ ấm',
                            tone: 'danger',
                            run: () => leaveSharedHousehold(),
                          })
                        }
                        style={styles.memberActionButton}>
                        <Text style={styles.memberActionText}>Rời nhóm</Text>
                      </AnimatedPressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {householdState.status === 'empty' && pendingShareInvites.length === 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>BƯỚC TIẾP THEO</Text>
          <Text style={styles.sectionTitle}>Bạn Chưa Có Tổ Ấm Để Chia Sẻ</Text>
          <Text style={styles.sectionText}>
            Tạo không gian tài chính trước để có dashboard và số liệu riêng, sau đó quay lại đây để mời bạn đời.
          </Text>
          <AnimatedPressable
            accessibilityRole="button"
            onPress={() => router.push('/household/create' as never)}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Tạo Tổ Ấm Ngay →</Text>
          </AnimatedPressable>
        </View>
      ) : null}

      <View style={styles.permissionsCard}>
        <Text style={styles.permissionsEyebrow}>🛡️ NGUYÊN TẮC BẢO MẬT & PHÂN QUYỀN</Text>
        <Text style={styles.permissionItem}>• Cả hai cùng thấy tổng thể dòng tiền, quỹ sinh hoạt và quỹ tích lũy</Text>
        <Text style={styles.permissionItem}>• Mỗi người toàn quyền với ví riêng cá nhân ("Pocket Money"), không can thiệp</Text>
        <Text style={styles.permissionItem}>• Mọi khoản chi từ quỹ chung đều cập nhật tức thời trên 2 máy</Text>
        <Text style={styles.permissionItem}>• Dữ liệu đồng bộ cục bộ và hỗ trợ cloud sync an toàn</Text>
      </View>

      <PrimaryTabBar />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 16, paddingBottom: 24 },
  statusCard: {
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderColor: AnalyticsTheme.colors.borderLight,
    borderWidth: 1,
    padding: 22,
    marginTop: 8,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusEyebrow: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 1.2,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 5,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AnalyticsTheme.colors.cyan,
  },
  liveText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 9,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  statusTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: AnalyticsTheme.typography.weightBlack,
    marginTop: 10,
  },
  statusText: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  sectionCard: {
    backgroundColor: AnalyticsTheme.colors.card,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderWidth: 1,
    padding: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberCountBadge: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  sectionEyebrow: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 1,
  },
  sectionTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: AnalyticsTheme.typography.weightBold,
    marginTop: 4,
  },
  sectionText: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  fieldLabel: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  helperText: {
    color: AnalyticsTheme.colors.amber,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.cyan,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 48,
  },
  primaryButtonText: {
    color: '#041B2D',
    fontSize: 14,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  buttonDisabled: { opacity: 0.45 },

  stack: { gap: 10, marginTop: 14 },
  inviteCard: {
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    padding: 14,
  },
  inviteHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  inviteEmail: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  inviteMeta: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  boldCyan: {
    color: AnalyticsTheme.colors.cyan,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: AnalyticsTheme.colors.amber,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    color: AnalyticsTheme.colors.amber,
    fontSize: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  inlineActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryInlineButton: {
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.emerald,
    borderRadius: AnalyticsTheme.borderRadius.small,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  primaryInlineButtonText: {
    color: '#062817',
    fontSize: 12,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  secondaryInlineButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: AnalyticsTheme.colors.rose,
    borderWidth: 1,
    borderRadius: AnalyticsTheme.borderRadius.small,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  secondaryInlineButtonText: {
    color: AnalyticsTheme.colors.rose,
    fontSize: 12,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  ghostButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: AnalyticsTheme.colors.rose,
    borderWidth: 1,
    borderRadius: AnalyticsTheme.borderRadius.small,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 12,
  },
  ghostButtonText: {
    color: AnalyticsTheme.colors.rose,
    fontSize: 12,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },

  memberRow: {
    alignItems: 'flex-start',
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 16,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  memberTextGroup: { flex: 1 },
  memberName: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  memberMeta: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  memberPermission: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  memberActionCol: { alignItems: 'flex-end', gap: 6 },
  roleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  creatorBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: AnalyticsTheme.colors.emerald,
  },
  roleBadgeText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  creatorBadgeText: {
    color: AnalyticsTheme.colors.emerald,
  },
  memberActionButton: {
    alignItems: 'center',
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.small,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  memberActionText: {
    color: AnalyticsTheme.colors.rose,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },

  permissionsCard: {
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderWidth: 1,
    padding: 18,
  },
  permissionsEyebrow: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  permissionItem: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
});
