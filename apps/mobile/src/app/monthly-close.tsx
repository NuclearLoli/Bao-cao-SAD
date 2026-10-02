import { Redirect, router } from 'expo-router';
import { useState } from 'react';
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

export default function MonthlyCloseScreen() {
  const { state: authState } = useAuthSession();
  const { state } = useHousehold();
  const finance = useDemoFinance();
  const navigate = (href: string) => router.push(href as never);

  const [rolloverOption, setRolloverOption] = useState<'emergency' | 'goals'>('emergency');
  const [isMonthClosed, setIsMonthClosed] = useState(false);

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
    return <LoadingState label="Đang tải dữ liệu chốt tháng…" />;
  }

  const surplusOrDeficit = finance.monthlyIncome - finance.totalSpent;
  const savingsRate =
    finance.monthlyIncome > 0
      ? Math.max(0, Math.round(((finance.monthlyIncome - finance.totalSpent) / finance.monthlyIncome) * 100))
      : 0;

  const handleCloseMonth = () => {
    if (surplusOrDeficit > 0) {
      if (rolloverOption === 'emergency') {
        finance.addTransaction({
          title: 'Kết chuyển thặng dư cuối tháng sang Dự phòng',
          category: 'Dự phòng',
          amount: surplusOrDeficit,
          type: 'income',
          fundId: 'emergency',
          paidBy: 'shared',
          source: 'joint_fund',
          note: 'Chốt tháng tự động',
        });
      } else {
        finance.addTransaction({
          title: 'Kết chuyển thặng dư cuối tháng sang Quỹ Mục tiêu',
          category: 'Mục tiêu',
          amount: surplusOrDeficit,
          type: 'income',
          fundId: 'goals',
          paidBy: 'shared',
          source: 'joint_fund',
          note: 'Chốt tháng tự động',
        });
      }
    }
    setIsMonthClosed(true);
  };

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="TỔNG KẾT KỲ TÀI CHÍNH"
        title="Báo Cáo 1 Trang Chốt Tháng"
        subtitle="Khép lại tháng cũ trong sự minh bạch và đồng thuận. Rút ra bài học chi tiêu và tự động chuyển thặng dư vào quỹ tích lũy."
        backLabel="← Về dashboard"
      />

      {/* Hero Summary Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeaderRow}>
          <Text style={styles.heroEyebrow}>KẾT QUẢ TÀI CHÍNH KỲ NÀY</Text>
          <View style={[styles.badgePill, surplusOrDeficit >= 0 ? styles.badgePillPositive : styles.badgePillNegative]}>
            <Text style={[styles.badgeText, surplusOrDeficit >= 0 ? styles.badgeTextPositive : styles.badgeTextNegative]}>
              {surplusOrDeficit >= 0 ? 'DƯ THỪA TÀI CHÍNH' : 'THÂM HỤT KỲ'}
            </Text>
          </View>
        </View>

        <Text style={[styles.heroAmount, surplusOrDeficit >= 0 ? styles.positiveText : styles.negativeText]}>
          {surplusOrDeficit >= 0 ? '+' : ''}{formatMoney(surplusOrDeficit)}
        </Text>
        <Text style={styles.heroHint}>
          {surplusOrDeficit >= 0
            ? `Thặng dư thực tế đạt ${savingsRate}% tổng thu nhập gia đình.`
            : 'Chi tiêu vượt thu nhập trong kỳ. Cần rà soát các khoản phát sinh.'}
        </Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>TỔNG THU NHẬP</Text>
            <Text style={styles.kpiValue}>{formatMoney(finance.monthlyIncome)}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>TỔNG ĐÃ CHI</Text>
            <Text style={styles.kpiValue}>{formatMoney(finance.totalSpent)}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>TỶ LỆ TÍCH LŨY</Text>
            <Text style={[styles.kpiValue, { color: AnalyticsTheme.colors.cyan }]}>{savingsRate}%</Text>
          </View>
        </View>
      </View>

      {/* Đối soát đóng góp Vợ & Chồng */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>⚖️ Đối Soát Đóng Góp 2 Vợ Chồng</Text>
          <View style={styles.telemetryTag}>
            <Text style={styles.telemetryTagText}>MINH BẠCH 100%</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>
          Ghi nhận các khoản chi từ tiền riêng của từng người để lo cho sinh hoạt chung gia đình:
        </Text>

        <View style={styles.settlementGrid}>
          <View style={styles.settlementItem}>
            <View style={styles.personHeader}>
              <Text style={styles.personRole}>👨 CHỒNG ĐÃ CHI CHUNG</Text>
            </View>
            <Text style={styles.settlementAmount}>
              {formatMoney(finance.settlement.husbandSpentForShared)}
            </Text>
            <Text style={styles.settlementSub}>
              Tiền riêng còn lại: {formatMoney(Math.max(0, finance.couple.husbandPocketMoney - finance.couple.husbandPocketSpent))}
            </Text>
          </View>

          <View style={styles.settlementItem}>
            <View style={styles.personHeader}>
              <Text style={styles.personRole}>👩 VỢ ĐÃ CHI CHUNG</Text>
            </View>
            <Text style={styles.settlementAmount}>
              {formatMoney(finance.settlement.wifeSpentForShared)}
            </Text>
            <Text style={styles.settlementSub}>
              Tiền riêng còn lại: {formatMoney(Math.max(0, finance.couple.wifePocketMoney - finance.couple.wifePocketSpent))}
            </Text>
          </View>
        </View>

        <View style={styles.settlementNote}>
          <Text style={styles.settlementNoteText}>
            Chênh lệch thanh toán chung: <Text style={styles.boldText}>{formatMoney(finance.settlement.difference)}</Text>.
            {' '}Mô hình quỹ chung - ví riêng giúp cả hai giữ gìn tự do cá nhân mà vẫn bảo đảm mục tiêu tổ ấm.
          </Text>
        </View>
      </View>

      {/* Tình trạng từng quỹ */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>📊 Giám Sát Hạn Mức 4 Quỹ</Text>
          <Text style={styles.sectionCountText}>{finance.funds.length} QUỸ HOẠT ĐỘNG</Text>
        </View>
        <View style={styles.fundsList}>
          {finance.funds.map((fund) => {
            const room = fund.allocated - fund.spent;
            const isOver = room < 0;
            const percentage = fund.allocated > 0 ? Math.min(100, Math.round((fund.spent / fund.allocated) * 100)) : 0;
            return (
              <View key={fund.id} style={styles.fundRow}>
                <View style={styles.fundMeta}>
                  <View style={[styles.fundDot, { backgroundColor: fund.color }]} />
                  <View style={styles.fundMain}>
                    <Text style={styles.fundTitle}>{fund.name}</Text>
                    <Text style={styles.fundDetail}>
                      Chi {formatMoney(fund.spent)} / Hạn mức {formatMoney(fund.allocated)} ({percentage}%)
                    </Text>
                  </View>
                  <View style={styles.fundRoomCol}>
                    <Text style={[styles.fundRoomAmount, isOver ? styles.redText : styles.greenText]}>
                      {isOver ? 'Vượt ' : 'Còn '}{formatMoney(Math.abs(room))}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: isOver ? AnalyticsTheme.colors.rose : fund.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Hành động Chốt tháng */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🔒 Kế Hoạch Kết Chuyển & Đóng Kỳ Sổ</Text>
        {surplusOrDeficit > 0 ? (
          <View>
            <Text style={styles.sectionSubtitle}>
              Tháng này còn dư {formatMoney(surplusOrDeficit)}. Chọn nơi tự động tích lũy số tiền này:
            </Text>

            <View style={styles.optionRow}>
              <AnimatedPressable
                onPress={() => setRolloverOption('emergency')}
                style={[styles.optionCard, rolloverOption === 'emergency' ? styles.optionActive : null]}>
                <Text style={styles.optionEmoji}>🛡️</Text>
                <Text style={styles.optionTitle}>Vào Quỹ Dự Phòng</Text>
                <Text style={styles.optionDesc}>Củng cố đệm tài chính 3-6 tháng sinh hoạt.</Text>
              </AnimatedPressable>

              <AnimatedPressable
                onPress={() => setRolloverOption('goals')}
                style={[styles.optionCard, rolloverOption === 'goals' ? styles.optionActive : null]}>
                <Text style={styles.optionEmoji}>🏖️</Text>
                <Text style={styles.optionTitle}>Vào Quỹ Mục Tiêu</Text>
                <Text style={styles.optionDesc}>Tích lũy cho du lịch hoặc mua sắm kế hoạch.</Text>
              </AnimatedPressable>
            </View>
          </View>
        ) : (
          <Text style={styles.sectionSubtitle}>
            Tháng này chi tiêu sát hạn mức. Không có thặng dư kết chuyển sang quỹ tích lũy.
          </Text>
        )}

        {isMonthClosed ? (
          <View style={styles.closedSuccessBox}>
            <Text style={styles.closedEmoji}>✅</Text>
            <Text style={styles.closedTitle}>ĐÃ HOÀN TẤT CHỐT KỲ NGÂN SÁCH!</Text>
            <Text style={styles.closedDesc}>
              Số dư thặng dư đã được kết chuyển tự động. Toàn bộ chỉ số tài chính đã được lưu trữ an toàn.
            </Text>
            <AnimatedPressable onPress={() => navigate('/budget/setup')} style={styles.nextMonthBtn}>
              <Text style={styles.nextMonthBtnText}>Thiết Lập Ngân Sách Tháng Tới →</Text>
            </AnimatedPressable>
          </View>
        ) : (
          <AnimatedPressable onPress={handleCloseMonth} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>🔒 Xác Nhận Chốt Kỳ & Kết Chuyển Số Dư</Text>
          </AnimatedPressable>
        )}
      </View>

      <PrimaryTabBar />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 16, paddingBottom: 24 },
  heroCard: {
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderColor: AnalyticsTheme.colors.borderLight,
    borderWidth: 1,
    padding: 22,
    marginTop: 8,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroEyebrow: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 1.2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgePillPositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: AnalyticsTheme.colors.emerald,
  },
  badgePillNegative: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: AnalyticsTheme.colors.rose,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.8,
  },
  badgeTextPositive: {
    color: AnalyticsTheme.colors.emerald,
  },
  badgeTextNegative: {
    color: AnalyticsTheme.colors.rose,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: AnalyticsTheme.typography.weightBlack,
    marginTop: 10,
  },
  positiveText: { color: AnalyticsTheme.colors.emerald },
  negativeText: { color: AnalyticsTheme.colors.rose },
  heroHint: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },

  kpiRow: {
    flexDirection: 'row',
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: AnalyticsTheme.colors.border,
    paddingTop: 14,
    alignItems: 'center',
  },
  kpiBox: { flex: 1 },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: AnalyticsTheme.colors.border,
    marginHorizontal: 8,
  },
  kpiLabel: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.6,
  },
  kpiValue: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: AnalyticsTheme.typography.weightBlack,
    marginTop: 4,
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
  },
  sectionTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  sectionSubtitle: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 14,
  },
  telemetryTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1,
  },
  telemetryTagText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 9,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.5,
  },
  sectionCountText: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },

  settlementGrid: { flexDirection: 'row', gap: 12 },
  settlementItem: {
    flex: 1,
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    padding: 14,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personRole: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.5,
  },
  settlementAmount: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 17,
    fontWeight: AnalyticsTheme.typography.weightBlack,
    marginTop: 6,
  },
  settlementSub: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },

  settlementNote: {
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    padding: 12,
    marginTop: 12,
  },
  settlementNoteText: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: AnalyticsTheme.typography.weightBold,
    color: AnalyticsTheme.colors.textPrimary,
  },

  fundsList: { gap: 14 },
  fundRow: {
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: AnalyticsTheme.colors.border,
  },
  fundMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  fundMain: { flex: 1 },
  fundTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  fundDetail: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  fundRoomCol: { alignItems: 'flex-end' },
  fundRoomAmount: {
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  greenText: { color: AnalyticsTheme.colors.emerald },
  redText: { color: AnalyticsTheme.colors.rose },

  optionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  optionCard: {
    flex: 1,
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1.5,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    padding: 14,
  },
  optionActive: {
    borderColor: AnalyticsTheme.colors.borderActive,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  optionEmoji: { fontSize: 22, marginBottom: 6 },
  optionTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  optionDesc: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },

  closeBtn: {
    backgroundColor: AnalyticsTheme.colors.emerald,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#062817',
    fontSize: 14,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },

  closedSuccessBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: AnalyticsTheme.colors.emerald,
    borderWidth: 1,
    borderRadius: AnalyticsTheme.borderRadius.large,
    padding: 18,
    alignItems: 'center',
  },
  closedEmoji: { fontSize: 32 },
  closedTitle: {
    color: AnalyticsTheme.colors.emerald,
    fontSize: 15,
    fontWeight: AnalyticsTheme.typography.weightBlack,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  closedDesc: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  nextMonthBtn: {
    backgroundColor: AnalyticsTheme.colors.cyan,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    marginTop: 14,
  },
  nextMonthBtnText: {
    color: '#041B2D',
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
});
