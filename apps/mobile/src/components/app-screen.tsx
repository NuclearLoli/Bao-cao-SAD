import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyticsBackground } from '@/components/analytics-background';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export function AppScreen({
  children,
  centered = false,
  contentStyle,
}: PropsWithChildren<{ centered?: boolean; contentStyle?: StyleProp<ViewStyle> }>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <AnalyticsBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, centered ? styles.scrollContentCentered : null]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.content, contentStyle]}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AnalyticsTheme.colors.background,
  },
  keyboardArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  scrollContentCentered: { justifyContent: 'center' },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    zIndex: 1,
  },
});
