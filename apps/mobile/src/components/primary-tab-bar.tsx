import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AnalyticsTheme } from '@/theme/analytics-theme';

type IconName = keyof typeof Ionicons.glyphMap;

type TabItem = {
  label: string;
  iconName: IconName;
  activeIconName: IconName;
  href: string;
  match: string;
};

const tabs: TabItem[] = [
  {
    label: 'Tổng quan',
    iconName: 'stats-chart-outline',
    activeIconName: 'stats-chart',
    href: '/dashboard',
    match: '/dashboard',
  },
  {
    label: 'Giao dịch',
    iconName: 'receipt-outline',
    activeIconName: 'receipt',
    href: '/transactions',
    match: '/transactions',
  },
  {
    label: 'Ngân sách',
    iconName: 'wallet-outline',
    activeIconName: 'wallet',
    href: '/budget/setup',
    match: '/budget',
  },
  {
    label: 'Mục tiêu',
    iconName: 'flag-outline',
    activeIconName: 'flag',
    href: '/bills-and-goals',
    match: '/bills-and-goals',
  },
  {
    label: 'Hồ sơ',
    iconName: 'person-outline',
    activeIconName: 'person',
    href: '/account',
    match: '/account',
  },
];

export function PrimaryTabBar() {
  const pathname = usePathname();
  const navigate = (href: string) => router.replace(href as never);

  return (
    <View style={styles.shell}>
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.match);
        return (
          <AnimatedPressable
            key={tab.href}
            accessibilityRole="button"
            onPress={() => navigate(tab.href)}
            style={[styles.tab, active ? styles.tabActive : null]}>
            <Ionicons
              name={active ? tab.activeIconName : tab.iconName}
              size={20}
              color={active ? AnalyticsTheme.colors.cyan : AnalyticsTheme.colors.textMuted}
            />
            <Text
              numberOfLines={1}
              style={[styles.tabText, active ? styles.tabTextActive : null]}>
              {tab.label}
            </Text>
            {active && <View style={styles.activeDot} />}
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#0F1626',
    borderColor: AnalyticsTheme.colors.borderLight,
    borderWidth: 1,
    borderRadius: 24,
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 20,
    padding: 6,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingVertical: 6,
    gap: 3,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 1,
  },
  tabText: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: AnalyticsTheme.colors.cyan,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: AnalyticsTheme.colors.cyan,
  },
});
