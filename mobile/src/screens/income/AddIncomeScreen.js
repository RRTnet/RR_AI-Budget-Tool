import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { G } from '../../constants/colors';
import { INCOME_CATS } from '../../constants/categories';
import { CURRENCIES, currSym } from '../../constants/currencies';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { addIncomeApi } from '../../services/api';
import GoldButton from '../../components/ui/GoldButton';
import InputField from '../../components/ui/InputField';
import CategoryPicker from '../../components/ui/CategoryPicker';
import ErrorBanner from '../../components/ui/ErrorBanner';

function getTodayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function AddIncomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { refresh } = useData();

  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [category, setCategory] = useState('salary');
  const [date, setDate] = useState(getTodayStr());
  const [note, setNote] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!label.trim()) {
      setError('Please enter a label for this income.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setError('Please enter a valid date in YYYY-MM-DD format.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await addIncomeApi(token, {
        label: label.trim(),
        amount: parsedAmount,
        currency,
        category,
        date,
        note: note.trim() || undefined,
        is_recurring: isRecurring,
      });
      await refresh();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e) {
      setError(e.message || 'Failed to add income. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [label, amount, category, date, note, isRecurring, token, refresh, navigation]);

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
          label="Label"
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Monthly Salary, Freelance Project..."
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
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          returnKeyType="next"
          prefix={currSym(currency)}
        />

        <Text style={styles.sectionLabel}>Category</Text>
        <CategoryPicker
          categories={INCOME_CATS}
          selected={category}
          onSelect={setCategory}
          style={styles.catPicker}
        />

        <InputField
          label="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          placeholder="2024-01-15"
          keyboardType="numbers-and-punctuation"
          returnKeyType="next"
        />

        <InputField
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Add a note..."
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />

        {/* Recurring Toggle */}
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Text style={styles.switchLabel}>Recurring Income</Text>
            <Text style={styles.switchHint}>e.g. monthly salary, rent income</Text>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: G.border, true: G.goldFade }}
            thumbColor={isRecurring ? G.gold : G.muted}
            ios_backgroundColor={G.border}
          />
        </View>

        <GoldButton
          title="Add Income"
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
    marginBottom: 8,
  },
  catPicker: {
    marginBottom: 16,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: G.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: G.border,
    padding: 14,
    marginBottom: 16,
  },
  switchLeft: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: G.text,
    marginBottom: 2,
  },
  switchHint: {
    fontSize: 12,
    color: G.textSoft,
  },
  submitBtn: {
    marginTop: 4,
  },
});
