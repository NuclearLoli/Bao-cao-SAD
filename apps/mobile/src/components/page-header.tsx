import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { AnalyticsTheme } from '@/theme/analytics-theme';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  backLabel,
  backHref = '/dashboard',
  onBackPress,
  actionLabel,
  onActionPress,
  profileName,
  onProfilePress,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  backLabel?: string;
  backHref?: string;
  onBackPress?: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
  profileName?: string;
  onProfilePress?: () => void;
}) {
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace((backHref ?? '/dashboard') as never);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.topRow}>
        {backLabel ? (
          <AnimatedPressable
            accessibilityRole="button"
            onPress={handleBack}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>{backLabel}</Text>
          </AnimatedPressable>
        ) : (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>SYNCED LIVE</Text>
          </View>
        )}

        <View style={styles.topRightActions}>
          {profileName && onProfilePress ? (
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Hồ sơ tài khoản"
              onPress={onProfilePress}
              style={styles.profileBadge}>
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>{profileName.slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text style={styles.profileBadgeText} numberOfLines={1}>
                {profileName.split(' ').slice(-1)[0]}
              </Text>
            </AnimatedPressable>
          ) : null}

          {actionLabel && onActionPress ? (
            <AnimatedPressable
              accessibilityRole="button"
              onPress={onActionPress}
              style={styles.actionButton}>
              <Text style={styles.actionButtonText}>+ {actionLabel}</Text>
            </AnimatedPressable>
          ) : null}
        </View>
      </View>

      <View style={styles.eyebrowContainer}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 5, marginBottom: 14 },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AnalyticsTheme.colors.emerald,
  },
  liveText: {
    color: AnalyticsTheme.colors.emerald,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  backButton: {
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backButtonText: { color: AnalyticsTheme.colors.textSecondary, fontSize: 12.5, fontWeight: '700' },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AnalyticsTheme.colors.cardElevated,
    borderColor: AnalyticsTheme.colors.borderLight,
    borderWidth: 1,
    borderRadius: 999,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 3,
    gap: 5,
  },
  avatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AnalyticsTheme.colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#090D16',
    fontSize: 11,
    fontWeight: '900',
  },
  profileBadgeText: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 11.5,
    fontWeight: '700',
    maxWidth: 90,
  },
  actionButton: {
    backgroundColor: AnalyticsTheme.colors.cyan,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    elevation: 3,
    shadowColor: AnalyticsTheme.colors.cyan,
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  actionButtonText: { color: '#090D16', fontSize: 12.5, fontWeight: '800' },

  eyebrowContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.22)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginTop: 2,
  },
  eyebrow: {
    color: AnalyticsTheme.colors.cyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: AnalyticsTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  subtitle: {
    color: AnalyticsTheme.colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    maxWidth: 520,
  },
});
