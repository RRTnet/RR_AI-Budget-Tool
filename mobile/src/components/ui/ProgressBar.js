import React from 'react';
import { View, StyleSheet } from 'react-native';
import { G } from '../../constants/colors';

export default function ProgressBar({ pct = 0, color, height = 8, style }) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  const fillColor = color || G.gold;

  return (
    <View style={[styles.track, { height }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedPct}%`,
            backgroundColor: fillColor,
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: G.border,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
