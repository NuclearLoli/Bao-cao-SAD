import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { ConfirmActionBar } from '@/components/confirm-action-bar';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { formatMoney, useDemoFinance } from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';

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
        eyebrow="CẤU HÌNH NGÂN SÁCH"
        title="Tự setup phần tổng quan"
        subtitle="Tab này giờ không còn cố định nữa. Mỗi account hoặc household scope có thể tự cấu hình thu nhập và phân bổ 5 quỹ riêng."
        backLabel="← Về dashboard"
        actionLabel="Ghi khoản mới"
        onActionPress={() => navigate('/transactions/new')}
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tỷ lệ đã phân bổ</Text>
        <Text style={styles.summaryValue}>{Math.round(allocationRatio * 100)}%</Text>
        <Text style={styles.summaryHint}>
          Đã phân bổ {formatMoney(finance.totalBudgeted)} trên thu nhập {formatMoney(finance.monthlyIncome)}.
        </Text>
      </View>

      <BudgetSetupEditor
        key={`${state.aggregate.household.id}-${finance.monthlyIncome}-${finance.totalBudgeted}`}
        onSave={finance.updateBudgetSetup}
        funds={finance.funds}
        monthlyIncome={finance.monthlyIncome}
      />

      <View style={styles.rhythmCard}>
        <Text style={styles.rhythmEyebrow}>TÓM TẮT SAU KHI SETUP</Text>
        <Text style={styles.rhythmTitle}>Còn lại để cân chỉnh</Text>
        <Text style={styles.rhythmText}>{formatMoney(finance.monthlyIncome - finance.totalBudgeted)}</Text>
        <Text style={styles.rhythmText}>Sau khi lưu, dashboard và giao dịch sẽ bám theo cấu hình này.</Text>
      </View>

      <PrimaryTabBar />
    </AppScreen>
  );
}

function BudgetSetupEditor({
  monthlyIncome,
  funds,
  onSave,
}: {
  monthlyIncome: number;
  funds: ReturnType<typeof useDemoFinance>['funds'];
  onSave: ReturnType<typeof useDemoFinance>['updateBudgetSetup'];
}) {
  const [incomeInput, setIncomeInput] = useState(() => formatNumberInput(monthlyIncome));
  const [allocationInputs, setAllocationInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(funds.map((fund) => [fund.id, formatNumberInput(fund.allocated)])),
  );
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const remainingAfterBudget = parseCurrencyInput(incomeInput) - funds.reduce(
    (sum, fund) => sum + parseCurrencyInput(allocationInputs[fund.id] ?? ''),
    0,
  );
  const hasChanges =
    parseCurrencyInput(incomeInput) !== monthlyIncome ||
    funds.some(
      (fund) => parseCurrencyInput(allocationInputs[fund.id] ?? '') !== fund.allocated,
    );

  const helperMessage = useMemo(() => {
    if (remainingAfterBudget < 0) {
      return 'Tổng phân bổ đang vượt quá thu nhập tháng.';
    }
    return 'Bạn có thể chỉnh thu nhập và từng quỹ, bấm lưu là dashboard cập nhật ngay.';
  }, [remainingAfterBudget]);

  const saveBudgetSetup = () => {
    onSave({
      monthlyIncome: parseCurrencyInput(incomeInput),
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
      <Text style={styles.sectionTitle}>Thông số tổng quan</Text>
      <Text style={styles.fieldLabel}>Thu nhập tháng</Text>
      <TextInput
        accessibilityLabel="Thu nhập tháng"
        keyboardType="numeric"
        onChangeText={(value) => {
          setIncomeInput(value);
          setAwaitingConfirmation(false);
        }}
        placeholder="Ví dụ: 30000000"
        placeholderTextColor="#90A097"
        style={styles.input}
        value={incomeInput}
      />

      <View style={styles.fundList}>
        {funds.map((fund) => (
          <View key={fund.id} style={styles.fundCard}>
            <View style={styles.fundHeader}>
              <View style={[styles.fundSwatch, { backgroundColor: fund.color }]} />
              <View style={styles.fundHeaderText}>
                <Text style={styles.fundName}>{fund.name}</Text>
                <Text style={styles.fundDescription}>{fund.description}</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Ngân sách tháng</Text>
            <TextInput
              accessibilityLabel={`Ngân sách ${fund.name}`}
              keyboardType="numeric"
              onChangeText={(value) =>
                {
                  setAllocationInputs((current) => ({
                    ...current,
                    [fund.id]: value,
                  }));
                  setAwaitingConfirmation(false);
                }
              }
              placeholder="0"
              placeholderTextColor="#90A097"
              style={styles.input}
              value={allocationInputs[fund.id] ?? ''}
            />

            <View style={styles.fundMetaRow}>
              <Text style={styles.metaLabel}>Đã dùng</Text>
              <Text style={styles.metaValue}>{formatMoney(fund.spent)}</Text>
            </View>
            <View style={styles.fundMetaRow}>
              <Text style={styles.metaLabel}>Còn lại</Text>
              <Text style={styles.metaValue}>
                {formatMoney(parseCurrencyInput(allocationInputs[fund.id] ?? '') - fund.spent)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.helperText}>{helperMessage}</Text>

      <Pressable
        accessibilityRole="button"
        disabled={!hasChanges}
        onPress={() => setAwaitingConfirmation(true)}
        style={[styles.primaryButton, !hasChanges ? styles.buttonDisabled : null]}>
        <Text style={styles.primaryButtonText}>Lưu thay đổi</Text>
      </Pressable>

      {awaitingConfirmation ? (
        <ConfirmActionBar
          title="Xác nhận cập nhật ngân sách"
          description="Thu nhập và các quỹ sẽ được cập nhật ngay trên dashboard, giao dịch và báo cáo của household này."
          confirmLabel="Xác nhận lưu"
          onCancel={() => setAwaitingConfirmation(false)}
          onConfirm={saveBudgetSetup}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 18, paddingBottom: 32 },
  summaryCard: {
    backgroundColor: '#FFF8E8',
    borderColor: '#F4D38A',
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
  },
  summaryLabel: { color: '#9A6700', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  summaryValue: { color: '#7C2D12', fontSize: 36, fontWeight: '900', marginTop: 10 },
  summaryHint: { color: '#7C5D28', fontSize: 14, lineHeight: 21, marginTop: 8 },
  editorCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5DF',
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
  },
  sectionTitle: { color: '#17231D', fontSize: 22, fontWeight: '800' },
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
  fundList: { gap: 14, marginTop: 18 },
  fundCard: {
    backgroundColor: '#FBFCFB',
    borderColor: '#E1E9E3',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  fundHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 2 },
  fundSwatch: { borderRadius: 999, height: 16, width: 16 },
  fundHeaderText: { flex: 1 },
  fundName: { color: '#14211A', fontSize: 17, fontWeight: '800' },
  fundDescription: { color: '#68776E', fontSize: 13, lineHeight: 20, marginTop: 2 },
  fundMetaRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { color: '#637267', fontSize: 13, fontWeight: '600' },
  metaValue: { color: '#14211A', fontSize: 14, fontWeight: '800' },
  helperText: { color: '#7C5D28', fontSize: 13, lineHeight: 20, marginTop: 16 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#153E29',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 56,
  },
  buttonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  rhythmCard: {
    backgroundColor: '#173B29',
    borderRadius: 26,
    padding: 22,
  },
  rhythmEyebrow: { color: '#9AD6B1', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  rhythmTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 10 },
  rhythmText: { color: '#D4E4DA', fontSize: 14, lineHeight: 21, marginTop: 10 },
});
