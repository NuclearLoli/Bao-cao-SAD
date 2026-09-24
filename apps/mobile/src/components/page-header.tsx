import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  backLabel,
  actionLabel,
  onActionPress,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  backLabel?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        {backLabel ? (
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{backLabel}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        {actionLabel && onActionPress ? (
          <Pressable accessibilityRole="button" onPress={onActionPress} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8, marginBottom: 24 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  backButton: {
    backgroundColor: '#E8F2EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  backButtonText: { color: '#1F5A35', fontSize: 13, fontWeight: '700' },
  actionButton: {
    backgroundColor: '#153E29',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  eyebrow: { color: '#15803D', fontSize: 12, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: '#16231C', fontSize: 30, fontWeight: '900', lineHeight: 36 },
  subtitle: { color: '#617067', fontSize: 15, lineHeight: 23, maxWidth: 480 },
});
