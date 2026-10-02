import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuthSession();
  const [email, setEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !recoveryCode.trim() || !newPassword) {
      setErrorMessage('Vui lòng điền đầy đủ các thông tin khôi phục.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await resetPassword({
        email: email.trim(),
        recoveryCode: recoveryCode.trim(),
        newPassword,
      });
      setSuccessMessage('Khôi phục mật khẩu thành công! Đang chuyển về dashboard...');
      setTimeout(() => {
        router.replace('/dashboard' as never);
      }, 1200);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Khôi phục mật khẩu thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen centered>
      <View style={styles.card}>
        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => router.replace('/auth/sign-in' as never)}
          style={styles.backButton}>
          <Text style={styles.backButtonText}>← Quay lại đăng nhập</Text>
        </AnimatedPressable>

        <Text style={styles.eyebrow}>KHÔI PHỤC TÀI KHOẢN</Text>
        <Text style={styles.title}>Quên Mật Khẩu</Text>
        <Text style={styles.subtitle}>
          Nhập email tài khoản và mã khôi phục bí mật (Recovery Code) được cấp khi tạo tài khoản.
        </Text>

        <Text style={styles.label}>EMAIL TÀI KHOẢN</Text>
        <TextInput
          accessibilityLabel="Email tài khoản"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(v) => {
            setEmail(v);
            setErrorMessage(null);
          }}
          placeholder="nu@giadinh.vn"
          placeholderTextColor={AnalyticsTheme.colors.textMuted}
          style={styles.input}
          value={email}
        />

        <Text style={styles.label}>MÃ KHÔI PHỤC (RECOVERY CODE)</Text>
        <TextInput
          accessibilityLabel="Mã khôi phục"
          autoCapitalize="characters"
          onChangeText={(v) => {
            setRecoveryCode(v);
            setErrorMessage(null);
          }}
          placeholder="Ví dụ: REC-NU-2026"
          placeholderTextColor={AnalyticsTheme.colors.textMuted}
          style={styles.input}
          value={recoveryCode}
        />

        <Text style={styles.label}>MẬT KHẨU MỚI</Text>
        <TextInput
          accessibilityLabel="Mật khẩu mới"
          onChangeText={(v) => {
            setNewPassword(v);
            setErrorMessage(null);
          }}
          placeholder="Tối thiểu 6 ký tự, gồm chữ & số"
          placeholderTextColor={AnalyticsTheme.colors.textMuted}
          secureTextEntry
          style={styles.input}
          value={newPassword}
        />

        <Text style={styles.label}>XÁC NHẬN MẬT KHẨU MỚI</Text>
        <TextInput
          accessibilityLabel="Xác nhận mật khẩu"
          onChangeText={(v) => {
            setConfirmPassword(v);
            setErrorMessage(null);
          }}
          placeholder="Nhập lại mật khẩu mới"
          placeholderTextColor={AnalyticsTheme.colors.textMuted}
          secureTextEntry
          style={styles.input}
          value={confirmPassword}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <AnimatedPressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={() => void handleSubmit()}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Đang khôi phục...' : 'Đặt Lại Mật Khẩu & Đăng Nhập →'}
          </Text>
        </AnimatedPressable>

        <View style={styles.demoHintBox}>
          <Text style={styles.demoHintTitle}>💡 Gợi ý mã demo có sẵn:</Text>
          <Text style={styles.demoHintText}>• nu@giadinh.vn: mã REC-NU-2026</Text>
          <Text style={styles.demoHintText}>• mai@giadinh.vn: mã REC-MAI-2026</Text>
        </View>
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
  errorText: {
    color: AnalyticsTheme.colors.rose,
    fontSize: 12,
    marginTop: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  successText: {
    color: AnalyticsTheme.colors.emerald,
    fontSize: 13,
    marginTop: 10,
    fontWeight: AnalyticsTheme.typography.weightBold,
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
  demoHintBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    padding: 12,
    marginTop: 16,
  },
  demoHintTitle: {
    color: AnalyticsTheme.colors.amber,
    fontSize: 12,
    fontWeight: AnalyticsTheme.typography.weightBold,
    marginBottom: 4,
  },
  demoHintText: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
});
