import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const tabs = [
  { label: 'Tổng quan', href: '/dashboard', match: '/dashboard' },
  { label: 'Ngân sách', href: '/budget/setup', match: '/budget' },
  { label: 'Giao dịch', href: '/transactions', match: '/transactions' },
  { label: 'Tài khoản', href: '/account', match: '/account' },
] as const;

export function PrimaryTabBar() {
  const pathname = usePathname();
  const navigate = (href: string) => router.replace(href as never);

  return (
    <View style={styles.shell}>
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.match);
        return (
          <Pressable
            key={tab.href}
            accessibilityRole="button"
            onPress={() => navigate(tab.href)}
            style={[styles.tab, active ? styles.tabActive : null]}>
            <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#E7EEE9',
    borderRadius: 22,
    flexDirection: 'row',
    gap: 8,
    marginTop: 28,
    padding: 8,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  tabActive: {
    backgroundColor: '#153E29',
    elevation: 3,
    shadowColor: '#122118',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  tabText: { color: '#617067', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#FFFFFF' },
});
