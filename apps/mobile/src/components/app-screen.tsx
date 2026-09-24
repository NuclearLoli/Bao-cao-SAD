import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CherryBlossomBackground } from '@/components/cherry-blossom-background';

export function AppScreen({
  children,
  centered = false,
  contentStyle,
}: PropsWithChildren<{ centered?: boolean; contentStyle?: StyleProp<ViewStyle> }>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <CherryBlossomBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, centered ? styles.scrollContentCentered : null]}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.content, contentStyle]}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF0F6' },
  keyboardArea: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  scrollContentCentered: { justifyContent: 'center' },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', zIndex: 1 },
});
