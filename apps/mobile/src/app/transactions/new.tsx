import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { LoadingState } from '@/components/loading-state';
import { PageHeader } from '@/components/page-header';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { parseVietnameseBankNotification } from '@/features/finance/domain/bank-sms-parser';
import {
  DemoFundId,
  DemoPayer,
  DemoSpendingSource,
  formatMoney,
  useDemoFinance,
} from '@/features/finance/ui/demo-finance-provider';
import { useHousehold } from '@/features/household/ui/household-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

const categories = [
  'Ăn uống & Chợ',
  'Hóa đơn & Tiền nhà',
  'Con cái & Sữa tã',
  'Y tế & Thuốc',
  'Di chuyển & Xăng',
  'Mua sắm gia đình',
  'Tiết kiệm & Dự phòng',
  'Giải trí & Du lịch',
] as const;

const SAMPLE_BANK_MESSAGES = [
  {
    label: 'Vietcombank (Tiền điện)',
    text: 'VCB: SD TK 001100... -1,250,000 VND vao 12/05/2026. ND: Tien dien luc EVN thang 5',
  },
  {
    label: 'Techcombank (WinMart)',
    text: 'Techcombank: GD -850.000 VND tai WinMart Thao Dien. ND: Mua thuc pham cuoi tuan',
  },
  {
    label: 'MoMo (Cà phê)',
    text: 'MoMo: Giao dịch thành công -65.000đ tại Highlands Coffee. ND: Highlands Coffee',
  },
  {
    label: 'MBBank (Tiết kiệm)',
    text: 'MB: TK 088... +5,000,000 VND luc 10:15. ND: Gui tiet kiem tich luy du phong',
  },
];

