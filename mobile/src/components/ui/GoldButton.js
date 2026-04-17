import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { G } from '../../constants/colors';

export default function GoldButton({ title, onPress, disabled, loading, style, variant = 'gold' }) {
  const isDisabled = disabled || loading;

  const variantStyles = {
    gold:    { bg: G.gold,               text: '#000', shadow: G.gold },
    danger:  { bg: G.red,                text: '#fff', shadow: G.red },
    outline: { bg: 'transparent',        text: G.gold, shadow: 'transparent' },
    ghost:   { bg: 'rgba(255,255,255,0.05)', text: G.textSoft, shadow: 'transparent' },
  };
  const v = variantStyles[variant] || variantStyles.gold;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: v.bg,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: variant === 'outline' ? G.gold : 'transparent',
          shadowColor: v.shadow,
        },
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={v.text} style={styles.indicator} />
          <Text style={[styles.text, { color: v.text }]}>{title}</Text>
        </View>
      ) : (
        <Text style={[styles.text, { color: v.text }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  disabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    marginRight: 8,
  },
});
