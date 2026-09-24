import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';

export default function SignInScreen() {
  const { state, signIn } = useAuthSession();
  const [email, setEmail] = useState('nu@giadinh.vn');
  const [password, setPassword] = useState('123456');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const helper = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }
    return 'Mẹo demo: dùng sẵn nu@giadinh.vn / 123456 hoặc mai@giadinh.vn / 123456.';
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
        <Pressable accessibilityRole="button" onPress={() => router.replace('/auth/welcome' as never)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Về màn chào</Text>
        </Pressable>
        <Text style={styles.eyebrow}>ĐĂNG NHẬP DEMO</Text>
        <Text style={styles.title}>Vào nhanh để show app</Text>
        <Text style={styles.subtitle}>
          Flow này chỉ là front-end shell, nhưng cảm giác dùng sẽ giống app thật hơn nhiều khi thuyết trình.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          accessibilityLabel="Email đăng nhập"
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
          accessibilityLabel="Mật khẩu"
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#90A097"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        <Text style={styles.helperText}>{helper}</Text>

        <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{submitting ? 'Đang vào...' : 'Đăng nhập'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/auth/sign-up' as never)} style={styles.linkButton}>
          <Text style={styles.linkButtonText}>Chưa có tài khoản demo? Tạo ngay</Text>
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
  linkButton: { alignItems: 'center', marginTop: 14 },
  linkButtonText: { color: '#246341', fontSize: 13, fontWeight: '700' },
});
