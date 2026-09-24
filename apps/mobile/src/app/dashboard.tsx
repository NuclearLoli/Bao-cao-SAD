import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { formatMoney, useDemoFinance } from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';

export default function DashboardScreen() {
  const { state: authState, sharedHousehold } = useAuthSession();
  const { state } = useHousehold();
  const finance = useDemoFinance();
  const navigate = (href: string) => router.push(href as never);

  if (authState.status === 'loading') {
    return <LoadingState label="Đang khởi tạo account household…" />;
  }
  if (authState.status !== 'authenticated') {
    return <Redirect href="/auth/welcome" />;
  }

  if (state.status === 'loading' || state.status === 'creating') {
    return <LoadingState />;
  }
  if (state.status !== 'ready') {
    return <Redirect href="/" />;
  }
  if (!finance.isReady) {
    return <LoadingState label="Đang tải dữ liệu tổng quan…" />;
  }

  const completionRatio = finance.totalBudgeted > 0 ? finance.totalSpent / finance.totalBudgeted : 0;
  const needsBudgetSetup =
    finance.monthlyIncome === 0 && finance.totalBudgeted === 0 && finance.totalSpent === 0 && finance.transactions.length === 0;

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="BẢN WEB DEMO"
        title={`Xin chào, ${authState.account.displayName}`}
        subtitle={`Bạn đang quản lý household "${state.aggregate.household.name}". Dashboard này đã bám theo account/household hiện tại thay vì dùng số liệu cố định.`}
        actionLabel="Thêm giao dịch"
        onActionPress={() => navigate('/transactions/new')}
      />

      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{needsBudgetSetup ? 'Bắt đầu setup' : 'Tháng này'}</Text>
        </View>
        <Text style={styles.heroAmount}>{needsBudgetSetup ? 'Chưa cấu hình' : formatMoney(finance.remainingBudget)}</Text>
        <Text style={styles.heroCaption}>
          {needsBudgetSetup
            ? 'Household này chưa có thu nhập, phân bổ quỹ hay giao dịch. Vào tab Ngân sách để tự setup số liệu ban đầu.'
            : 'Ngân sách còn lại trước khi chạm mốc đỏ.'}
        </Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(Math.max(completionRatio * 100, 8), 100)}%` }]} />
        </View>
        <Text style={styles.heroFootnote}>{finance.householdPulse}</Text>
      </View>

      {needsBudgetSetup ? (
        <Pressable accessibilityRole="button" onPress={() => navigate('/budget/setup')} style={styles.setupCard}>
          <Text style={styles.setupEyebrow}>THIẾT LẬP BAN ĐẦU</Text>
          <Text style={styles.setupTitle}>Tự nhập số liệu cho household này</Text>
          <Text style={styles.setupText}>
            Chỉnh thu nhập tháng, phân bổ 4 quỹ và sau đó dashboard sẽ cập nhật ngay theo dữ liệu bạn vừa lưu.
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.statsGrid}>
        <MetricCard label="Thu nhập tháng" value={formatMoney(finance.monthlyIncome)} tone="dark" />
        <MetricCard label="Đã phân bổ" value={formatMoney(finance.totalBudgeted)} tone="light" />
        <MetricCard label="Đã chi" value={formatMoney(finance.totalSpent)} tone="light" />
        <MetricCard label="Giao dịch" value={String(finance.transactions.length)} tone="light" />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>LỐI ĐI NHANH</Text>
          <Text style={styles.sectionTitle}>Các màn sẵn để demo tiếp</Text>
        </View>
        <View style={styles.actionGrid}>
          <ActionTile
            title="Cấu hình ngân sách"
            description="Xem 4 quỹ, nhịp payday và mức dùng từng quỹ."
            onPress={() => navigate('/budget/setup')}
          />
          <ActionTile
            title="Danh sách giao dịch"
            description="Xem dòng tiền gần đây theo danh mục và quỹ."
            onPress={() => navigate('/transactions')}
          />
          <ActionTile
            title="Ghi giao dịch mới"
            description="Nhập nhanh khoản chi hoặc khoản bù quỹ."
            onPress={() => navigate('/transactions/new')}
          />
          <ActionTile
            title="Chia sẻ household"
            description="Xem 2 tài khoản đồng quản lý với quyền tương đương."
            onPress={() => navigate('/household/share')}
          />
        </View>
      </View>

      {sharedHousehold ? (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionEyebrow}>ĐỒNG QUẢN LÝ</Text>
            <Text style={styles.sectionTitle}>Hai account cùng giữ household này</Text>
          </View>
          <View style={styles.membersList}>
            {sharedHousehold.members.map((member) => (
              <View key={member.accountId} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{member.displayName.slice(0, 1)}</Text>
                </View>
                <View style={styles.memberTextGroup}>
                  <Text style={styles.memberName}>{member.displayName}</Text>
                  <Text style={styles.memberMeta}>{member.accessLabel}</Text>
                </View>
                <Text style={styles.memberPermission}>Quyền ngang nhau</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>5 QUỸ CHÍNH</Text>
          <Text style={styles.sectionTitle}>Tổng quan tình trạng từng quỹ</Text>
        </View>
        <View style={styles.fundsList}>
          {finance.funds.map((fund) => {
            const ratio = fund.allocated > 0 ? Math.min(fund.spent / fund.allocated, 1) : 0;
            return (
              <View key={fund.id} style={styles.fundCard}>
                <View style={styles.fundRow}>
                  <View style={[styles.fundDot, { backgroundColor: fund.color }]} />
                  <View style={styles.fundTextGroup}>
                    <Text style={styles.fundName}>{fund.name}</Text>
                    <Text style={styles.fundDescription}>{fund.description}</Text>
                  </View>
                </View>
                <View style={styles.fundValues}>
                  <Text style={styles.fundSpent}>{formatMoney(fund.spent)}</Text>
                  <Text style={styles.fundAllocated}>/ {formatMoney(fund.allocated)}</Text>
                </View>
                <View style={styles.fundTrack}>
                  <View
                    style={[
                      styles.fundFill,
                      { width: `${Math.max(ratio * 100, 8)}%`, backgroundColor: fund.color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>NHỊP GẦN ĐÂY</Text>
          <Text style={styles.sectionTitle}>Ba giao dịch mới nhất</Text>
        </View>
        <View style={styles.transactionsList}>
          {finance.transactions.slice(0, 3).map((transaction) => (
            <View key={transaction.id} style={styles.transactionRow}>
              <View style={styles.transactionTextGroup}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionMeta}>
                  {transaction.category} · {transaction.dateLabel}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.type === 'income' ? styles.amountPositive : styles.amountNegative,
                ]}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatMoney(transaction.amount)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <PrimaryTabBar />
    </AppScreen>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'dark' | 'light';
}) {
  return (
    <View style={[styles.metricCard, tone === 'dark' ? styles.metricCardDark : styles.metricCardLight]}>
      <Text style={[styles.metricLabel, tone === 'dark' ? styles.metricLabelDark : null]}>{label}</Text>
      <Text style={[styles.metricValue, tone === 'dark' ? styles.metricValueDark : null]}>{value}</Text>
    </View>
  );
}

function ActionTile({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionTile}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 18, paddingBottom: 32 },
  heroCard: {
    backgroundColor: '#163B29',
    borderRadius: 28,
    padding: 24,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#255A3F',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeText: { color: '#DFF8E8', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  heroAmount: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginTop: 18 },
  heroCaption: { color: '#CDE4D5', fontSize: 15, lineHeight: 22, marginTop: 6 },
  progressTrack: {
    backgroundColor: 'rgba(220, 252, 231, 0.18)',
    borderRadius: 999,
    height: 12,
    marginTop: 22,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: '#7BE0A2', borderRadius: 999, height: '100%' },
  heroFootnote: { color: '#D7E6DC', fontSize: 13, lineHeight: 20, marginTop: 12 },
  setupCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F4D38A',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  setupEyebrow: { color: '#9A6700', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  setupTitle: { color: '#7C2D12', fontSize: 20, fontWeight: '900', marginTop: 8 },
  setupText: { color: '#7C5D28', fontSize: 14, lineHeight: 22, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: {
    borderRadius: 22,
    minHeight: 108,
    padding: 18,
    width: '47%',
  },
  metricCardDark: { backgroundColor: '#E8F5EC' },
  metricCardLight: { backgroundColor: '#FFFFFF', borderColor: '#D9E5DE', borderWidth: 1 },
  metricLabel: { color: '#607066', fontSize: 12, fontWeight: '800', letterSpacing: 0.9 },
  metricLabelDark: { color: '#285D3D' },
  metricValue: { color: '#15211B', fontSize: 24, fontWeight: '900', lineHeight: 30, marginTop: 14 },
  metricValueDark: { color: '#14532D' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5DF',
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
  },
  sectionHeading: { marginBottom: 16 },
  sectionEyebrow: { color: '#6A7A70', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  sectionTitle: { color: '#17231D', fontSize: 22, fontWeight: '800', lineHeight: 28, marginTop: 6 },
  actionGrid: { gap: 12 },
  actionTile: {
    backgroundColor: '#F7FAF8',
    borderColor: '#E0E8E3',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  actionTitle: { color: '#183124', fontSize: 16, fontWeight: '800' },
  actionDescription: { color: '#68776E', fontSize: 13, lineHeight: 20, marginTop: 6 },
  fundsList: { gap: 14 },
  fundCard: { gap: 12 },
  fundRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  fundDot: { borderRadius: 999, height: 12, width: 12 },
  fundTextGroup: { flex: 1 },
  fundName: { color: '#17231D', fontSize: 16, fontWeight: '800' },
  fundDescription: { color: '#6A7A70', fontSize: 13, lineHeight: 20, marginTop: 2 },
  fundValues: { alignItems: 'baseline', flexDirection: 'row', gap: 4 },
  fundSpent: { color: '#17231D', fontSize: 18, fontWeight: '900' },
  fundAllocated: { color: '#708078', fontSize: 13, fontWeight: '700' },
  fundTrack: {
    backgroundColor: '#EDF2EE',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  fundFill: { borderRadius: 999, height: '100%' },
  transactionsList: { gap: 14 },
  transactionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionTextGroup: { flex: 1, paddingRight: 16 },
  transactionTitle: { color: '#18251E', fontSize: 15, fontWeight: '800' },
  transactionMeta: { color: '#6A7A70', fontSize: 12, marginTop: 4 },
  transactionAmount: { fontSize: 15, fontWeight: '900' },
  amountPositive: { color: '#0F766E' },
  amountNegative: { color: '#B45309' },
  membersList: { gap: 12 },
  memberRow: {
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    borderColor: '#E2EAE5',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: '#DCF5E5',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  memberAvatarText: { color: '#166534', fontSize: 18, fontWeight: '900' },
  memberTextGroup: { flex: 1 },
  memberName: { color: '#18251E', fontSize: 15, fontWeight: '800' },
  memberMeta: { color: '#6A7A70', fontSize: 12, marginTop: 3 },
  memberPermission: { color: '#165A36', fontSize: 12, fontWeight: '800' },
});
