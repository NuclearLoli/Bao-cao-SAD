import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { formatMoney, useDemoFinance } from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export default function WeeklyCheckInScreen() {
  const { state: authState } = useAuthSession();
  const { state } = useHousehold();
  const finance = useDemoFinance();
  const navigate = (href: string) => router.push(href as never);

  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [hasConfirmedThisSession, setHasConfirmedThisSession] = useState(false);

  // Tính toán số liệu tuần
  const now = new Date();
  const currentDay = now.getDate() || 15;
  const daysInMonth = 30;
  const daysElapsed = Math.max(1, currentDay);

  const totalSpent = finance.totalSpent;
  const avgDailySpent = Math.round(totalSpent / daysElapsed);
  const projectedEOMSpent = avgDailySpent * daysInMonth;
  const isOverBudgetProjected = projectedEOMSpent > finance.totalBudgeted && finance.totalBudgeted > 0;
  const burnRateStatus = isOverBudgetProjected ? 'danger' : projectedEOMSpent > finance.totalBudgeted * 0.85 ? 'warning' : 'safe';

  // Dự báo ngày hết tiền quỹ gia đình & con
  const familyFund = finance.funds.find((f) => f.id === 'family');
  const familyDailyAvg = familyFund ? Math.round(familyFund.spent / daysElapsed) : 0;
  const daysUntilFamilyExhausted =
    familyDailyAvg > 0 && familyFund ? Math.round((familyFund.allocated - familyFund.spent) / familyDailyAvg) : 99;
  const estimatedDepletionDay = Math.min(daysInMonth, currentDay + Math.max(1, daysUntilFamilyExhausted));

  // Top 5 giao dịch lớn nhất
  const topExpenses = useMemo(() => {
    return [...finance.transactions]
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [finance.transactions]);

  if (authState.status === 'loading') {
    return <LoadingState label="Đang tải phiên làm việc…" />;
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
    return <LoadingState label="Đang tải dữ liệu check-in tuần…" />;
  }

  const aiSuggestions = [
    {
      id: 1,
      title: 'Giảm 2 bữa ăn ngoài cuối tuần',
      saving: 650000,
      description: 'Chuyển sang nấu lẩu tại nhà hoặc chuẩn bị cơm gia đình. Ít ảnh hưởng nhất đến sinh hoạt chung.',
    },
    {
      id: 2,
      title: 'Gộp đơn sàn TMĐT & hoãn mua sắm đồ vặt',
      saving: 800000,
      description: 'Tạm dừng mua đồ trang trí và thiết bị gia dụng chưa thực sự cấp bách sang kỳ lương tiếp theo.',
    },
    {
      id: 3,
      title: 'Điều chuyển 500k từ Quỹ Mục tiêu sang Quỹ Gia đình',
      saving: 500000,
      description: 'Bù đắp chi phí phát sinh cho bé tháng này mà không phải thắt chặt cực đoan.',
    },
  ];

  const handleConfirmCheckIn = () => {
    const chosenPlan = aiSuggestions.find((p) => p.id === selectedPlan);
    finance.confirmWeeklyCheckIn({
      agreedBy: 'Chồng & Vợ',
      tradeOffDecision: chosenPlan
        ? `Đã chọn: ${chosenPlan.title} (dự kiến tiết kiệm ${formatMoney(chosenPlan.saving)})`
        : 'Hai vợ chồng đã rà soát và thống nhất duy trì nhịp chi hiện tại.',
    });
    setHasConfirmedThisSession(true);
  };

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="WEEKLY MONEY DATE & EOM FORECAST"
        title="Check-in 15 Phút Tuần"
        subtitle="Rà soát định kỳ cùng vợ/chồng mỗi Chủ nhật: Nắm bắt các khoản chi lớn, xem tốc độ cạn quỹ và chọn giải pháp điều chỉnh từ AI."
        backLabel="← Về dashboard"
      />

      {/* Burn Rate Telemetry Card */}
      <View style={styles.pulseCard}>
        <View style={styles.pulseHeader}>
          <Text style={styles.pulseBadge}>BURN RATE VELOCITY</Text>
          <View style={[styles.statusDot, burnRateStatus === 'danger' ? styles.dotRed : burnRateStatus === 'warning' ? styles.dotYellow : styles.dotGreen]} />
        </View>

        <Text style={styles.pulseAmount}>{formatMoney(avgDailySpent)} / ngày</Text>
        <Text style={styles.pulseHint}>Tốc độ chi tiêu bình quân của gia đình</Text>

        <View style={styles.forecastBox}>
          <Text style={styles.forecastTitle}>
            {burnRateStatus === 'danger'
              ? '⚠️ Cảnh báo: Nguy cơ cạn Quỹ Gia đình sớm!'
              : burnRateStatus === 'warning'
              ? '⚡ Chú ý: Nhịp chi tiêu đang tiệm cận trần ngân sách'
              : '✅ Nhịp chi tiêu hiện tại đang nằm trong vùng an toàn'}
          </Text>
          <Text style={styles.forecastText}>
            Dự báo cuối tháng gia đình sẽ chi khoảng{' '}
            <Text style={styles.boldText}>{formatMoney(projectedEOMSpent)}</Text>
            {isOverBudgetProjected
              ? ` (vượt ${formatMoney(projectedEOMSpent - finance.totalBudgeted)} so với ngân sách ${formatMoney(finance.totalBudgeted)}).`
              : ` (trong giới hạn ngân sách ${formatMoney(finance.totalBudgeted)}).`}
          </Text>
          {familyFund && isOverBudgetProjected ? (
            <Text style={styles.exhaustionAlert}>
              ⏳ Với nhịp này, Quỹ Gia đình & Con dự kiến sẽ cạn vào khoảng{' '}
              <Text style={styles.boldWhite}>ngày {estimatedDepletionDay}</Text> của tháng.
            </Text>
          ) : null}
        </View>
      </View>

      {/* Top 5 chi tiêu lớn nhất */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Top 5 khoản chi lớn nhất tuần qua</Text>
        <Text style={styles.sectionSubtitle}>
          Cùng nhìn lại để biết tiền chủ yếu đã đi vào đâu:
        </Text>

        <View style={styles.topList}>
          {topExpenses.map((txn, idx) => (
            <View key={txn.id} style={styles.topRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{idx + 1}</Text>
              </View>
              <View style={styles.topBody}>
                <Text style={styles.topTitle}>{txn.title}</Text>
                <Text style={styles.topMeta}>
                  {txn.category} • {txn.paidBy === 'husband' ? 'Chồng trả' : txn.paidBy === 'wife' ? 'Vợ trả' : 'Chung'}
                </Text>
              </View>
              <Text style={styles.topAmount}>{formatMoney(txn.amount)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* AI Trợ lý gợi ý điều chỉnh ít đau nhất */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🤖 Gợi ý điều chỉnh "ít đau nhất" từ AI</Text>
        <Text style={styles.sectionSubtitle}>
          Không cần thắt lưng buộc bụng cực đoan. Chọn 1 phương án phù hợp để đưa ngân sách về vùng an toàn:
        </Text>

        <View style={styles.aiPlans}>
          {aiSuggestions.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <AnimatedPressable
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                style={[styles.planCard, isSelected ? styles.planCardActive : null]}>
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planSaving}>Tiết kiệm ~{formatMoney(plan.saving)}</Text>
                </View>
                <Text style={styles.planDesc}>{plan.description}</Text>
                <View style={styles.planFooter}>
                  <Text style={[styles.selectRadio, isSelected ? styles.radioActive : null]}>
                    {isSelected ? '✓ Đã chọn phương án này' : 'Bấm để chọn'}
                  </Text>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>

        {hasConfirmedThisSession ? (
          <View style={styles.confirmedBanner}>
            <Text style={styles.confirmedEmoji}>🎉</Text>
            <Text style={styles.confirmedTitle}>Check-in tuần đã hoàn tất!</Text>
            <Text style={styles.confirmedText}>
              Cả hai vợ chồng đã thống nhất và ghi nhận mục tiêu tuần này.
            </Text>
          </View>
        ) : (
          <AnimatedPressable onPress={handleConfirmCheckIn} style={styles.confirmCheckInBtn}>
            <Text style={styles.confirmCheckInBtnText}>
              🤝 Hai vợ chồng cùng duyệt & Lưu tuần này
            </Text>
          </AnimatedPressable>
        )}
      </View>

      {/* Lịch sử Check-in các tuần trước */}
      {finance.checkInRecords.length > 0 ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Lịch sử các tuần đã check-in</Text>
          <View style={styles.historyList}>
            {finance.checkInRecords.map((record) => (
              <View key={record.id} style={styles.historyItem}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyWeek}>{record.weekLabel}</Text>
                  <Text style={styles.historyDate}>{record.agreedAt}</Text>
                </View>
                <Text style={styles.historySpent}>
                  Đã chi: <Text style={styles.boldWhite}>{formatMoney(record.totalSpent)}</Text>
                </Text>
                {record.tradeOffDecision ? (
                  <Text style={styles.historyDecision}>{record.tradeOffDecision}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <PrimaryTabBar />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 16, paddingBottom: 24 },
  pulseCard: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginTop: 10,
  },
  pulseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pulseBadge: { color: AnalyticsTheme.colors.cyan, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotGreen: { backgroundColor: AnalyticsTheme.colors.emerald },
  dotYellow: { backgroundColor: AnalyticsTheme.colors.amber },
  dotRed: { backgroundColor: AnalyticsTheme.colors.rose },
  pulseAmount: { color: AnalyticsTheme.colors.textPrimary, fontSize: 26, fontWeight: '900', marginTop: 8 },
  pulseHint: { color: AnalyticsTheme.colors.textMuted, fontSize: 12, marginTop: 2 },
  forecastBox: {
    backgroundColor: '#182235',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  forecastTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 13, fontWeight: '800' },
  forecastText: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 },
  exhaustionAlert: { color: AnalyticsTheme.colors.rose, fontSize: 12, fontWeight: '700', marginTop: 6 },
  boldText: { fontWeight: '800', color: AnalyticsTheme.colors.cyan },
  boldWhite: { fontWeight: '800', color: AnalyticsTheme.colors.textPrimary },

  sectionCard: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  sectionTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3, marginBottom: 14 },

  topList: { gap: 8 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
  },
  rankBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: { color: AnalyticsTheme.colors.cyan, fontSize: 11, fontWeight: '800' },
  topBody: { flex: 1 },
  topTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 13, fontWeight: '700' },
  topMeta: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, marginTop: 1 },
  topAmount: { color: AnalyticsTheme.colors.rose, fontSize: 13, fontWeight: '800' },

  aiPlans: { gap: 10 },
  planCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
  },
  planCardActive: {
    backgroundColor: '#182235',
    borderColor: AnalyticsTheme.colors.cyan,
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 13, fontWeight: '800', flex: 1 },
  planSaving: { color: AnalyticsTheme.colors.emerald, fontSize: 12, fontWeight: '800', marginLeft: 8 },
  planDesc: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 4 },
  planFooter: { marginTop: 8 },
  selectRadio: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, fontWeight: '700' },
  radioActive: { color: AnalyticsTheme.colors.cyan, fontWeight: '800' },

  confirmCheckInBtn: {
    backgroundColor: AnalyticsTheme.colors.emerald,
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  confirmCheckInBtnText: { color: '#090D16', fontSize: 14, fontWeight: '900' },

  confirmedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  confirmedEmoji: { fontSize: 28 },
  confirmedTitle: { color: AnalyticsTheme.colors.emerald, fontSize: 15, fontWeight: '800', marginTop: 4 },
  confirmedText: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, marginTop: 2, textAlign: 'center' },

  historyList: { gap: 8 },
  historyItem: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between' },
  historyWeek: { color: AnalyticsTheme.colors.textPrimary, fontSize: 12, fontWeight: '800' },
  historyDate: { color: AnalyticsTheme.colors.textMuted, fontSize: 11 },
  historySpent: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  historyDecision: { color: AnalyticsTheme.colors.cyan, fontSize: 11, marginTop: 2, fontStyle: 'italic' },
});
