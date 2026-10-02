import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export function ConfirmActionBar({
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  tone = 'default',
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={[styles.card, tone === 'danger' ? styles.cardDanger : null]}>
      <Text style={[styles.title, tone === 'danger' ? styles.titleDanger : null]}>{title}</Text>
      <Text style={[styles.description, tone === 'danger' ? styles.descriptionDanger : null]}>
        {description}
      </Text>
      <View style={styles.actions}>
        <AnimatedPressable
          accessibilityRole="button"
          onPress={onCancel}
          style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
        </AnimatedPressable>
        <AnimatedPressable
          accessibilityRole="button"
          onPress={onConfirm}
          style={[styles.confirmButton, tone === 'danger' ? styles.confirmButtonDanger : null]}>
          <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderColor: AnalyticsTheme.colors.borderLight,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  cardDanger: {
    backgroundColor: '#2A1215',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  title: { color: AnalyticsTheme.colors.textPrimary, fontSize: 15, fontWeight: '800' },
  titleDanger: { color: '#FDA4AF' },
  description: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  descriptionDanger: { color: '#FECDD3' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  cancelButtonText: { color: '#E2E8F0', fontSize: 13, fontWeight: '800' },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.emerald,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  confirmButtonDanger: { backgroundColor: AnalyticsTheme.colors.rose },
  confirmButtonText: { color: '#090D16', fontSize: 13, fontWeight: '800' },
});
