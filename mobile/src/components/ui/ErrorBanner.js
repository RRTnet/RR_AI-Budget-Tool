import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { G } from '../../constants/colors';

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d1515',
    borderColor: G.red,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  message: {
    flex: 1,
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 18,
  },
  dismissBtn: {
    marginLeft: 8,
    padding: 2,
  },
  dismiss: {
    color: G.textSoft,
    fontSize: 14,
    fontWeight: '600',
  },
});
