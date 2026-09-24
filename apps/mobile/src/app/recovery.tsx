import { Redirect } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { LoadingState } from '@/components/loading-state';
import { useHousehold } from '@/features/household/ui/household-provider';

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
        <View style={styles.icon}><Text style={styles.iconText}>!</Text></View>
        <Text style={styles.title}>{corrupted ? 'Dữ liệu cần được khôi phục' : 'Chưa thể đọc dữ liệu'}</Text>
        <Text style={styles.description}>
          {corrupted
            ? 'Dữ liệu hộ gia đình trên thiết bị không còn đúng định dạng. Ứng dụng sẽ không tự ghi đè lên dữ liệu này.'
            : 'Bộ nhớ thiết bị đang tạm thời không phản hồi. Hãy thử lại sau ít phút.'}
        </Text>

        <Pressable accessibilityRole="button" onPress={() => void retry()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Thử đọc lại</Text>
        </Pressable>
        {corrupted ? (
          <Pressable accessibilityRole="button" onPress={confirmReset} style={styles.dangerButton}>
            <Text style={styles.dangerButtonText}>Xóa dữ liệu cục bộ và tạo lại</Text>
          </Pressable>
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8DDD5',
    borderRadius: 24,
    borderWidth: 1,
    padding: 26,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  iconText: { color: '#92400E', fontSize: 24, fontWeight: '900' },
  title: { color: '#241B16', fontSize: 26, fontWeight: '900', marginTop: 18, textAlign: 'center' },
  description: { color: '#685C55', fontSize: 15, lineHeight: 23, marginTop: 11, textAlign: 'center' },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#166534',
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 26,
    minHeight: 52,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  dangerButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: '#C2410C',
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 52,
  },
  dangerButtonText: { color: '#C2410C', fontSize: 14, fontWeight: '800' },
});
