import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

const plans = ['Free', 'Plus', 'Pro'] as const;

export default function SignUpScreen() {
  const { state, signUp } = useAuthSession();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState<(typeof plans)[number]>('Pro');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validationMessage = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }
    if (!displayName.trim() || !email.trim() || password.length < 6) {
      return 'Điền họ tên, email hợp lệ và mật khẩu từ 6 ký tự.';
    }
    if (confirmPassword && password !== confirmPassword) {
      return 'Mật khẩu xác nhận chưa khớp.';
    }
    return 'Gói Pro mở khóa trọn bộ phân tích tài chính và AI dự báo.';
  }, [confirmPassword, displayName, email, errorMessage, password]);

  if (state.status === 'authenticated') {
    return <Redirect href="/" />;
  }

  const submit = async () => {
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await signUp({ displayName, email, password, plan });
      router.replace('/' as never);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tạo tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen centered>
      <View style={styles.card}>
        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => router.replace('/auth/welcome' as never)}
          style={styles.backButton}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </AnimatedPressable>

        <Text style={styles.eyebrow}>ĐĂNG KÝ THÀNH VIÊN</Text>
        <Text style={styles.title}>Tạo Tài Khoản Mới</Text>
        <Text style={styles.subtitle}>
          Khởi tạo tài khoản gia đình để bắt đầu kiểm soát dòng tiền và lập ngân sách 4 quỹ.
        </Text>

        <Text style={styles.label}>HỌ & TÊN</Text>
        <TextInput
          accessibilityLabel="Tên hiển thị"
          onChangeText={(v) => {
            setDisplayName(v);
            setErrorMessage(null);
          }}
          placeholder="Ví dụ: Hoàng Tuấn Nu"
          placeholderTextColor={AnalyticsTheme.colors.textMuted}
          style={styles.input}
          value={displayName}
        />

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          accessibilityLabel="Email đăng ký"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(v) => {
            setEmail(v);
            setErrorMessage(null);
          }}
          placeholder="you@example.com"
          placeholderTextColor={AnalyticsTheme.colors.textMuted}
          style={styles.input}
          value={email}
        />

        <View style={styles.passwordHeader}>
          <Text style={styles.labelNoMargin}>MẬT KHẨU</Text>
          <AnimatedPressable onPress={() => setShowPassword((prev) => !prev)}>
            <Text style={styles.togglePasswordText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
          </AnimatedPressable>
        </View>
        <TextInput
          accessibilityLabel="Mật khẩu đăng ký"
          onChangeText={(v) => {
            setPassword(v);
            setErrorMessage(null);
          }}
          placeholder="Tối thiểu 6 ký tự, gồm chữ & số"
          placeholderTextColor={AnalyticsTheme.colors.textMuted}
          secureTextEntry={!showPassword}
          style={styles.input}
          value={password}
        />

        <Text style={styles.label}>XÁC NHẬN MẬT KHẨU</Text>
        <TextInput
          accessibilityLabel="Xác nhận mật khẩu"
          onChangeText={(v) => {
            setConfirmPassword(v);
            setErrorMessage(null);
          }}
          placeholder="Nhập lại mật khẩu"
          placeholderTextColor={AnalyticsTheme.colors.textMuted}
          secureTextEntry={!showPassword}
          style={styles.input}
          value={confirmPassword}
        />

        <Text style={styles.label}>GÓI DỊCH VỤ</Text>
        <View style={styles.planRow}>
          {plans.map((option) => {
            const active = plan === option;
            return (
              <AnimatedPressable
                key={option}
                accessibilityRole="button"
                onPress={() => setPlan(option)}
                style={[styles.planButton, active ? styles.planButtonActive : null]}>
                <Text style={[styles.planButtonText, active ? styles.planButtonTextActive : null]}>{option}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <Text style={[styles.helperText, errorMessage ? styles.errorHelper : null]}>{validationMessage}</Text>

        <AnimatedPressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={() => void submit()}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{submitting ? 'Đang tạo...' : 'Tạo Tài Khoản & Bắt Đầu →'}</Text>
        </AnimatedPressable>

        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => router.push('/auth/sign-in' as never)}
          style={styles.linkButton}>
          <Text style={styles.linkButtonText}>Đã có tài khoản? Đăng nhập ngay</Text>
        </AnimatedPressable>
      </View>
    </AppScreen>
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
  backButton: { alignSelf: 'flex-start', marginBottom: 14 },
  backButtonText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightBold,
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
    marginTop: 8,
  },
  subtitle: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  label: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 14,
  },
  labelNoMargin: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.8,
  },
  togglePasswordText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 12,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  planRow: { flexDirection: 'row', gap: 10 },
  planButton: {
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  planButtonActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: AnalyticsTheme.colors.cyan,
  },
  planButtonText: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  planButtonTextActive: {
    color: AnalyticsTheme.colors.cyan,
  },
  helperText: {
    color: AnalyticsTheme.colors.amber,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  errorHelper: {
    color: AnalyticsTheme.colors.rose,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.cyan,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#041B2D',
    fontSize: 14,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  linkButton: { alignItems: 'center', marginTop: 14 },
  linkButtonText: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightMedium,
  },
});
