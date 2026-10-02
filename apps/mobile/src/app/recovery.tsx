import { Redirect } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AppScreen } from '@/components/app-screen';
import { LoadingState } from '@/components/loading-state';
import { useHousehold } from '@/features/household/ui/household-provider';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export default function RecoveryScreen() {
  const { state, retry, reset } = useHousehold();
  if (state.status === 'loading') {
    return <LoadingState label="Đang thử đọc lại dữ liệu…" />;
  }
  if (state.status === 'empty' || state.status === 'ready') {
    return <Redirect href="/" />;
  }

  const corrupted = state.status === 'corrupted';
  const confirmReset = () => {
    Alert.alert(
      'Xóa dữ liệu bị lỗi?',
      'Thao tác này chỉ xóa dữ liệu hộ gia đình đang lưu trên thiết bị để bạn có thể tạo lại.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa và tạo lại', style: 'destructive', onPress: () => void reset() },
      ],
    );
  };

  return (
    <AppScreen centered>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>⚠️</Text>
        </View>
        <Text style={styles.title}>{corrupted ? 'Dữ liệu cần được khôi phục' : 'Chưa thể đọc dữ liệu'}</Text>
        <Text style={styles.description}>
          {corrupted
            ? 'Dữ liệu lưu trữ cục bộ không còn đúng cấu trúc phân tích tài chính. Ứng dụng sẽ bảo vệ an toàn và không tự động ghi đè.'
            : 'Bộ nhớ lưu trữ thiết bị đang tạm thời không phản hồi. Hãy thử kết nối lại.'}
        </Text>

        <AnimatedPressable accessibilityRole="button" onPress={() => void retry()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Thử Đọc Lại Dữ Liệu</Text>
        </AnimatedPressable>
        {corrupted ? (
          <AnimatedPressable accessibilityRole="button" onPress={confirmReset} style={styles.dangerButton}>
            <Text style={styles.dangerButtonText}>Xóa Dữ Liệu Cục Bộ & Khởi Tạo Mới</Text>
          </AnimatedPressable>
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.borderLight,
    borderRadius: AnalyticsTheme.borderRadius.large,
    borderWidth: 1,
    padding: 26,
    width: '100%',
  },
  icon: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  iconText: { fontSize: 24 },
  title: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: AnalyticsTheme.typography.weightBlack,
    marginTop: 18,
    textAlign: 'center',
  },
  description: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 11,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: AnalyticsTheme.colors.cyan,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    justifyContent: 'center',
    marginTop: 26,
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#041B2D',
    fontSize: 14,
    fontWeight: AnalyticsTheme.typography.weightBlack,
  },
  dangerButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: AnalyticsTheme.colors.rose,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 50,
  },
  dangerButtonText: {
    color: AnalyticsTheme.colors.rose,
    fontSize: 13,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
});
