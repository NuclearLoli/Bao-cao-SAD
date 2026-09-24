import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

const leftBlossoms = [
  { top: 120, left: 10, size: 34, color: '#F6B7C8' },
  { top: 165, left: 38, size: 22, color: '#FFD4E2' },
  { top: 210, left: 18, size: 28, color: '#F9C6D6' },
  { top: 258, left: 48, size: 18, color: '#FFE3EC' },
  { top: 320, left: 16, size: 30, color: '#F6B7C8' },
  { top: 380, left: 36, size: 24, color: '#FFD4E2' },
];

const rightBlossoms = [
  { top: 138, right: 12, size: 32, color: '#F6B7C8' },
  { top: 186, right: 44, size: 24, color: '#FFD4E2' },
  { top: 236, right: 14, size: 26, color: '#F9C6D6' },
  { top: 292, right: 42, size: 20, color: '#FFE3EC' },
  { top: 352, right: 18, size: 28, color: '#F6B7C8' },
  { top: 416, right: 34, size: 24, color: '#FFD4E2' },
];

function BlossomCluster({
  top,
  left,
  right,
  size,
  color,
}: {
  top: number;
  left?: number;
  right?: number;
  size: number;
  color: string;
}) {
  return (
    <View
      style={[
        styles.blossomCluster,
        {
          top,
          left,
          right,
          width: size,
          height: size,
        },
      ]}>
      {[
        { dx: 0, dy: 0 },
        { dx: size * 0.28, dy: size * 0.06 },
        { dx: size * 0.08, dy: size * 0.28 },
        { dx: size * 0.34, dy: size * 0.34 },
      ].map((petal, index) => (
        <View
          key={`${top}-${left ?? right}-${index}`}
          style={[
            styles.petal,
            {
              backgroundColor: color,
              width: size * 0.54,
              height: size * 0.54,
              left: petal.dx,
              top: petal.dy,
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.centerDot,
          {
            left: size * 0.23,
            top: size * 0.23,
          },
        ]}
      />
    </View>
  );
}

export function CherryBlossomBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.skyGlowTop} />
      <View style={styles.skyGlowBottom} />

      <View style={styles.leftTree}>
        <View style={styles.trunk} />
        <View style={[styles.branch, styles.leftBranchTop]} />
        <View style={[styles.branch, styles.leftBranchMid]} />
        <View style={[styles.branch, styles.leftBranchLow]} />
      </View>

      <View style={styles.rightTree}>
        <View style={styles.trunk} />
        <View style={[styles.branch, styles.rightBranchTop]} />
        <View style={[styles.branch, styles.rightBranchMid]} />
        <View style={[styles.branch, styles.rightBranchLow]} />
      </View>

      {leftBlossoms.map((blossom) => (
        <Fragment key={`left-${blossom.top}-${blossom.left}`}>
          <BlossomCluster {...blossom} />
        </Fragment>
      ))}
      {rightBlossoms.map((blossom) => (
        <Fragment key={`right-${blossom.top}-${blossom.right}`}>
          <BlossomCluster {...blossom} />
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skyGlowTop: {
    position: 'absolute',
    top: -120,
    left: 40,
    right: 40,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  skyGlowBottom: {
    position: 'absolute',
    bottom: 80,
    left: 60,
    right: 60,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 240, 245, 0.45)',
  },
  leftTree: {
    position: 'absolute',
    left: -10,
    top: 90,
    bottom: 0,
    width: 78,
  },
  rightTree: {
    position: 'absolute',
    right: -10,
    top: 90,
    bottom: 0,
    width: 78,
  },
  trunk: {
    position: 'absolute',
    bottom: -40,
    left: 28,
    width: 18,
    height: '92%',
    borderRadius: 18,
    backgroundColor: '#7B4A57',
    opacity: 0.55,
  },
  branch: {
    position: 'absolute',
    width: 12,
    borderRadius: 12,
    backgroundColor: '#8A5665',
    opacity: 0.5,
  },
  leftBranchTop: {
    left: 22,
    top: 64,
    height: 96,
    transform: [{ rotate: '-35deg' }],
  },
  leftBranchMid: {
    left: 30,
    top: 180,
    height: 88,
    transform: [{ rotate: '28deg' }],
  },
  leftBranchLow: {
    left: 18,
    top: 320,
    height: 92,
    transform: [{ rotate: '-20deg' }],
  },
  rightBranchTop: {
    right: 22,
    top: 64,
    height: 96,
    transform: [{ rotate: '35deg' }],
  },
  rightBranchMid: {
    right: 30,
    top: 180,
    height: 88,
    transform: [{ rotate: '-28deg' }],
  },
  rightBranchLow: {
    right: 18,
    top: 320,
    height: 92,
    transform: [{ rotate: '20deg' }],
  },
  blossomCluster: {
    position: 'absolute',
  },
  petal: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.96,
  },
  centerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#F8E6A6',
    opacity: 0.9,
  },
});
