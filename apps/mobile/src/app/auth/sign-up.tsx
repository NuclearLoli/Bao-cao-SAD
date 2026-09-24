import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';

const plans = ['Free', 'Plus', 'Pro'] as const;

export default function SignUpScreen() {
  const { state, signUp } = useAuthSession();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<(typeof plans)[number]>('Plus');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validationMessage = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }
    if (!displayName.trim() || !email.trim() || password.length < 6) {
      return 'Điền tên, email và mật khẩu từ 6 ký tự trở lên.';
    }
    return 'Tạo xong sẽ vào app luôn bằng tài khoản demo mới.';
  }, [displayName, email, errorMessage, password]);

  if (state.status === 'authenticated') {
    return <Redirect href="/" />;
  }

  const submit = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await signUp({ displayName, email, password, plan });
      router.replace('/' as never);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tạo tài khoản demo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen centered>
      <View style={styles.card}>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/auth/welcome' as never)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Về màn chào</Text>
        </Pressable>
        <Text style={styles.eyebrow}>TẠO TÀI KHOẢN DEMO</Text>
        <Text style={styles.title}>Dựng mặt tiền app cho buổi show</Text>
        <Text style={styles.subtitle}>
          Bạn có thể chọn luôn plan để giả lập các gói mở khóa tính năng AI/agent ngay trên front-end.
        </Text>

        <Text style={styles.label}>Tên hiển thị</Text>
        <TextInput
          accessibilityLabel="Tên hiển thị"
          onChangeText={setDisplayName}
          placeholder="Ví dụ: Nguyễn Văn Nu"
          placeholderTextColor="#90A097"
          style={styles.input}
          value={displayName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          accessibilityLabel="Email đăng ký"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#90A097"
          style={styles.input}
          value={email}
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          accessibilityLabel="Mật khẩu đăng ký"
          onChangeText={setPassword}
          placeholder="Tối thiểu 6 ký tự"
          placeholderTextColor="#90A097"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        <Text style={styles.label}>Chọn plan</Text>
        <View style={styles.planRow}>
          {plans.map((option) => {
            const active = plan === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => setPlan(option)}
                style={[styles.planButton, active ? styles.planButtonActive : null]}>
                <Text style={[styles.planButtonText, active ? styles.planButtonTextActive : null]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.helperText}>{validationMessage}</Text>

        <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{submitting ? 'Đang tạo...' : 'Tạo tài khoản & vào app'}</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5DF',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
  },
  backButton: { alignSelf: 'flex-start', marginBottom: 18 },
  backButtonText: { color: '#256341', fontSize: 13, fontWeight: '700' },
  eyebrow: { color: '#15803D', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#16231C', fontSize: 30, fontWeight: '900', marginTop: 12 },
  subtitle: { color: '#65746B', fontSize: 15, lineHeight: 23, marginTop: 10 },
  label: { color: '#23352C', fontSize: 14, fontWeight: '800', marginBottom: 10, marginTop: 18 },
  input: {
    backgroundColor: '#FAFCFB',
    borderColor: '#C8D4CD',
    borderRadius: 16,
    borderWidth: 1.5,
    color: '#16231C',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  planRow: { flexDirection: 'row', gap: 10 },
  planButton: {
    alignItems: 'center',
    backgroundColor: '#EEF3EF',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  planButtonActive: { backgroundColor: '#153E29' },
  planButtonText: { color: '#607066', fontSize: 13, fontWeight: '700' },
  planButtonTextActive: { color: '#FFFFFF' },
  helperText: { color: '#7C5D28', fontSize: 13, lineHeight: 20, marginTop: 14 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#153E29',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 54,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
