import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import {
  hashPin,
  securityRateLimiter,
  verifyPin,
} from '@/core/security/security-utils';
import { AnalyticsTheme } from '@/theme/analytics-theme';

const PIN_STORAGE_KEY = 'cashflow.security.pin';
const PRIVACY_MODE_STORAGE_KEY = 'cashflow.security.privacy_mode';

type SecurityContextValue = {
  hasPin: boolean;
  isLocked: boolean;
  isPrivacyMode: boolean;
  setPin: (pin: string) => Promise<boolean>;
  removePin: () => Promise<void>;
  unlockWithPin: (pin: string) => { success: boolean; message?: string };
  togglePrivacyMode: () => void;
  formatMoneySecure: (amount: number, fallbackFormatted: string) => string;
  lockApp: () => void;
};

const SecurityContext = createContext<SecurityContextValue | null>(null);

export function AppSecurityProvider({ children }: PropsWithChildren) {
  const [storedPinHash, setStoredPinHash] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadSecuritySettings() {
      try {
        const [savedPinHash, savedPrivacy] = await Promise.all([
          AsyncStorage.getItem(PIN_STORAGE_KEY),
          AsyncStorage.getItem(PRIVACY_MODE_STORAGE_KEY),
        ]);

        if (savedPinHash) {
          setStoredPinHash(savedPinHash);
          setIsLocked(true); // Auto-lock on app startup if PIN is set
        }
        if (savedPrivacy === 'true') {
          setIsPrivacyMode(true);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setIsReady(true);
      }
    }

    void loadSecuritySettings();
  }, []);

  const setPin = async (newPin: string): Promise<boolean> => {
    if (!/^\d{4}$/.test(newPin)) {
      return false;
    }
    const hashed = hashPin(newPin);
    await AsyncStorage.setItem(PIN_STORAGE_KEY, hashed);
    setStoredPinHash(hashed);
    return true;
  };

  const removePin = async (): Promise<void> => {
    await AsyncStorage.removeItem(PIN_STORAGE_KEY);
    setStoredPinHash(null);
    setIsLocked(false);
  };

  const unlockWithPin = (pin: string): { success: boolean; message?: string } => {
    if (!storedPinHash) {
      setIsLocked(false);
      return { success: true };
    }

    const rateCheck = securityRateLimiter.checkAttempt('pin_lock');
    if (!rateCheck.allowed) {
      return {
        success: false,
        message: `Đã thử sai quá nhiều lần. Vui lòng chờ ${rateCheck.remainingWaitSec}s để thử lại.`,
      };
    }

    const isValid = verifyPin(pin, storedPinHash);
    if (isValid) {
      securityRateLimiter.recordSuccess('pin_lock');
      setIsLocked(false);
      return { success: true };
    } else {
      const failure = securityRateLimiter.recordFailure('pin_lock');
      if (failure.isLocked) {
        return {
          success: false,
          message: `Sai mã PIN 5 lần! Hệ thống tạm khóa ${failure.remainingWaitSec}s để bảo mật.`,
        };
      }
      return { success: false, message: 'Mã PIN không chính xác. Vui lòng nhập lại.' };
    }
  };

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      void AsyncStorage.setItem(PRIVACY_MODE_STORAGE_KEY, next ? 'true' : 'false');
      return next;
    });
  };

  const formatMoneySecure = (_amount: number, fallbackFormatted: string): string => {
    if (isPrivacyMode) {
      return '•••••••• ₫';
    }
    return fallbackFormatted;
  };

  const lockApp = () => {
    if (storedPinHash) {
      setIsLocked(true);
    }
  };

  const value: SecurityContextValue = {
    hasPin: storedPinHash !== null,
    isLocked,
    isPrivacyMode,
    setPin,
    removePin,
    unlockWithPin,
    togglePrivacyMode,
    formatMoneySecure,
    lockApp,
  };

  if (!isReady) {
    return null;
  }

  return (
    <SecurityContext.Provider value={value}>
      {children}
      {isLocked && storedPinHash ? (
        <PinLockOverlay onUnlock={unlockWithPin} />
      ) : null}
    </SecurityContext.Provider>
  );
}

export function useAppSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useAppSecurity must be used within an AppSecurityProvider');
  }
  return context;
}

/**
 * Màn hình khóa PIN bảo vệ dữ liệu tài chính
 */
function PinLockOverlay({
  onUnlock,
}: {
  onUnlock: (pin: string) => { success: boolean; message?: string };
}) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg(null);

      if (newPin.length === 4) {
        setTimeout(() => {
          const result = onUnlock(newPin);
          if (!result.success) {
            setErrorMsg(result.message ?? 'Mã PIN không đúng.');
            setPin('');
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.lockBadge}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        <Text style={styles.title}>Bảo Mật Dòng Tiền Gia Đình</Text>
        <Text style={styles.subtitle}>
          Nhập mã PIN 4 chữ số để mở khóa không gian tài chính
        </Text>

        {/* PIN Indicators */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pin.length;
            return (
              <View
                key={index}
                style={[styles.dot, isFilled ? styles.dotFilled : null]}
              />
            );
          })}
        </View>

        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : (
          <Text style={styles.hintText}>Được bảo vệ bằng mã hóa SHA-256</Text>
        )}

        {/* Numeric Keypad */}
        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', 'DEL'],
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((item, cIdx) => {
                if (item === '') {
                  return <View key={cIdx} style={styles.keypadEmpty} />;
                }
                if (item === 'DEL') {
                  return (
                    <AnimatedPressable
                      key={cIdx}
                      accessibilityRole="button"
                      onPress={handleDelete}
                      style={styles.keypadKeyAction}>
                      <Text style={styles.keypadKeyActionText}>⌫</Text>
                    </AnimatedPressable>
                  );
                }
                return (
                  <AnimatedPressable
                    key={cIdx}
                    accessibilityRole="button"
                    onPress={() => handleKeyPress(item)}
                    style={styles.keypadKey}>
                    <Text style={styles.keypadKeyText}>{item}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#090D16',
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  lockBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: AnalyticsTheme.colors.cyan,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockIcon: {
    fontSize: 28,
  },
  title: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: AnalyticsTheme.typography.weightBlack,
    textAlign: 'center',
  },
  subtitle: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 28,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderColor: AnalyticsTheme.colors.borderLight,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    borderColor: AnalyticsTheme.colors.cyan,
    backgroundColor: AnalyticsTheme.colors.cyan,
    transform: [{ scale: 1.1 }],
  },
  errorText: {
    color: AnalyticsTheme.colors.rose,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  hintText: {
    color: AnalyticsTheme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  keypad: {
    width: '100%',
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keypadKey: {
    flex: 1,
    height: 60,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadKeyText: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  keypadKeyAction: {
    flex: 1,
    height: 60,
    borderRadius: AnalyticsTheme.borderRadius.medium,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadKeyActionText: {
    color: AnalyticsTheme.colors.rose,
    fontSize: 22,
    fontWeight: AnalyticsTheme.typography.weightBold,
  },
  keypadEmpty: {
    flex: 1,
    height: 60,
  },
});
