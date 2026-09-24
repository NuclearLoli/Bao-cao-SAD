import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { HOUSEHOLD_NAME_MAX_LENGTH, validateHouseholdName } from '../domain/household';

export function CreateHouseholdForm({
  onSubmit,
}: {
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const validation = useMemo(() => validateHouseholdName(name), [name]);
  const validationMessage = touched && !validation.valid ? validation.message : null;
  const fieldMessage = validationMessage ?? submitError ?? 'Nhập tên từ 1 đến 80 ký tự.';
  const buttonDisabled = submitting;
  const buttonInactive = !validation.valid || submitting;

  const submit = async () => {
    setTouched(true);
    if (!validation.valid || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(validation.normalizedName);
    } catch {
      setSubmitError('Không thể lưu hộ gia đình. Vui lòng thử lại.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>BƯỚC 1 / 1</Text>
      <Text style={styles.title}>Tạo không gian tài chính chung</Text>
      <Text style={styles.description}>
        Đặt tên dễ nhận biết. Bạn sẽ là quản trị viên đầu tiên của hộ gia đình này.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Tên hộ gia đình</Text>
        <TextInput
          accessibilityLabel="Tên hộ gia đình"
          accessibilityHint={fieldMessage}
          autoCapitalize="sentences"
          autoCorrect={false}
          onBlur={() => setTouched(true)}
          onChangeText={(value) => {
            setName(value);
            setSubmitError(null);
          }}
          onSubmitEditing={() => void submit()}
          placeholder="Ví dụ: Gia đình Nguyễn"
          placeholderTextColor="#87938C"
          returnKeyType="done"
          style={[styles.input, validationMessage ? styles.inputInvalid : null]}
          value={name}
        />
        <View style={styles.fieldMeta}>
          <Text accessibilityLiveRegion="polite" style={styles.errorText}>
            {validationMessage ?? submitError ?? ' '}
          </Text>
          <Text style={styles.counter}>{name.trim().length}/{HOUSEHOLD_NAME_MAX_LENGTH}</Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel="Tạo hộ gia đình"
        accessibilityRole="button"
        accessibilityState={{ busy: submitting, disabled: buttonDisabled }}
        disabled={buttonDisabled}
        onPress={() => void submit()}
        style={({ pressed }) => [
          styles.button,
          buttonInactive && styles.buttonDisabled,
          pressed && validation.valid && !submitting && styles.buttonPressed,
        ]}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Tạo hộ gia đình</Text>
        )}
      </Pressable>
      <Text style={styles.privacy}>Dữ liệu hiện được lưu cục bộ trên thiết bị này.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE5DF',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#102A1C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 3,
  },
  eyebrow: { color: '#15803D', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#122118', fontSize: 29, fontWeight: '800', lineHeight: 36, marginTop: 12 },
  description: { color: '#58655E', fontSize: 16, lineHeight: 24, marginTop: 10 },
  field: { marginTop: 28 },
  label: { color: '#26382E', fontSize: 14, fontWeight: '700', marginBottom: 9 },
  input: {
    backgroundColor: '#FAFCFB',
    borderColor: '#BBC9C0',
    borderRadius: 14,
    borderWidth: 1.5,
    color: '#122118',
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  inputInvalid: { borderColor: '#B42318' },
  fieldMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 7 },
  errorText: { color: '#B42318', flex: 1, fontSize: 13, lineHeight: 18 },
  counter: { color: '#708078', fontSize: 12 },
  button: {
    alignItems: 'center',
    backgroundColor: '#166534',
    borderRadius: 14,
    minHeight: 54,
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#A9B7AF' },
  buttonPressed: { backgroundColor: '#14532D', transform: [{ scale: 0.99 }] },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  privacy: { color: '#718078', fontSize: 12, lineHeight: 18, marginTop: 16, textAlign: 'center' },
});
