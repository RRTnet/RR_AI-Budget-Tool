import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { G } from '../../constants/colors';

export default function Spinner({ style }) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={G.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
