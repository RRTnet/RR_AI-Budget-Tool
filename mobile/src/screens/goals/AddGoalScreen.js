import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { G } from '../../constants/colors';
import { CURRENCIES, currSym } from '../../constants/currencies';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { addGoalApi } from '../../services/api';
import GoldButton from '../../components/ui/GoldButton';
import InputField from '../../components/ui/InputField';
import ErrorBanner from '../../components/ui/ErrorBanner';

const GOAL_COLORS = [
  '#c9a84c', // gold
  '#22c55e', // green
  '#3b82f6', // blue
  '#ef4444', // red
  '#a855f7', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ec4899', // pink
];

export default function AddGoalScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { refresh } = useData();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('0');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [selectedColor, setSelectedColor] = useState(GOAL_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError('Please enter a goal name.');
      return;
    }
    const parsedTarget = parseFloat(target);
    if (!target || isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Please enter a valid target amount greater than 0.');
      return;
    }
    const parsedSaved = parseFloat(saved) || 0;
    if (parsedSaved < 0) {
      setError('Saved amount cannot be negative.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await addGoalApi(token, {
        name: name.trim(),
        target: parsedTarget,
        saved: parsedSaved,
        color: selectedColor,
        currency,
      });
      await refresh();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e) {
      setError(e.message || 'Failed to add goal. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [name, target, saved, selectedColor, token, refresh, navigation]);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

        <InputField
          label="Goal Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Emergency Fund, Vacation, New Car..."
          autoCapitalize="sentences"
          returnKeyType="next"
        />

        {/* Currency picker */}
        <Text style={styles.sectionLabel}>Currency</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={currency}
            onValueChange={setCurrency}
            style={styles.picker}
            dropdownIconColor={G.gold}
          >
            {CURRENCIES.map(c => (
              <Picker.Item key={c.code} label={`${c.flag} ${c.code} — ${c.name} (${c.sym})`} value={c.code} color={G.text} />
            ))}
          </Picker>
        </View>

        <InputField
          label="Target Amount"
          value={target}
          onChangeText={setTarget}
          placeholder="0.00"
          keyboardType="decimal-pad"
          returnKeyType="next"
          prefix={currSym(currency)}
        />

        <InputField
          label="Already Saved (optional)"
          value={saved}
          onChangeText={setSaved}
          placeholder="0.00"
          keyboardType="decimal-pad"
          returnKeyType="done"
          prefix={currSym(currency)}
        />

        {/* Color Picker */}
        <Text style={styles.sectionLabel}>Goal Color</Text>
        <View style={styles.colorRow}>
          {GOAL_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                selectedColor === color && styles.colorDotSelected,
              ]}
              onPress={() => setSelectedColor(color)}
              activeOpacity={0.8}
            >
              {selectedColor === color && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        <View style={[styles.preview, { borderColor: selectedColor }]}>
          <View style={[styles.previewDot, { backgroundColor: selectedColor }]} />
          <Text style={styles.previewName} numberOfLines={1}>
            {name || 'Goal Name'}
          </Text>
          <Text style={[styles.previewAmount, { color: selectedColor }]}>
            {`${currSym(currency)}${target ? parseFloat(target || 0).toFixed(2) : '0.00'}`}
          </Text>
        </View>

        <GoldButton
          title="Add Goal"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: G.bg,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    color: G.textSoft,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  pickerWrapper: {
    backgroundColor: G.card,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 10,
    marginBottom: 14,
    overflow: 'hidden',
  },
  picker: {
    color: G.text,
    height: 52,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: G.card,
    gap: 10,
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  previewName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: G.text,
  },
  previewAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 4,
  },
});
