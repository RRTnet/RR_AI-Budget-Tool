import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { G } from '../../constants/colors';

export default function StatCard({ label, value, color, sub, icon, style }) {
  const accentColor = color || G.gold;
  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {icon && (
          <View style={[styles.iconBadge, { backgroundColor: `${accentColor}18` }]}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: accentColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      {/* Bottom accent line */}
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    backgroundColor: G.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: G.border,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    color: G.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  sub: {
    fontSize: 11,
    color: G.muted,
    marginTop: 2,
  },
  accent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    opacity: 0.6,
  },
});
