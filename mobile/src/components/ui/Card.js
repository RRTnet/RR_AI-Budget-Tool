import React from 'react';
import { View, StyleSheet } from 'react-native';
import { G } from '../../constants/colors';

export default function Card({ children, style, accent }) {
  return (
    <View style={[styles.card, accent && { borderLeftWidth: 3, borderLeftColor: accent }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: G.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: G.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
