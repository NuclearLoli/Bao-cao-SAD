import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';

export default function AuthWelcomeScreen() {
  const { state, continueWithDemoAccount } = useAuthSession();
  const accounts = state.status === 'loading' ? [] : state.accounts;

  return (
    <AppScreen centered contentStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>FRONTEND DEMO SHELL</Text>
        <Text style={styles.title}>Quản lý dòng tiền gia đình</Text>
        <Text style={styles.subtitle}>
          Bản này ưu tiên show front-end đầy đủ: có chào đầu vào, đăng nhập, đăng ký, dashboard,
          ngân sách, giao dịch và tài khoản.
        </Text>

        <View style={styles.actionStack}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/auth/sign-in' as never)} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Đăng nhập</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/auth/sign-up' as never)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Tạo tài khoản demo</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.quickCard}>
        <Text style={styles.quickEyebrow}>VÀO NHANH ĐỂ SHOW</Text>
        <Text style={styles.quickTitle}>Chọn sẵn một tài khoản demo</Text>
        <View style={styles.accountList}>
          {accounts.map((account) => (
            <Pressable
              key={account.id}
              accessibilityRole="button"
              onPress={() => void continueWithDemoAccount(account.id)}
              style={styles.accountTile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{account.displayName.slice(0, 1)}</Text>
              </View>
              <View style={styles.accountTextGroup}>
                <Text style={styles.accountName}>{account.displayName}</Text>
                <Text style={styles.accountMeta}>
                  {account.plan} · {account.roleLabel}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  heroCard: {
    backgroundColor: '#163B29',
    borderRadius: 28,
    padding: 26,
  },
  eyebrow: { color: '#9AD6B1', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', lineHeight: 40, marginTop: 14 },
  subtitle: { color: '#D4E4DA', fontSize: 15, lineHeight: 23, marginTop: 12 },
  actionStack: { gap: 12, marginTop: 22 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryButtonText: { color: '#163B29', fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#7ED2A1',
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 54,
  },
  secondaryButtonText: { color: '#EAF9EF', fontSize: 15, fontWeight: '800' },
  quickCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5DF',
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
  },
  quickEyebrow: { color: '#6F7F75', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  quickTitle: { color: '#17231D', fontSize: 22, fontWeight: '900', marginTop: 10 },
  accountList: { gap: 12, marginTop: 18 },
  accountTile: {
    alignItems: 'center',
    backgroundColor: '#F6FAF7',
    borderColor: '#E1EAE4',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#DCF5E5',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: { color: '#166534', fontSize: 20, fontWeight: '900' },
  accountTextGroup: { flex: 1 },
  accountName: { color: '#15211B', fontSize: 15, fontWeight: '800' },
  accountMeta: { color: '#67776D', fontSize: 13, marginTop: 4 },
});