export default function NewTransactionScreen() {
  const { state: authState } = useAuthSession();
  const { state } = useHousehold();
  const finance = useDemoFinance();
  const navigateReplace = (href: string) => router.replace(href as never);

  const [inputMode, setInputMode] = useState<'quick' | 'bank_sms' | 'receipt'>('quick');

  // Manual Form States
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('Ăn uống & Chợ');
  const [fundId, setFundId] = useState<DemoFundId>('family');
  const [paidBy, setPaidBy] = useState<DemoPayer>('shared');
  const [source, setSource] = useState<DemoSpendingSource>('joint_fund');
  const [note, setNote] = useState('');

  // Bank Parser State
  const [rawSmsInput, setRawSmsInput] = useState('');
  const parsedBankResult = useMemo(
    () => parseVietnameseBankNotification(rawSmsInput),
    [rawSmsInput],
  );

  // Receipt Mock State
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const parsedAmount = Number(amount.replace(/[^\d]/g, ''));

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

  const submitManual = () => {
    if (!title.trim() || parsedAmount <= 0) {
      return;
    }

    finance.addTransaction({
      title: title.trim(),
      amount: parsedAmount,
      category,
      fundId,
      paidBy,
      source,
      note: note.trim() || undefined,
      type,
      receiptUrl: receiptImage ?? undefined,
    });
    navigateReplace('/transactions');
  };

  const submitParsedBank = () => {
    if (!parsedBankResult) return;

    finance.addTransaction({
      title: parsedBankResult.description || `Giao dịch ${parsedBankResult.bankName}`,
      amount: parsedBankResult.amount,
      category: parsedBankResult.suggestedCategory,
      fundId: parsedBankResult.suggestedFundId,
      type: parsedBankResult.type,
      paidBy: 'shared',
      source: 'joint_fund',
      note: `Bóc tách từ SMS ${parsedBankResult.bankName}`,
      rawBankText: parsedBankResult.rawText,
    });
    navigateReplace('/transactions');
  };

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <PageHeader
        eyebrow="SMART CAPTURE INSTRUMENT"
        title="Nhập Khoản Thu / Chi"
        subtitle="Hỗ trợ 3 phương thức: Bàn phím nhanh < 5s, Phân tích tự động tin nhắn SMS ngân hàng và Đính kèm hóa đơn."
        backLabel="← Về giao dịch"
        backHref="/transactions"
      />

      {/* Mode Switcher */}
      <View style={styles.modeTabs}>
        <AnimatedPressable
          onPress={() => setInputMode('quick')}
          style={[styles.modeTab, inputMode === 'quick' ? styles.modeTabActive : null]}>
          <Text style={[styles.modeTabText, inputMode === 'quick' ? styles.modeTabTextActive : null]}>
            ⚡ Ghi nhanh
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => setInputMode('bank_sms')}
          style={[styles.modeTab, inputMode === 'bank_sms' ? styles.modeTabActive : null]}>
          <Text style={[styles.modeTabText, inputMode === 'bank_sms' ? styles.modeTabTextActive : null]}>
            🏦 Dán SMS Bank
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => setInputMode('receipt')}
          style={[styles.modeTab, inputMode === 'receipt' ? styles.modeTabActive : null]}>
          <Text style={[styles.modeTabText, inputMode === 'receipt' ? styles.modeTabTextActive : null]}>
            📸 Ảnh Hóa đơn
          </Text>
        </AnimatedPressable>
      </View>

      {/* MODE 1: QUICK ADD */}
      {inputMode === 'quick' && (
        <View style={styles.card}>
          <Text style={styles.label}>Loại biến động</Text>
          <View style={styles.segmentRow}>
            {[
              { key: 'expense', label: 'Chi tiêu (-)' },
              { key: 'income', label: 'Bù quỹ (+)' },
            ].map((option) => (
              <AnimatedPressable
                key={option.key}
                onPress={() => setType(option.key as 'expense' | 'income')}
                style={[styles.segmentButton, type === option.key ? styles.segmentButtonActive : null]}>
                <Text style={[styles.segmentButtonText, type === option.key ? styles.segmentButtonTextActive : null]}>
                  {option.label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          <Text style={styles.label}>Số tiền (VND)</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={setAmount}
            placeholder="Ví dụ: 250000"
            placeholderTextColor="#64748B"
            style={styles.amountInput}
            value={amount}
          />
          {parsedAmount > 0 ? (
            <Text style={styles.amountPreview}>{formatMoney(parsedAmount)}</Text>
          ) : null}

          <Text style={styles.label}>Tên / Nội dung khoản chi</Text>
          <TextInput
            onChangeText={setTitle}
            placeholder="Ví dụ: Mua tã bỉm cho bé, Ăn trưa..."
            placeholderTextColor="#64748B"
            style={styles.input}
            value={title}
          />

          <View style={styles.divider} />

          {/* Người chi & Nguồn tiền */}
          <Text style={styles.label}>Ai là người trả?</Text>
          <View style={styles.segmentRow}>
            {[
              { key: 'husband', label: '👨 Chồng trả' },
              { key: 'wife', label: '👩 Vợ trả' },
              { key: 'shared', label: '👥 Cả hai' },
            ].map((opt) => (
              <AnimatedPressable
                key={opt.key}
                onPress={() => setPaidBy(opt.key as DemoPayer)}
                style={[styles.segmentButton, paidBy === opt.key ? styles.segmentButtonActive : null]}>
                <Text style={[styles.segmentButtonText, paidBy === opt.key ? styles.segmentButtonTextActive : null]}>
                  {opt.label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          <Text style={styles.label}>Nguồn tiền trích từ đâu?</Text>
          <View style={styles.segmentRow}>
            {[
              { key: 'joint_fund', label: 'Quỹ chung' },
              { key: 'pocket_money', label: 'Tiền riêng' },
              { key: 'reimbursable', label: 'Ứng trước' },
            ].map((opt) => (
              <AnimatedPressable
                key={opt.key}
                onPress={() => setSource(opt.key as DemoSpendingSource)}
                style={[styles.segmentButton, source === opt.key ? styles.segmentButtonActive : null]}>
                <Text style={[styles.segmentButtonText, source === opt.key ? styles.segmentButtonTextActive : null]}>
                  {opt.label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          <Text style={styles.label}>Phân loại vào Quỹ</Text>
          <View style={styles.fundSelectGrid}>
            {finance.funds.map((fund) => {
              const active = fundId === fund.id;
              return (
                <AnimatedPressable
                  key={fund.id}
                  onPress={() => setFundId(fund.id)}
                  style={[styles.fundChip, active ? styles.fundChipActive : null]}>
                  <View style={[styles.fundDot, { backgroundColor: fund.color }]} />
                  <Text style={[styles.fundChipText, active ? styles.fundChipTextActive : null]}>
                    {fund.name}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Text style={styles.label}>Danh mục</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat) => {
              const active = category === cat;
              return (
                <AnimatedPressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.catChip, active ? styles.catChipActive : null]}>
                  <Text style={[styles.catChipText, active ? styles.catChipTextActive : null]}>{cat}</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          <Text style={styles.label}>Ghi chú thêm (tùy chọn)</Text>
          <TextInput
            onChangeText={setNote}
            placeholder="Ví dụ: Mua tại WinMart Thảo Điền..."
            placeholderTextColor="#64748B"
            style={styles.input}
            value={note}
          />

          <AnimatedPressable onPress={submitManual} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Lưu giao dịch</Text>
          </AnimatedPressable>
        </View>
      )}

      {/* MODE 2: BANK SMS / NOTIFICATION PARSER */}
      {inputMode === 'bank_sms' && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Dán biến động số dư ngân hàng</Text>
          <Text style={styles.sectionDesc}>
            Sao chép tin nhắn SMS hoặc thông báo từ Vietcombank, Techcombank, MB, Momo, Apple Pay... dán vào đây. App sẽ tự động bóc tách số tiền, phân loại và đề xuất quỹ phù hợp.
          </Text>

          <TextInput
            multiline
            numberOfLines={4}
            onChangeText={setRawSmsInput}
            placeholder="Dán nội dung tin nhắn SMS hoặc thông báo biến động số dư tại đây..."
            placeholderTextColor="#64748B"
            style={styles.smsTextArea}
            value={rawSmsInput}
          />

          <Text style={styles.sampleTitle}>Hoặc thử nhanh bằng mẫu có sẵn:</Text>
          <View style={styles.sampleGrid}>
            {SAMPLE_BANK_MESSAGES.map((sample, idx) => (
              <AnimatedPressable
                key={idx}
                onPress={() => setRawSmsInput(sample.text)}
                style={styles.sampleChip}>
                <Text style={styles.sampleChipText}>{sample.label}</Text>
              </AnimatedPressable>
            ))}
          </View>

          {parsedBankResult ? (
            <View style={styles.parsedCard}>
              <View style={styles.parsedHeader}>
                <Text style={styles.parsedBadge}>ĐÃ BÓC TÁCH: {parsedBankResult.bankName}</Text>
                <Text style={styles.parsedTime}>{parsedBankResult.detectedAt}</Text>
              </View>

              <Text style={styles.parsedAmount}>
                {parsedBankResult.type === 'expense' ? '-' : '+'}{formatMoney(parsedBankResult.amount)}
              </Text>

              <Text style={styles.parsedDesc}>Mô tả: {parsedBankResult.description}</Text>

              <View style={styles.parsedFundRow}>
                <Text style={styles.parsedFundLabel}>Gợi ý Quỹ:</Text>
                <Text style={styles.parsedFundValue}>{parsedBankResult.suggestedCategory}</Text>
              </View>

              <AnimatedPressable onPress={submitParsedBank} style={styles.saveParsedButton}>
                <Text style={styles.saveParsedButtonText}>✓ Xác nhận & Lưu giao dịch này</Text>
              </AnimatedPressable>
            </View>
          ) : rawSmsInput ? (
            <Text style={styles.parseError}>Chưa nhận diện được số tiền hợp lệ trong văn bản trên.</Text>
          ) : null}
        </View>
      )}

      {/* MODE 3: RECEIPT OCR */}
      {inputMode === 'receipt' && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Đính kèm ảnh Hóa đơn / Biên lai</Text>
          <Text style={styles.sectionDesc}>
            Lưu ảnh hóa đơn siêu thị, học phí, tiền điện để đối chiếu cuối tuần mà không lo thất lạc.
          </Text>

          <View style={styles.receiptPreviewBox}>
            {receiptImage ? (
              <View style={styles.uploadedBox}>
                <Text style={styles.uploadedEmoji}>🧾</Text>
                <Text style={styles.uploadedTitle}>Hóa đơn đã được chọn</Text>
                <Text style={styles.uploadedHint}>WinMart_20261002_0845.jpg (1.2 MB)</Text>
                <AnimatedPressable onPress={() => setReceiptImage(null)} style={styles.removeImageBtn}>
                  <Text style={styles.removeImageText}>Xóa ảnh</Text>
                </AnimatedPressable>
              </View>
            ) : (
              <View style={styles.emptyReceiptBox}>
                <Text style={styles.emptyReceiptEmoji}>📷</Text>
                <Text style={styles.emptyReceiptText}>Chưa có ảnh hóa đơn</Text>
                <View style={styles.mockActionRow}>
                  <AnimatedPressable
                    onPress={() => {
                      setReceiptImage('mock_winmart_bill.jpg');
                      setTitle('Đi siêu thị WinMart');
                      setAmount('1250000');
                      setFundId('family');
                      setCategory('Ăn uống & Chợ');
                      setInputMode('quick');
                    }}
                    style={styles.mockUploadBtn}>
                    <Text style={styles.mockUploadText}>+ Chọn ảnh hóa đơn mẫu</Text>
                  </AnimatedPressable>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: 32 },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
    marginTop: 14,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 1,
  },
  modeTabText: { color: AnalyticsTheme.colors.textMuted, fontSize: 12, fontWeight: '700' },
  modeTabTextActive: { color: AnalyticsTheme.colors.cyan, fontWeight: '800' },

  card: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 14,
    padding: 18,
  },
  label: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  amountInput: {
    backgroundColor: '#090D16',
    borderColor: AnalyticsTheme.colors.cyan,
    borderRadius: 14,
    borderWidth: 2,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  amountPreview: { color: AnalyticsTheme.colors.cyan, fontSize: 13, fontWeight: '700', marginTop: 4, textAlign: 'right' },
  input: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1.5,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  segmentRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  segmentButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#1E293B',
    borderColor: AnalyticsTheme.colors.cyan,
  },
  segmentButtonText: { color: AnalyticsTheme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  segmentButtonTextActive: { color: AnalyticsTheme.colors.cyan, fontWeight: '800' },

  divider: { height: 1, backgroundColor: '#1E293B', marginVertical: 14 },

  fundSelectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fundChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  fundChipActive: { backgroundColor: '#1E293B', borderColor: AnalyticsTheme.colors.cyan },
  fundDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  fundChipText: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
  fundChipTextActive: { color: AnalyticsTheme.colors.textPrimary, fontWeight: '800' },

  categoryScroll: { flexDirection: 'row', marginTop: 2, marginBottom: 6 },
  catChip: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 6,
  },
  catChipActive: { backgroundColor: AnalyticsTheme.colors.cyan, borderColor: AnalyticsTheme.colors.cyan },
  catChipText: { color: AnalyticsTheme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
  catChipTextActive: { color: '#090D16', fontWeight: '800' },

  primaryButton: {
    backgroundColor: AnalyticsTheme.colors.cyan,
    borderRadius: 14,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  primaryButtonText: { color: '#090D16', fontSize: 15, fontWeight: '900' },

  // Bank SMS Styles
  sectionHeading: { color: AnalyticsTheme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
  sectionDesc: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 12 },
  smsTextArea: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1.5,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 13,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  sampleTitle: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  sampleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sampleChip: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  sampleChipText: { color: AnalyticsTheme.colors.cyan, fontSize: 11, fontWeight: '700' },

  parsedCard: {
    backgroundColor: '#0F172A',
    borderColor: AnalyticsTheme.colors.emerald,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  parsedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  parsedBadge: { backgroundColor: AnalyticsTheme.colors.emerald, color: '#090D16', fontSize: 10, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  parsedTime: { color: AnalyticsTheme.colors.textMuted, fontSize: 11 },
  parsedAmount: { color: AnalyticsTheme.colors.emerald, fontSize: 22, fontWeight: '900', marginTop: 8 },
  parsedDesc: { color: AnalyticsTheme.colors.textPrimary, fontSize: 13, marginTop: 4, fontWeight: '600' },
  parsedFundRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  parsedFundLabel: { color: AnalyticsTheme.colors.textMuted, fontSize: 12 },
  parsedFundValue: { color: AnalyticsTheme.colors.cyan, fontSize: 12, fontWeight: '800' },

  saveParsedButton: {
    backgroundColor: AnalyticsTheme.colors.emerald,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  saveParsedButtonText: { color: '#090D16', fontSize: 13, fontWeight: '900' },
  parseError: { color: AnalyticsTheme.colors.rose, fontSize: 12, marginTop: 8, textAlign: 'center' },

  // Receipt Styles
  receiptPreviewBox: { marginTop: 10 },
  emptyReceiptBox: {
    backgroundColor: '#090D16',
    borderColor: '#1E293B',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyReceiptEmoji: { fontSize: 32, marginBottom: 6 },
  emptyReceiptText: { color: AnalyticsTheme.colors.textMuted, fontSize: 13, fontWeight: '600' },
  mockActionRow: { marginTop: 12 },
  mockUploadBtn: {
    backgroundColor: AnalyticsTheme.colors.cyan,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mockUploadText: { color: '#090D16', fontSize: 12, fontWeight: '800' },

  uploadedBox: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  uploadedEmoji: { fontSize: 32 },
  uploadedTitle: { color: AnalyticsTheme.colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 6 },
  uploadedHint: { color: AnalyticsTheme.colors.textMuted, fontSize: 11, marginTop: 2 },
  removeImageBtn: { marginTop: 10 },
  removeImageText: { color: AnalyticsTheme.colors.rose, fontSize: 12, fontWeight: '700' },
});
