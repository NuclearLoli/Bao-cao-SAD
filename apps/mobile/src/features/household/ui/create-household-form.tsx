import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AnalyticsTheme } from '@/theme/analytics-theme';
import { HOUSEHOLD_NAME_MAX_LENGTH, validateHouseholdName } from '../domain/household';

export function CreateHouseholdForm({
  onSubmit,
}: {
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const validation = useMemo(() => validateHouseholdName(name), [name]);
  const validationMessage = touched && !validation.valid ? validation.message : null;
  const fieldMessage = validationMessage ?? submitError ?? 'Nhập tên từ 1 đến 80 ký tự.';
  const buttonDisabled = submitting || !validation.valid;

  const submit = async () => {
    setTouched(true);
    if (!validation.valid || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(validation.normalizedName);
    } catch {
      setSubmitError('Không thể lưu hộ gia đình. Vui lòng thử lại.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>BƯỚC 1 / 1 • KHỞI TẠO TỔNG QUAN</Text>
      <Text style={styles.title}>Tạo không gian tài chính chung</Text>
      <Text style={styles.description}>
        Đặt tên dễ nhận biết cho tổ ấm. Bạn sẽ là quản trị viên đầu tiên quản lý dòng tiền và mời bạn đời tham gia.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>TÊN HỘ GIA ĐÌNH</Text>
        <TextInput
          accessibilityLabel="Tên hộ gia đình"
          accessibilityHint={fieldMessage}
          autoCapitalize="sentences"
          autoCorrect={false}
          onBlur={() => setTouched(true)}
          onChangeText={(value) => {
            setName(value);
            setSubmitError(null);
          }}
          onSubmitEditing={() => void submit()}
          placeholder="Ví dụ: Gia đình Hạnh Phúc"
          placeholderTextColor={AnalyticsTheme.colors.textMuted}
          returnKeyType="done"
          style={[styles.input, validationMessage ? styles.inputInvalid : null]}
          value={name}
        />
        <View style={styles.fieldMeta}>
          <Text accessibilityLiveRegion="polite" style={styles.errorText}>
            {validationMessage ?? submitError ?? ' '}
          </Text>
          <Text style={styles.counter}>{name.trim().length}/{HOUSEHOLD_NAME_MAX_LENGTH}</Text>
        </View>
      </View>

      <AnimatedPressable
        accessibilityLabel="Tạo hộ gia đình"
        accessibilityRole="button"
        accessibilityState={{ busy: submitting, disabled: buttonDisabled }}
        disabled={buttonDisabled}
        onPress={() => void submit()}
        style={[styles.button, buttonDisabled ? styles.buttonDisabled : null]}>
        {submitting ? (
          <ActivityIndicator color="#041B2D" />
        ) : (
          <Text style={styles.buttonText}>Tạo Hộ Gia Đình & Tiếp Tục →</Text>
        )}
      </AnimatedPressable>
      <Text style={styles.privacy}>Dữ liệu telemetry được mã hóa an toàn và đồng bộ tức thời.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.borderLight,
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderWidth: 1,
    padding: 24,
    width: '100%',
  },
  eyebrow: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 1.2,
  },
  title: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: AnalyticsTheme.typography.weightBlack,
    lineHeight: 32,
    marginTop: 10,
  },
  description: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  field: { marginTop: 22 },
  label: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputInvalid: { borderColor: AnalyticsTheme.colors.rose },
  fieldMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 7 },
  errorText: { color: AnalyticsTheme.colors.rose, flex: 1, fontSize: 12, lineHeight: 16 },
  counter: { color: AnalyticsTheme.colors.textMuted, fontSize: 11 },
  button: {
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.cyan,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    minHeight: 50,
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  buttonText: {
    color: '#041B2D',
    fontSize: 14,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  privacy: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 14,
    textAlign: 'center',
  },
});
