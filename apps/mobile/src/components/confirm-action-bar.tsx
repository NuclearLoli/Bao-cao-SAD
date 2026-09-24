import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onConfirm}
          style={[styles.confirmButton, tone === 'danger' ? styles.confirmButtonDanger : null]}>
          <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F7FAF8',
    borderColor: '#DDE7E0',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  cardDanger: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F0C5C5',
  },
  title: { color: '#17231D', fontSize: 15, fontWeight: '800' },
  titleDanger: { color: '#7A1F1F' },
  description: { color: '#64736A', fontSize: 13, lineHeight: 20, marginTop: 6 },
  descriptionDanger: { color: '#8B5252' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#EEF2EF',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  cancelButtonText: { color: '#45564D', fontSize: 13, fontWeight: '800' },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: '#153E29',
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  confirmButtonDanger: { backgroundColor: '#8B1E1E' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
