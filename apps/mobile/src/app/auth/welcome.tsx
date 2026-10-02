import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { useAuthSession } from '@/features/auth/ui/auth-session-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export default function AuthWelcomeScreen() {
  const { state, continueWithDemoAccount } = useAuthSession();
  const accounts = state.status === 'loading' ? [] : state.accounts;

  if (state.status === 'authenticated') {
    return <Redirect href="/" />;
  }

  return (
    <AppScreen centered contentStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeaderRow}>
          <Text style={styles.eyebrow}>FINANCIAL TELEMETRY SUITE</Text>
          <View style={styles.proTag}>
            <Text style={styles.proTagText}>v2.0 PRO</Text>
          </View>
        </View>
        <Text style={styles.title}>Quản Lý Dòng Tiền Gia Đình</Text>
        <Text style={styles.subtitle}>
          Hệ thống điều phối tài chính gia đình theo mô hình 4 Quỹ (45/35/10) & 2 Ví Riêng Vợ Chồng.
          Minh bạch thu chi, dự báo dòng tiền và loại bỏ hoàn toàn tranh cãi tài chính.
        </Text>

        <View style={styles.actionStack}>
          <AnimatedPressable
            accessibilityRole="button"
            onPress={() => router.push('/auth/sign-in' as never)}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Đăng Nhập Tài Khoản →</Text>
          </AnimatedPressable>
          <AnimatedPressable
            accessibilityRole="button"
            onPress={() => router.push('/auth/sign-up' as never)}
            style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Tạo Tài Khoản Mới</Text>
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.quickCard}>
        <Text style={styles.quickEyebrow}>TRUY CẬP NHANH DEMO</Text>
        <Text style={styles.quickTitle}>Chọn tài khoản mẫu có sẵn</Text>
        <View style={styles.accountList}>
          {accounts.map((account) => (
            <AnimatedPressable
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
                  {account.plan} Analytics · {account.roleLabel}
                </Text>
              </View>
              <Text style={styles.enterArrow}>→</Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  heroCard: {
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.borderLight,
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderWidth: 1,
    padding: 24,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 1.2,
  },
  proTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proTagText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 9,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 0.8,
  },
  title: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 26,
    fontWeight: AnalyticsTheme.typography.weightBlack,
    lineHeight: 34,
    marginTop: 12,
  },
  subtitle: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  actionStack: { gap: 10, marginTop: 20 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.cyan,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#041B2D',
    fontSize: 14,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: AnalyticsTheme.colors.borderLight,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    backgroundColor: AnalyticsTheme.colors.backgroundSubtle,
    justifyContent: 'center',
    minHeight: 50,
  },
  secondaryButtonText: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  quickCard: {
    backgroundColor: AnalyticsTheme.colors.card,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderWidth: 1,
    padding: 20,
  },
  quickEyebrow: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: AnalyticsTheme.typography.weightBold,
    letterSpacing: 1,
  },
  quickTitle: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 17,
    fontWeight: AnalyticsTheme.typography.weightBold,
    marginTop: 4,
  },
  accountList: { gap: 10, marginTop: 14 },
  accountTile: {
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.border,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 18,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  accountTextGroup: { flex: 1 },
  accountName: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  accountMeta: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  enterArrow: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 16,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
});
