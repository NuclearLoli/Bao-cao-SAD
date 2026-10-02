import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { formatMoney, useDemoFinance } from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';
import { useAppSecurity } from '@/features/security/ui/app-security-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export default function DashboardScreen() {
  const { state: authState, sharedHousehold } = useAuthSession();
  const { state } = useHousehold();
  const finance = useDemoFinance();
  const { formatMoneySecure, togglePrivacyMode, isPrivacyMode } = useAppSecurity();
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
    return <LoadingState label="Đang đồng bộ telemetry tài chính…" />;
  }

  const completionRatio = finance.totalBudgeted > 0 ? finance.totalSpent / finance.totalBudgeted : 0;
  const needsBudgetSetup =
    finance.monthlyIncome === 0 && finance.totalBudgeted === 0 && finance.totalSpent === 0 && finance.transactions.length === 0;

  const husbandPocketRemaining = Math.max(0, finance.couple.husbandPocketMoney - finance.couple.husbandPocketSpent);
  const wifePocketRemaining = Math.max(0, finance.couple.wifePocketMoney - finance.couple.wifePocketSpent);
  const unpaidBillsCount = finance.bills.filter((b) => !b.isPaid).length;

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="FINANCIAL TELEMETRY & ANALYTICS"
        title={`Xin chào, ${authState.account.displayName}`}
        subtitle={`Bảng điều khiển dòng tiền hộ gia đình "${state.aggregate.household.name}". Phân tích nhịp tiêu, tự động cảnh báo cạn quỹ và minh bạch chi tiêu 2 người.`}
        profileName={authState.account.displayName}
        onProfilePress={() => navigate('/account')}
        actionLabel="Ghi khoản mới"
        onActionPress={() => navigate('/transactions/new')}
      />

      {/* Main Analytics Terminal Hero Card */}
      <View style={styles.terminalCard}>
        <View style={styles.terminalHeader}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>BUDGET ROOM MONITOR</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AnimatedPressable onPress={togglePrivacyMode} style={styles.privacyToggleBtn}>
              <Ionicons
                name={isPrivacyMode ? 'eye-off-outline' : 'eye-outline'}
                size={13}
                color={AnalyticsTheme.colors.cyan}
              />
              <Text style={styles.privacyToggleBtnText}>
                {isPrivacyMode ? 'Ẩn số' : 'Hiện'}
              </Text>
            </AnimatedPressable>
            <Text style={styles.cycleBadge}>Tháng {new Date().getMonth() + 1}/2026</Text>
          </View>
        </View>

        <Text style={styles.metricBigAmount}>
          {needsBudgetSetup
            ? 'Chưa cấu hình'
            : formatMoneySecure(finance.remainingBudget, formatMoney(finance.remainingBudget))}
        </Text>
        <Text style={styles.metricCaption}>
          {needsBudgetSetup
            ? 'Household này chưa có dữ liệu thu nhập và quỹ. Bấm nút setup bên dưới để bắt đầu.'
            : 'Hạn mức chi tiêu khả dụng còn lại của 4 quỹ chung gia đình trước ngưỡng báo động.'}
        </Text>

        {/* Progress Gauge */}
        <View style={styles.gaugeContainer}>
          <View style={styles.gaugeHeader}>
            <Text style={styles.gaugeLabel}>Tỷ lệ hấp thụ ngân sách</Text>
            <Text style={styles.gaugeValue}>{Math.round(completionRatio * 100)}%</Text>
          </View>
          <View style={styles.gaugeTrack}>
            <View
              style={[
                styles.gaugeFill,
                {
                  width: `${Math.min(Math.max(completionRatio * 100, 6), 100)}%`,
                  backgroundColor:
                    completionRatio > 0.9
                      ? AnalyticsTheme.colors.rose
                      : completionRatio > 0.75
                      ? AnalyticsTheme.colors.amber
                      : AnalyticsTheme.colors.emerald,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.pulseBar}>
          <Text style={styles.pulseText}>⚡ {finance.householdPulse}</Text>
        </View>
      </View>

      {/* Tiền tiêu vặt riêng 2 vợ chồng (Dual Pocket Monitor) */}
      <View style={styles.pocketCard}>
        <View style={styles.pocketHeader}>
          <View>
            <Text style={styles.pocketEyebrow}>VÍ TIÊU VẶT CÁ NHÂN (POCKET MONEY)</Text>
            <Text style={styles.pocketSubtitle}>Tự do chi tiêu riêng, không cần giải trình</Text>
          </View>
          <Text style={styles.pocketTag}>ĐỘC LẬP</Text>
        </View>

        <View style={styles.pocketGrid}>
          <View style={styles.pocketColumn}>
            <Text style={styles.pocketUser}>👨 Chồng còn lại</Text>
            <Text style={styles.pocketAmount}>
              {formatMoneySecure(husbandPocketRemaining, formatMoney(husbandPocketRemaining))}
            </Text>
            <Text style={styles.pocketCap}>
              Hạn mức: {formatMoneySecure(finance.couple.husbandPocketMoney, formatMoney(finance.couple.husbandPocketMoney))}
            </Text>
          </View>
          <View style={styles.pocketDivider} />
          <View style={styles.pocketColumn}>
            <Text style={styles.pocketUser}>👩 Vợ còn lại</Text>
            <Text style={styles.pocketAmount}>
              {formatMoneySecure(wifePocketRemaining, formatMoney(wifePocketRemaining))}
            </Text>
            <Text style={styles.pocketCap}>
              Hạn mức: {formatMoneySecure(finance.couple.wifePocketMoney, formatMoney(finance.couple.wifePocketMoney))}
            </Text>
          </View>
        </View>
      </View>

      {/* KPI Matrix (4 Data Tiles) */}
      <View style={styles.kpiGrid}>
        <MetricCard
          label="Tổng thu 2 người"
          value={formatMoneySecure(finance.monthlyIncome, formatMoney(finance.monthlyIncome))}
          accent="cyan"
        />
        <MetricCard
          label="Đã phân bổ 4 quỹ"
          value={formatMoneySecure(finance.totalBudgeted, formatMoney(finance.totalBudgeted))}
          accent="emerald"
        />
        <MetricCard
          label="Đã chi việc chung"
          value={formatMoneySecure(finance.totalSpent, formatMoney(finance.totalSpent))}
          accent="rose"
        />
        <MetricCard label="Giao dịch ghi nhận" value={String(finance.transactions.length)} accent="purple" />
      </View>

      {/* Core Analytic Actions (with tactile micro-spring animations) */}
      <View style={styles.analyticsSection}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>ACTIONABLE INSTRUMENTS</Text>
          <Text style={styles.sectionTitle}>Công cụ Phân tích & Vận hành</Text>
        </View>

        <View style={styles.actionGrid}>
          <ActionTile
            iconName="flash-outline"
            iconColor={AnalyticsTheme.colors.cyan}
            iconBg="rgba(56, 189, 248, 0.12)"
            title="Ghi nhận giao dịch thông minh"
            description="Bàn phím <5s, Quét SMS biến động số dư ngân hàng hoặc Chụp bill."
            onPress={() => navigate('/transactions/new')}
            badge="NHANH"
          />
          <ActionTile
            iconName="calendar-outline"
            iconColor={AnalyticsTheme.colors.emerald}
            iconBg="rgba(16, 185, 129, 0.12)"
            title="Money Date (Check-in 15' tuần)"
            description="Xem top chi phí tuần, dự báo tốc độ cạn quỹ EOM & gợi ý AI ít đau nhất."
            onPress={() => navigate('/weekly-checkin')}
            badge="CHỦ NHẬT"
          />
          <ActionTile
            iconName="flag-outline"
            iconColor={AnalyticsTheme.colors.purple}
            iconBg="rgba(168, 85, 247, 0.12)"
            title="Hóa đơn định kỳ & Quỹ Mục tiêu"
            description={`Theo dõi lịch đóng tiền điện nước, học phí và tiến độ tích lũy ${unpaidBillsCount > 0 ? `(${unpaidBillsCount} bill chưa đóng)` : ''}.`}
            onPress={() => navigate('/bills-and-goals')}
            badge={unpaidBillsCount > 0 ? `${unpaidBillsCount} BILL` : undefined}
          />
          <ActionTile
            iconName="stats-chart-outline"
            iconColor={AnalyticsTheme.colors.amber}
            iconBg="rgba(245, 158, 11, 0.12)"
            title="Chốt tháng & Đối soát đóng góp"
            description="Báo cáo 1 trang cuối tháng, đối soát Chồng/Vợ đã chi bao nhiêu và kết chuyển thặng dư."
            onPress={() => navigate('/monthly-close')}
          />
          <ActionTile
            iconName="options-outline"
            iconColor={AnalyticsTheme.colors.cyan}
            iconBg="rgba(56, 189, 248, 0.12)"
            title="Cấu hình ngân sách ngày nhận lương"
            description="Thiết lập lương 2 vợ chồng, tiền tiêu vặt riêng và 4 quỹ chung gia đình."
            onPress={() => navigate('/budget/setup')}
          />
          <ActionTile
            iconName="people-outline"
            iconColor={AnalyticsTheme.colors.indigo}
            iconBg="rgba(99, 102, 241, 0.12)"
            title="Chia sẻ & Quản lý thành viên"
            description="Mời vợ/chồng cùng đồng quản lý với quyền hạn xem và ghi chép bình đẳng."
            onPress={() => navigate('/household/share')}
          />
        </View>
      </View>

      {/* Bảng Đối soát Đóng góp 2 Vợ Chồng */}
      <View style={styles.analyticsSection}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>SETTLEMENT & CONTRIBUTIONS</Text>
          <Text style={styles.sectionTitle}>Đối soát Đóng góp Tháng này</Text>
        </View>

        <View style={styles.settlementCard}>
          <View style={styles.settlementRow}>
            <View style={styles.settlementBox}>
              <Text style={styles.settlementName}>👨 Chồng đã chi chung</Text>
              <Text style={styles.settlementAmount}>{formatMoney(finance.settlement.husbandSpentForShared)}</Text>
            </View>
            <View style={styles.settlementBox}>
              <Text style={styles.settlementName}>👩 Vợ đã chi chung</Text>
              <Text style={styles.settlementAmount}>{formatMoney(finance.settlement.wifeSpentForShared)}</Text>
            </View>
          </View>
          <View style={styles.settlementFooter}>
            <Text style={styles.settlementDelta}>
              Chênh lệch đóng góp: <Text style={styles.boldWhite}>{formatMoney(finance.settlement.difference)}</Text>
            </Text>
            <Text style={styles.settlementStatus}>⚖️ Đang chia sẻ trách nhiệm tài chính công bằng</Text>
          </View>
        </View>
      </View>

      {/* 4 Quỹ & Room telemetry */}
      <View style={styles.analyticsSection}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>FUNDS ALLOCATION TELEMETRY</Text>
          <Text style={styles.sectionTitle}>Tình trạng Sử dụng 4 Quỹ</Text>
        </View>

        <View style={styles.fundsList}>
          {finance.funds.map((fund) => {
            const ratio = fund.allocated > 0 ? Math.min(fund.spent / fund.allocated, 1) : 0;
            const remaining = fund.allocated - fund.spent;
            const isOver = remaining < 0;

            return (
              <View key={fund.id} style={styles.fundCard}>
                <View style={styles.fundTopRow}>
                  <View style={styles.fundTitleGroup}>
                    <View style={[styles.fundDot, { backgroundColor: fund.color }]} />
                    <Text style={styles.fundName}>{fund.name}</Text>
                  </View>
                  <View style={[styles.statusBadge, isOver ? styles.badgeDanger : styles.badgeOk]}>
                    <Text style={[styles.statusBadgeText, isOver ? styles.badgeTextDanger : styles.badgeTextOk]}>
                      {isOver ? `VƯỢT ${formatMoney(Math.abs(remaining))}` : `CÒN ${formatMoney(remaining)}`}
                    </Text>
                  </View>
                </View>

                <Text style={styles.fundDesc}>{fund.description}</Text>

                <View style={styles.fundMeter}>
                  <View
                    style={[
                      styles.fundMeterFill,
                      {
                        width: `${Math.max(ratio * 100, 6)}%`,
                        backgroundColor: isOver ? AnalyticsTheme.colors.rose : fund.color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.fundNumbers}>
                  <Text style={styles.fundSpentText}>Đã chi: {formatMoney(fund.spent)}</Text>
                  <Text style={styles.fundAllocText}>Hạn mức: {formatMoney(fund.allocated)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Giao dịch gần đây */}
      <View style={styles.analyticsSection}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>ACTIVITY FEED</Text>
          <Text style={styles.sectionTitle}>Ba Giao dịch Mới nhất</Text>
        </View>

        <View style={styles.recentTxnList}>
          {finance.transactions.slice(0, 3).map((transaction) => (
            <View key={transaction.id} style={styles.txnItem}>
              <View style={styles.txnLeft}>
                <Text style={styles.txnTitle}>{transaction.title}</Text>
                <Text style={styles.txnMeta}>
                  {transaction.category} • {transaction.dateLabel} • {transaction.paidBy === 'husband' ? 'Chồng' : transaction.paidBy === 'wife' ? 'Vợ' : 'Chung'}
                </Text>
              </View>
              <Text
                style={[
                  styles.txnAmount,
                  transaction.type === 'income' ? styles.positiveText : styles.negativeText,
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
  accent,
}: {
  label: string;
  value: string;
  accent: 'cyan' | 'emerald' | 'rose' | 'purple';
}) {
  const accentColor =
    accent === 'cyan'
      ? AnalyticsTheme.colors.cyan
      : accent === 'emerald'
      ? AnalyticsTheme.colors.emerald
      : accent === 'rose'
      ? AnalyticsTheme.colors.rose
      : AnalyticsTheme.colors.purple;

  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricBar, { backgroundColor: accentColor }]} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricVal}>{value}</Text>
    </View>
  );
}

function ActionTile({
  iconName,
  iconColor,
  iconBg,
  title,
  description,
  badge,
  onPress,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  description: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable accessibilityRole="button" onPress={onPress} style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <View style={[styles.actionIconContainer, { backgroundColor: iconBg ?? 'rgba(56, 189, 248, 0.12)' }]}>
          <Ionicons name={iconName} size={16} color={iconColor ?? AnalyticsTheme.colors.cyan} />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
        {badge ? (
          <View style={styles.actionBadge}>
            <Text style={styles.actionBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.actionDesc}>{description}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 16, paddingBottom: 24 },

  // Terminal Hero Card
  terminalCard: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AnalyticsTheme.colors.cyan,
  },
  livePillText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cycleBadge: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  metricBigAmount: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  metricCaption: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 5,
  },
  gaugeContainer: { marginTop: 16 },
  gaugeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  gaugeLabel: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, fontWeight: '700' },
  gaugeValue: { color: AnalyticsTheme.colors.textPrimary, fontSize: 12, fontWeight: '800' },
  gaugeTrack: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  gaugeFill: { height: '100%', borderRadius: 4 },
  pulseBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
  },
  pulseText: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  // Pocket Money Card
  pocketCard: {
    backgroundColor: '#111827',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  pocketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pocketEyebrow: {
    color: AnalyticsTheme.colors.purple,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pocketSubtitle: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  pocketTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    color: AnalyticsTheme.colors.purple,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pocketGrid: { flexDirection: 'row', alignItems: 'center' },
  pocketColumn: { flex: 1, alignItems: 'center' },
  pocketDivider: { width: 1, height: 44, backgroundColor: '#1E293B' },
  pocketUser: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  pocketAmount: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
  },
  pocketCap: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, marginTop: 2 },

  // KPI Grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    flex: 1,
    minWidth: '47%',
    position: 'relative',
    overflow: 'hidden',
  },
  metricBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
  },
  metricLabel: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  metricVal: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 8,
  },

  // Analytics Section
  analyticsSection: { gap: 12 },
  sectionHeading: { marginBottom: 2 },
  sectionEyebrow: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },

  // Action Grid
  actionGrid: { gap: 10 },
  actionCard: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  privacyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  privacyToggleBtnText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 11,
    fontWeight: '700',
  },
  actionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  actionBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionBadgeText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 10,
    fontWeight: '800',
  },
  actionDesc: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
    marginLeft: 42,
  },

  // Settlement Card
  settlementCard: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  settlementRow: { flexDirection: 'row', gap: 10 },
  settlementBox: {
    flex: 1,
    backgroundColor: '#182235',
    borderRadius: 14,
    padding: 12,
  },
  settlementName: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  settlementAmount: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  settlementFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 10,
  },
  settlementDelta: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12 },
  boldWhite: { color: AnalyticsTheme.colors.textPrimary, fontWeight: '800' },
  settlementStatus: {
    color: AnalyticsTheme.colors.emerald,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  // Funds List
  fundsList: { gap: 10 },
  fundCard: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  fundTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fundDot: { width: 10, height: 10, borderRadius: 5 },
  fundName: { color: AnalyticsTheme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeOk: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  badgeDanger: { backgroundColor: 'rgba(244, 63, 94, 0.15)' },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  badgeTextOk: { color: AnalyticsTheme.colors.emerald },
  badgeTextDanger: { color: AnalyticsTheme.colors.rose },
  fundDesc: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, marginTop: 4 },
  fundMeter: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
  },
  fundMeterFill: { height: '100%', borderRadius: 3 },
  fundNumbers: { flexDirection: 'row', justifyContent: 'space-between' },
  fundSpentText: { color: AnalyticsTheme.colors.textSecondary, fontSize: 11, fontWeight: '700' },
  fundAllocText: { color: AnalyticsTheme.colors.textMuted, fontSize: 11 },

  // Recent Txn
  recentTxnList: { gap: 8 },
  txnItem: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txnLeft: { flex: 1, paddingRight: 10 },
  txnTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 13, fontWeight: '800' },
  txnMeta: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, marginTop: 2 },
  txnAmount: { fontSize: 13, fontWeight: '900' },
  positiveText: { color: AnalyticsTheme.colors.emerald },
  negativeText: { color: AnalyticsTheme.colors.rose },
});
