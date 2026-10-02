import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export default function SignInScreen() {
  const { state, signIn } = useAuthSession();
  const [email, setEmail] = useState('nu@giadinh.vn');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const helper = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }
    return 'Gợi ý demo: Tài khoản nu@giadinh.vn (Chồng) hoặc mai@giadinh.vn (Vợ) / MK: 123456';
  }, [errorMessage]);

  if (state.status === 'authenticated') {
    return <Redirect href="/" />;
  }

  const submit = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await signIn({ email, password });
      router.replace('/' as never);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Đăng nhập demo thất bại.');
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

        <Text style={styles.eyebrow}>ĐĂNG NHẬP HỆ THỐNG</Text>
        <Text style={styles.title}>Truy Cập Quản Lý Dòng Tiền</Text>
        <Text style={styles.subtitle}>
          Kết nối thiết bị của bạn vào không gian tài chính chung gia đình.
        </Text>

        <Text style={styles.label}>EMAIL ĐĂNG NHẬP</Text>
        <TextInput
          accessibilityLabel="Email đăng nhập"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
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
          accessibilityLabel="Mật khẩu"
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={AnalyticsTheme.colors.textMuted}
          secureTextEntry={!showPassword}
          style={styles.input}
          value={password}
        />

        <View style={styles.forgotRow}>
          <AnimatedPressable
            accessibilityRole="button"
            onPress={() => router.push('/auth/forgot-password' as never)}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </AnimatedPressable>
        </View>

        <Text style={[styles.helperText, errorMessage ? styles.errorHelper : null]}>{helper}</Text>

        <AnimatedPressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={() => void submit()}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{submitting ? 'Đang xác thực...' : 'Đăng Nhập Ngay →'}</Text>
        </AnimatedPressable>

        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => router.push('/auth/sign-up' as never)}
          style={styles.linkButton}>
          <Text style={styles.linkButtonText}>Chưa có tài khoản? Đăng ký ngay</Text>
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
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
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
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
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
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 12,
    fontWeight: AnalyticsTheme.typography.weightMedium,
  },
});
