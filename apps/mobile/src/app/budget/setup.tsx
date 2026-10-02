import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { ConfirmActionBar } from '@/components/confirm-action-bar';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { formatMoney, useDemoFinance } from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

function formatNumberInput(value: number) {
  return value === 0 ? '' : String(value);
}

function parseCurrencyInput(value: string) {
  const numeric = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

export default function BudgetSetupScreen() {
  const { state: authState } = useAuthSession();
  const { state } = useHousehold();
  const finance = useDemoFinance();
  const navigate = (href: string) => router.push(href as never);

  const allocationRatio = finance.monthlyIncome > 0 ? finance.totalBudgeted / finance.monthlyIncome : 0;

  if (authState.status === 'loading') {
    return <LoadingState label="Đang tải account household…" />;
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
    return <LoadingState label="Đang tải tổng quan ngân sách…" />;
  }

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="PAYDAY ENGINE & DUAL POCKETS"
        title="Thiết lập Dòng tiền & 4 Quỹ"
        subtitle="Mô hình Phân bổ Ngày Nhận Lương: Tách riêng tiền tiêu vặt độc lập của 2 vợ chồng, trích quỹ tự động trước khi chi tiêu."
        backLabel="← Về dashboard"
        actionLabel="Ghi khoản mới"
        onActionPress={() => navigate('/transactions/new')}
      />

      {/* Terminal Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>TỔNG THU NHẬP 2 VỢ CHỒNG</Text>
            <Text style={styles.summaryValue}>{formatMoney(finance.monthlyIncome)}</Text>
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>Đã phân bổ {Math.round(allocationRatio * 100)}%</Text>
          </View>
        </View>

        <View style={styles.subSummaryRow}>
          <Text style={styles.summaryHint}>
            Chồng: <Text style={styles.boldWhite}>{formatMoney(finance.couple.husbandIncome)}</Text> • Vợ:{' '}
            <Text style={styles.boldWhite}>{formatMoney(finance.couple.wifeIncome)}</Text>
          </Text>
        </View>
      </View>

      <BudgetSetupEditor
        key={`${state.aggregate.household.id}-${finance.monthlyIncome}-${finance.totalBudgeted}`}
        onSave={finance.updateBudgetSetup}
        funds={finance.funds}
        couple={finance.couple}
        monthlyIncome={finance.monthlyIncome}
      />

      <PrimaryTabBar />
    </AppScreen>
  );
}

function BudgetSetupEditor({
  monthlyIncome,
  funds,
  couple,
  onSave,
}: {
  monthlyIncome: number;
  funds: ReturnType<typeof useDemoFinance>['funds'];
  couple: ReturnType<typeof useDemoFinance>['couple'];
  onSave: ReturnType<typeof useDemoFinance>['updateBudgetSetup'];
}) {
  const [husbandIncome, setHusbandIncome] = useState(() => formatNumberInput(couple.husbandIncome || 20000000));
  const [wifeIncome, setWifeIncome] = useState(() => formatNumberInput(couple.wifeIncome || 15000000));
  const [husbandPocket, setHusbandPocket] = useState(() => formatNumberInput(couple.husbandPocketMoney || 3000000));
  const [wifePocket, setWifePocket] = useState(() => formatNumberInput(couple.wifePocketMoney || 3000000));

  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(funds.map((fund) => [fund.id, formatNumberInput(fund.allocated)])),
  );
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const totalEarned = parseCurrencyInput(husbandIncome) + parseCurrencyInput(wifeIncome);
  const totalPocket = parseCurrencyInput(husbandPocket) + parseCurrencyInput(wifePocket);
  const poolForSharedFunds = Math.max(0, totalEarned - totalPocket);

  const totalFundAllocated = funds.reduce(
    (sum, fund) => sum + parseCurrencyInput(allocationInputs[fund.id] ?? ''),
    0,
  );

  const unallocatedAmount = poolForSharedFunds - totalFundAllocated;

  const applyRecommendedFormula = () => {
    if (poolForSharedFunds <= 0) return;

    const fixedAmount = Math.round(poolForSharedFunds * 0.45);
    const familyAmount = Math.round(poolForSharedFunds * 0.35);
    const emergencyAmount = Math.round(poolForSharedFunds * 0.1);
    const savingsAmount = Math.round(poolForSharedFunds * 0.05);
    const goalsAmount = poolForSharedFunds - (fixedAmount + familyAmount + emergencyAmount + savingsAmount);

    setAllocationInputs({
      fixed: String(fixedAmount),
      family: String(familyAmount),
      emergency: String(emergencyAmount),
      savings: String(savingsAmount),
      goals: String(goalsAmount),
    });
    setAwaitingConfirmation(false);
  };

  const handleSave = () => {
    onSave({
      monthlyIncome: totalEarned,
      husbandIncome: parseCurrencyInput(husbandIncome),
      wifeIncome: parseCurrencyInput(wifeIncome),
      husbandPocketMoney: parseCurrencyInput(husbandPocket),
      wifePocketMoney: parseCurrencyInput(wifePocket),
      allocations: {
        fixed: parseCurrencyInput(allocationInputs.fixed ?? ''),
        family: parseCurrencyInput(allocationInputs.family ?? ''),
        emergency: parseCurrencyInput(allocationInputs.emergency ?? ''),
        savings: parseCurrencyInput(allocationInputs.savings ?? ''),
        goals: parseCurrencyInput(allocationInputs.goals ?? ''),
      },
    });
    setAwaitingConfirmation(false);
  };

  return (
    <View style={styles.editorCard}>
      <Text style={styles.sectionTitle}>1. Thu nhập 2 Vợ Chồng</Text>
      <Text style={styles.sectionSubtitle}>
        Nhập mức thu nhập hàng tháng để hệ thống tổng hợp ngân sách chung.
      </Text>

      <View style={styles.gridTwo}>
        <View style={styles.gridItem}>
          <Text style={styles.fieldLabel}>Lương Chồng (VND)</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={(val) => {
              setHusbandIncome(val);
              setAwaitingConfirmation(false);
            }}
            placeholder="20,000,000"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={husbandIncome}
          />
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.fieldLabel}>Lương Vợ (VND)</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={(val) => {
              setWifeIncome(val);
              setAwaitingConfirmation(false);
            }}
            placeholder="15,000,000"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={wifeIncome}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>2. Tiền Tiêu Vặt Cá Nhân (Pocket Money)</Text>
      <Text style={styles.sectionSubtitle}>
        Hạn mức độc lập của từng người mỗi tháng. Tự do chi tiêu, không cần giải trình.
      </Text>

      <View style={styles.gridTwo}>
        <View style={styles.gridItem}>
          <Text style={styles.fieldLabel}>Tiêu vặt Chồng / tháng</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={(val) => {
              setHusbandPocket(val);
              setAwaitingConfirmation(false);
            }}
            placeholder="3,000,000"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={husbandPocket}
          />
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.fieldLabel}>Tiêu vặt Vợ / tháng</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={(val) => {
              setWifePocket(val);
              setAwaitingConfirmation(false);
            }}
            placeholder="3,000,000"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={wifePocket}
          />
        </View>
      </View>

      <View style={styles.poolInfoCard}>
        <Text style={styles.poolInfoTitle}>Dòng tiền đổ vào Quỹ Chung Gia Đình:</Text>
        <Text style={styles.poolInfoAmount}>{formatMoney(poolForSharedFunds)}</Text>
        <Text style={styles.poolInfoHint}>
          = {formatMoney(totalEarned)} (Tổng lương) - {formatMoney(totalPocket)} (Tiền riêng 2 người)
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>3. Phân Bổ 4 Quỹ Gia Đình</Text>
          <Text style={styles.sectionSubtitle}>Trích quỹ trước khi tiêu để không bị âm tiền cuối tháng.</Text>
        </View>
        <AnimatedPressable onPress={applyRecommendedFormula} style={styles.suggestBtn}>
          <Text style={styles.suggestBtnText}>⚡ Gợi ý chuẩn 45/35/10</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.fundList}>
        {funds.map((fund) => {
          const val = parseCurrencyInput(allocationInputs[fund.id] ?? '');
          const pct = poolForSharedFunds > 0 ? Math.round((val / poolForSharedFunds) * 100) : 0;

          return (
            <View key={fund.id} style={styles.fundCard}>
              <View style={styles.fundHeader}>
                <View style={[styles.fundSwatch, { backgroundColor: fund.color }]} />
                <View style={styles.fundHeaderText}>
                  <Text style={styles.fundName}>{fund.name}</Text>
                  <Text style={styles.fundDescription}>{fund.description}</Text>
                </View>
                <Text style={styles.fundPct}>{pct}%</Text>
              </View>

              <Text style={styles.fieldLabel}>Số tiền phân bổ (VND)</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => {
                  setAllocationInputs((current) => ({ ...current, [fund.id]: value }));
                  setAwaitingConfirmation(false);
                }}
                placeholder="0"
                placeholderTextColor="#64748B"
                style={styles.input}
                value={allocationInputs[fund.id]}
              />
            </View>
          );
        })}
      </View>

      <View style={[styles.unallocatedBanner, unallocatedAmount < 0 ? styles.bannerWarning : null]}>
        <Text style={styles.unallocatedLabel}>
          {unallocatedAmount < 0 ? 'Cảnh báo: Đang phân bổ vượt quá quỹ chung!' : 'Chưa phân bổ:'}
        </Text>
        <Text style={[styles.unallocatedValue, unallocatedAmount < 0 ? styles.valueWarning : null]}>
          {formatMoney(unallocatedAmount)}
        </Text>
      </View>

      {awaitingConfirmation ? (
        <ConfirmActionBar
          confirmLabel="Xác nhận lưu cấu hình này"
          cancelLabel="Chỉnh sửa lại"
          description="Cấu hình mới sẽ có hiệu lực ngay cho toàn bộ các màn hình và giao dịch của household."
          onCancel={() => setAwaitingConfirmation(false)}
          onConfirm={handleSave}
          title="Lưu thiết lập ngân sách?"
        />
      ) : (
        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => setAwaitingConfirmation(true)}
          style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Lưu phân bổ ngân sách</Text>
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 16, paddingBottom: 24 },
  summaryCard: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 22,
    marginTop: 14,
    padding: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, fontWeight: '700' },
  summaryValue: { color: AnalyticsTheme.colors.textPrimary, fontSize: 24, fontWeight: '900', marginTop: 4 },
  badgePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  badgeText: { color: AnalyticsTheme.colors.cyan, fontSize: 12, fontWeight: '800' },
  subSummaryRow: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#1E293B', paddingTop: 10 },
  summaryHint: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12 },
  boldWhite: { color: AnalyticsTheme.colors.textPrimary, fontWeight: '800' },

  editorCard: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 18,
    padding: 18,
  },
  sectionTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 17, marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  suggestBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  suggestBtnText: { color: AnalyticsTheme.colors.cyan, fontSize: 11, fontWeight: '800' },

  gridTwo: { flexDirection: 'row', gap: 10 },
  gridItem: { flex: 1 },
  fieldLabel: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1.5,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  divider: { height: 1, backgroundColor: '#1E293B', marginVertical: 18 },

  poolInfoCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  poolInfoTitle: { color: AnalyticsTheme.colors.emerald, fontSize: 12, fontWeight: '700' },
  poolInfoAmount: { color: AnalyticsTheme.colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 4 },
  poolInfoHint: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, marginTop: 4 },

  fundList: { gap: 10, marginTop: 8 },
  fundCard: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  fundHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  fundSwatch: { borderRadius: 6, height: 14, width: 14, marginRight: 8 },
  fundHeaderText: { flex: 1 },
  fundName: { color: AnalyticsTheme.colors.textPrimary, fontSize: 14, fontWeight: '800' },
  fundDescription: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, marginTop: 1 },
  fundPct: { color: AnalyticsTheme.colors.cyan, fontSize: 15, fontWeight: '900' },

  unallocatedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  bannerWarning: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  unallocatedLabel: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  unallocatedValue: { color: AnalyticsTheme.colors.emerald, fontSize: 15, fontWeight: '900' },
  valueWarning: { color: AnalyticsTheme.colors.rose },

  saveButton: {
    backgroundColor: AnalyticsTheme.colors.cyan,
    borderRadius: 14,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: { color: '#090D16', fontSize: 15, fontWeight: '900' },
});
