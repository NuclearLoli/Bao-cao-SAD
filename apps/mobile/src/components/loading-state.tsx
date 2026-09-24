import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LoadingState({ label = 'Đang tải dữ liệu gia đình…' }: { label?: string }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <ActivityIndicator color="#166534" size="large" />
        <Text style={styles.label}>{label}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7F5' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  label: { color: '#3F4C45', fontSize: 15 },
});
