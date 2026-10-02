import React from 'react';
import { StyleSheet, View } from 'react-native';

export function AnalyticsBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Top Left Ambient Cyan Glow */}
      <View style={styles.glowTopLeft} />

      {/* Top Right Ambient Emerald Glow */}
      <View style={styles.glowTopRight} />

      {/* Center Subtle Grid lines */}
      <View style={styles.gridOverlay}>
        <View style={styles.horizontalLine} />
        <View style={[styles.horizontalLine, { top: '35%' }]} />
        <View style={[styles.horizontalLine, { top: '65%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowTopLeft: {
    position: 'absolute',
    top: -100,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  glowTopRight: {
    position: 'absolute',
    top: -60,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  horizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '12%',
    height: 1,
    backgroundColor: '#334155',
  },
});
