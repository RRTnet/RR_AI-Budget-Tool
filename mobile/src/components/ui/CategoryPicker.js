import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { G } from '../../constants/colors';

export default function CategoryPicker({ categories, selected, onSelect, style }) {
  const entries = Object.entries(categories);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
      keyboardShouldPersistTaps="handled"
    >
      {entries.map(([key, emoji]) => {
        const isActive = selected === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(key)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: G.border,
    backgroundColor: G.card,
    marginRight: 8,
  },
  chipActive: {
    borderColor: G.gold,
    backgroundColor: G.goldFade,
  },
  emoji: {
    fontSize: 14,
    marginRight: 5,
  },
  label: {
    fontSize: 12,
    color: G.textSoft,
    fontWeight: '500',
  },
  labelActive: {
    color: G.goldSoft,
    fontWeight: '600',
  },
});
