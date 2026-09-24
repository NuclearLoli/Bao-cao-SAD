import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { ConfirmActionBar } from '@/components/confirm-action-bar';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { useHousehold } from '@/features/household/ui/household-provider';

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
      return 'Bạn đang có lời mời chờ phản hồi';
    }
    if (householdState.status === 'ready') {
      return 'Household riêng tư';
    }
    return 'Chưa bật cộng tác';
  }, [householdState, pendingShareInvites.length, sharedHousehold]);

  const statusText = useMemo(() => {
    if (sharedHousehold?.isDemoSharedHousehold) {
      return 'Đây là household mẫu của Nu và Mai để bạn demo nhanh luồng cùng quản lý quỹ chung.';
    }
    if (sharedHousehold) {
      return sharedHousehold.pendingInvites.length > 0
        ? `Đang có ${sharedHousehold.pendingInvites.length} lời mời chờ phản hồi. Thành viên hiện tại vẫn dùng chung một dashboard và cùng chỉnh dữ liệu.`
        : 'Các thành viên hiện tại đang dùng chung dashboard, ngân sách và giao dịch trong cùng một household.';
    }
    if (pendingShareInvites.length > 0) {
      return 'Bạn có thể chấp nhận lời mời để vào chung household, hoặc bỏ qua để giữ dữ liệu cá nhân riêng.';
    }
    if (householdState.status === 'ready') {
      return 'Household này hiện chỉ do bạn quản lý. Gửi lời mời để thêm một account cùng quản lý quỹ chung.';
    }
    return 'Tạo household trước hoặc nhận lời mời từ một household có sẵn để bắt đầu cộng tác.';
  }, [householdState.status, pendingShareInvites.length, sharedHousehold]);

  if (authState.status === 'loading') {
    return <LoadingState label="Đang tải chia sẻ household…" />;
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
        eyebrow="QUẢN LÝ CHIA SẺ"
        title="Cộng tác như một app thật"
        subtitle="Front-end này giờ có flow chia sẻ thật cho buổi demo: gửi lời mời, chấp nhận lời mời, xem pending invite và quản lý thành viên ngay trong app."
        backLabel="← Về dashboard"
      />

      <View style={styles.statusCard}>
        <Text style={styles.statusEyebrow}>TRẠNG THÁI HIỆN TẠI</Text>
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
          <Text style={styles.sectionTitle}>Bạn có thể tham gia household chung</Text>
          <View style={styles.stack}>
            {pendingShareInvites.map((invite) => (
              <View key={invite.id} style={styles.inviteCard}>
                <View style={styles.inviteHeader}>
                  <View>
                    <Text style={styles.inviteEmail}>{invite.invitedEmail}</Text>
                    <Text style={styles.inviteMeta}>
                      Mã mời {invite.code} · tạo ngày {invite.createdAtLabel}
                    </Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </View>
                <View style={styles.inlineActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setPendingAction({
                        title: 'Xác nhận tham gia household',
                        description:
                          'Sau khi chấp nhận, account này sẽ dùng chung dashboard, ngân sách và giao dịch với household được mời.',
                        confirmLabel: 'Tham gia ngay',
                        run: () => acceptShareInvite(invite.id),
                      })
                    }
                    style={styles.primaryInlineButton}>
                    <Text style={styles.primaryInlineButtonText}>Chấp nhận</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setPendingAction({
                        title: 'Xác nhận từ chối lời mời',
                        description:
                          'Lời mời này sẽ bị từ chối và account hiện tại vẫn giữ dữ liệu riêng của mình.',
                        confirmLabel: 'Từ chối lời mời',
                        tone: 'danger',
                        run: () => declineShareInvite(invite.id),
                      })
                    }
                    style={styles.secondaryInlineButton}>
                    <Text style={styles.secondaryInlineButtonText}>Từ chối</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {householdState.status === 'ready' || sharedHousehold ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>MỜI THÀNH VIÊN</Text>
          <Text style={styles.sectionTitle}>Thêm một account cùng quản lý</Text>
          <Text style={styles.sectionText}>
            Nhập email của người muốn cùng quản lý household. Sau khi họ đăng nhập bằng email đó,
            lời mời sẽ hiện ra để chấp nhận ngay.
          </Text>

          <Text style={styles.fieldLabel}>Email người được mời</Text>
          <TextInput
            accessibilityLabel="Email người được mời"
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(value) => {
              setInviteEmail(value);
              setFeedback(null);
              setPendingAction(null);
            }}
            placeholder="Ví dụ: mai@example.com"
            placeholderTextColor="#90A097"
            style={styles.input}
            value={inviteEmail}
          />

          <Text style={styles.helperText}>
            {feedback ??
              (sharedHousehold?.isDemoSharedHousehold
                ? 'Household mẫu Nu/Mai chỉ để xem demo nhanh. Hãy tạo account mới để demo flow mời thật.'
                : 'Gợi ý: tạo thêm một account demo khác, rồi đăng nhập account đó để chấp nhận lời mời.')}
          </Text>

          <Pressable
            accessibilityRole="button"
            disabled={!canManageHousehold || submitting}
            onPress={() =>
              setPendingAction({
                title: 'Xác nhận tạo lời mời chia sẻ',
                description:
                  'Lời mời sẽ được gửi vào front-end demo cho email này và người nhận có thể chấp nhận để vào cùng household.',
                confirmLabel: 'Tạo lời mời',
                run: submitInvite,
              })
            }
            style={[
              styles.primaryButton,
              !canManageHousehold || submitting ? styles.buttonDisabled : null,
            ]}>
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Đang tạo lời mời...' : 'Tạo lời mời chia sẻ'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {currentPendingInvites.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>LỜI MỜI ĐÃ GỬI</Text>
          <Text style={styles.sectionTitle}>Đang chờ thành viên phản hồi</Text>
          <View style={styles.stack}>
            {currentPendingInvites.map((invite) => (
              <View key={invite.id} style={styles.inviteCard}>
                <View style={styles.inviteHeader}>
                  <View>
                    <Text style={styles.inviteEmail}>{invite.invitedEmail}</Text>
                    <Text style={styles.inviteMeta}>
                      {invite.invitedDisplayName} · mã {invite.code}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    disabled={!canManageHousehold}
                    onPress={() =>
                      setPendingAction({
                        title: 'Xác nhận thu hồi lời mời',
                        description:
                          'Người nhận sẽ không còn thấy lời mời này nữa trong màn quản lý chia sẻ.',
                        confirmLabel: 'Thu hồi lời mời',
                        tone: 'danger',
                        run: () => revokeShareInvite(invite.id),
                      })
                    }
                    style={[styles.ghostButton, !canManageHousehold ? styles.buttonDisabled : null]}>
                    <Text style={styles.ghostButtonText}>Thu hồi</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {currentMembers.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>THÀNH VIÊN</Text>
          <Text style={styles.sectionTitle}>Danh sách đang cùng quản lý</Text>
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
                        {member.isCreator ? 'Creator' : 'Co-manager'}
                      </Text>
                    </View>
                    {canRemove ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          setPendingAction({
                            title: 'Xác nhận gỡ thành viên',
                            description:
                              'Thành viên này sẽ rời household chia sẻ và không còn chỉnh được dữ liệu chung nữa.',
                            confirmLabel: 'Gỡ thành viên',
                            tone: 'danger',
                            run: () => removeSharedMember(member.accountId),
                          })
                        }
                        style={styles.memberActionButton}>
                        <Text style={styles.memberActionText}>Gỡ</Text>
                      </Pressable>
                    ) : null}
                    {canLeave ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          setPendingAction({
                            title: 'Xác nhận rời household',
                            description:
                              'Account này sẽ rời nhóm cộng tác và quay về scope dữ liệu riêng của mình.',
                            confirmLabel: 'Rời household',
                            tone: 'danger',
                            run: () => leaveSharedHousehold(),
                          })
                        }
                        style={styles.memberActionButton}>
                        <Text style={styles.memberActionText}>Rời nhóm</Text>
                      </Pressable>
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
          <Text style={styles.sectionTitle}>Bạn chưa có household để chia sẻ</Text>
          <Text style={styles.sectionText}>
            Tạo household trước để có dashboard và dữ liệu riêng, sau đó quay lại đây để mời thêm
            một account cùng quản lý quỹ chung.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/household/create' as never)}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Tạo household ngay</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.permissionsCard}>
        <Text style={styles.sectionEyebrow}>QUYỀN TRUY CẬP</Text>
        <Text style={styles.permissionItem}>• Cùng xem dashboard và báo cáo trên cùng một household</Text>
        <Text style={styles.permissionItem}>• Cùng thêm hoặc xoá giao dịch để cập nhật dòng tiền</Text>
        <Text style={styles.permissionItem}>• Cùng chỉnh phân bổ quỹ và cấu hình ngân sách</Text>
        <Text style={styles.permissionItem}>• Cùng quản lý chia sẻ ở mức front-end demo hoàn chỉnh</Text>
      </View>

      <PrimaryTabBar />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 18, paddingBottom: 32 },
  statusCard: {
    backgroundColor: '#163B29',
    borderRadius: 28,
    padding: 22,
  },
  statusEyebrow: { color: '#9AD6B1', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  statusTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginTop: 10 },
  statusText: { color: '#D4E4DA', fontSize: 14, lineHeight: 22, marginTop: 10 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5DF',
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
  },
  permissionsCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F4D38A',
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
  },
  sectionEyebrow: { color: '#6A7A70', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  sectionTitle: { color: '#17231D', fontSize: 22, fontWeight: '900', marginTop: 6 },
  sectionText: { color: '#64736A', fontSize: 14, lineHeight: 22, marginTop: 10 },
  fieldLabel: { color: '#25372D', fontSize: 14, fontWeight: '800', marginBottom: 10, marginTop: 16 },
  input: {
    backgroundColor: '#FAFCFB',
    borderColor: '#C7D3CC',
    borderRadius: 16,
    borderWidth: 1.5,
    color: '#15211B',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  helperText: { color: '#8B5E12', fontSize: 13, lineHeight: 20, marginTop: 14 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#153E29',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 54,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  buttonDisabled: { opacity: 0.45 },
  stack: { gap: 12, marginTop: 16 },
  inviteCard: {
    backgroundColor: '#F8FBF9',
    borderColor: '#E2EAE5',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  inviteHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  inviteEmail: { color: '#15211B', fontSize: 15, fontWeight: '800' },
  inviteMeta: { color: '#6A7A70', fontSize: 12, marginTop: 4 },
  pendingBadge: {
    backgroundColor: '#E7F6EC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pendingBadgeText: { color: '#166534', fontSize: 11, fontWeight: '800' },
  inlineActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryInlineButton: {
    alignItems: 'center',
    backgroundColor: '#153E29',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  primaryInlineButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  secondaryInlineButton: {
    alignItems: 'center',
    backgroundColor: '#EEF2EF',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  secondaryInlineButtonText: { color: '#4A5A51', fontSize: 13, fontWeight: '800' },
  ghostButton: {
    alignItems: 'center',
    backgroundColor: '#EEF2EF',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 84,
    paddingHorizontal: 14,
  },
  ghostButtonText: { color: '#4A5A51', fontSize: 13, fontWeight: '800' },
  memberRow: {
    alignItems: 'flex-start',
    backgroundColor: '#F7FAF8',
    borderColor: '#E2EAE5',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#DCF5E5',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: { color: '#166534', fontSize: 18, fontWeight: '900' },
  memberTextGroup: { flex: 1 },
  memberName: { color: '#18251E', fontSize: 15, fontWeight: '800' },
  memberMeta: { color: '#6A7A70', fontSize: 12, marginTop: 3 },
  memberPermission: { color: '#405148', fontSize: 13, lineHeight: 20, marginTop: 6 },
  memberActionCol: { alignItems: 'flex-end', gap: 8 },
  roleBadge: {
    backgroundColor: '#E6F5EB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  creatorBadge: { backgroundColor: '#153E29' },
  roleBadgeText: { color: '#165A36', fontSize: 11, fontWeight: '800' },
  creatorBadgeText: { color: '#FFFFFF' },
  memberActionButton: {
    alignItems: 'center',
    borderColor: '#D3DDD6',
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 82,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  memberActionText: { color: '#43534A', fontSize: 12, fontWeight: '800' },
  permissionItem: { color: '#7C5D28', fontSize: 14, lineHeight: 22, marginTop: 10 },
});
