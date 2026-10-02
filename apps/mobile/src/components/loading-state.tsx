import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyticsTheme } from '@/theme/analytics-theme';

export function LoadingState({ label = 'Đang đồng bộ dữ liệu dòng tiền…' }: { label?: string }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <ActivityIndicator color={AnalyticsTheme.colors.cyan} size="large" />
        <Text style={styles.label}>{label}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AnalyticsTheme.colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  label: { color: AnalyticsTheme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
