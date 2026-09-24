import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { ConfirmActionBar } from '@/components/confirm-action-bar';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { PrimaryTabBar } from '@/components/primary-tab-bar';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { useDemoFinance } from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';

const categories = ['Ăn uống', 'Hóa đơn', 'Con cái', 'Tiết kiệm', 'Di chuyển'] as const;

function getValidationMessage(title: string, parsedAmount: number) {
  if (!title.trim()) {
    return 'Nhập tên giao dịch để tiếp tục.';
  }
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return 'Số tiền phải lớn hơn 0.';
  }
  return null;
}

export default function NewTransactionScreen() {
  const { state: authState } = useAuthSession();
  const { state } = useHousehold();
  const finance = useDemoFinance();
  const navigateReplace = (href: string) => router.replace(href as never);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('Ăn uống');
  const [fundId, setFundId] = useState<(typeof finance.funds)[number]['id']>(finance.funds[0]?.id ?? 'family');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const parsedAmount = Number(amount.replace(/[^\d]/g, ''));
  const validationMessage = useMemo(() => {
    if (!touched) {
      return null;
    }
    return getValidationMessage(title, parsedAmount);
  }, [parsedAmount, title, touched]);

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
    return <LoadingState label="Đang tải form giao dịch…" />;
  }

  const submit = () => {
    setTouched(true);
    const nextValidationMessage = getValidationMessage(title, parsedAmount);
    if (nextValidationMessage) {
      return;
    }

    finance.addTransaction({
      title: title.trim(),
      amount: parsedAmount,
      category,
      fundId,
      note: note.trim() || undefined,
      type,
    });
    navigateReplace('/transactions');
  };

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="THÊM GIAO DỊCH"
        title="Ghi nhanh một biến động tiền"
        subtitle="Màn này đã có tương tác thật trong phiên demo: lưu xong sẽ quay về danh sách giao dịch ngay."
        backLabel="← Về giao dịch"
      />

      <View style={styles.card}>
        <Text style={styles.label}>Loại giao dịch</Text>
        <View style={styles.segmentRow}>
          {[
            { key: 'expense', label: 'Chi tiêu' },
            { key: 'income', label: 'Bù quỹ / thêm tiền' },
          ].map((option) => {
            const active = type === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                onPress={() => {
                  setType(option.key as 'expense' | 'income');
                  setAwaitingConfirmation(false);
                }}
                style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}>
                <Text style={[styles.segmentButtonText, active ? styles.segmentButtonTextActive : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Tên giao dịch</Text>
        <TextInput
          accessibilityLabel="Tên giao dịch"
          onBlur={() => setTouched(true)}
          onChangeText={(value) => {
            setTitle(value);
            setAwaitingConfirmation(false);
          }}
          placeholder="Ví dụ: Đóng tiền điện"
          placeholderTextColor="#90A097"
          style={styles.input}
          value={title}
        />

        <Text style={styles.label}>Số tiền</Text>
        <TextInput
          accessibilityLabel="Số tiền"
          keyboardType="numeric"
          onBlur={() => setTouched(true)}
          onChangeText={(value) => {
            setAmount(value);
            setAwaitingConfirmation(false);
          }}
          placeholder="Ví dụ: 1250000"
          placeholderTextColor="#90A097"
          style={styles.input}
          value={amount}
        />

        <Text style={styles.label}>Danh mục</Text>
        <View style={styles.chipWrap}>
          {categories.map((option) => {
            const active = category === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => {
                  setCategory(option);
                  setAwaitingConfirmation(false);
                }}
                style={[styles.choiceChip, active ? styles.choiceChipActive : null]}>
                <Text style={[styles.choiceChipText, active ? styles.choiceChipTextActive : null]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Quỹ nhận giao dịch</Text>
        <View style={styles.chipWrap}>
          {finance.funds.map((fund) => {
            const active = fundId === fund.id;
            return (
              <Pressable
                key={fund.id}
                accessibilityRole="button"
                onPress={() => {
                  setFundId(fund.id);
                  setAwaitingConfirmation(false);
                }}
                style={[styles.choiceChip, active ? styles.choiceChipActive : null]}>
                <Text style={[styles.choiceChipText, active ? styles.choiceChipTextActive : null]}>{fund.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Ghi chú ngắn</Text>
        <TextInput
          accessibilityLabel="Ghi chú"
          multiline
          numberOfLines={4}
          onChangeText={(value) => {
            setNote(value);
            setAwaitingConfirmation(false);
          }}
          placeholder="Ví dụ: thanh toán qua banking"
          placeholderTextColor="#90A097"
          style={[styles.input, styles.noteInput]}
          value={note}
        />

        <Text style={styles.helperText}>
          {validationMessage ?? 'Giao dịch mới sẽ hiện ngay trong danh sách của phiên demo này.'}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setTouched(true);
            if (getValidationMessage(title, parsedAmount)) {
              return;
            }
            setAwaitingConfirmation(true);
          }}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Lưu giao dịch demo</Text>
        </Pressable>

        {awaitingConfirmation ? (
          <ConfirmActionBar
            title="Xác nhận lưu giao dịch"
            description="Khoản chi hoặc khoản bù quỹ này sẽ được ghi vào household hiện tại và tổng quan sẽ cập nhật ngay."
            confirmLabel="Xác nhận lưu"
            onCancel={() => setAwaitingConfirmation(false)}
            onConfirm={submit}
          />
        ) : null}
      </View>

      <PrimaryTabBar />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 18, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5DF',
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
  },
  label: { color: '#25372D', fontSize: 14, fontWeight: '800', marginBottom: 10, marginTop: 14 },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segmentButton: {
    alignItems: 'center',
    backgroundColor: '#EDF2EE',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  segmentButtonActive: { backgroundColor: '#153E29' },
  segmentButtonText: { color: '#607066', fontSize: 13, fontWeight: '700' },
  segmentButtonTextActive: { color: '#FFFFFF' },
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
  noteInput: { minHeight: 98, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choiceChip: {
    backgroundColor: '#F2F6F3',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choiceChipActive: { backgroundColor: '#DBF2E2' },
  choiceChipText: { color: '#5C6C63', fontSize: 13, fontWeight: '700' },
  choiceChipTextActive: { color: '#165A36' },
  helperText: { color: '#8B5E12', fontSize: 13, lineHeight: 19, marginTop: 16 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#153E29',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 56,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
