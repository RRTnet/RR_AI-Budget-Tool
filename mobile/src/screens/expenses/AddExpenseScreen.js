import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { G } from '../../constants/colors';
import { EXPENSE_CATS } from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { addExpenseApi } from '../../services/api';
import { CURRENCIES, currSym } from '../../constants/currencies';
import GoldButton from '../../components/ui/GoldButton';
import InputField from '../../components/ui/InputField';
import CategoryPicker from '../../components/ui/CategoryPicker';
import ErrorBanner from '../../components/ui/ErrorBanner';

function getTodayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function AddExpenseScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { refresh } = useData();

  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [category, setCategory] = useState('other');
  const [date, setDate] = useState(getTodayStr());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!label.trim()) {
      setError('Please enter a label for this expense.');
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
      await addExpenseApi(token, {
        label: label.trim(),
        amount: parsedAmount,
        currency,
        category,
        date,
        note: note.trim() || undefined,
      });
      await refresh();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e) {
      setError(e.message || 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [label, amount, category, date, note, token, refresh, navigation]);

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
          placeholder="e.g. Grocery run, Netflix..."
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
            itemStyle={{ color: G.text }}
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
          categories={EXPENSE_CATS}
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

        {/* Scan Receipt button */}
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate('ReceiptScanner')}
          activeOpacity={0.7}
        >
          <Feather name="camera" size={18} color={G.blue} style={styles.scanIcon} />
          <Text style={styles.scanText}>Scan Receipt</Text>
        </TouchableOpacity>

        <GoldButton
          title="Add Expense"
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
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: G.blue,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  scanIcon: {
    marginRight: 8,
  },
  scanText: {
    color: G.blue,
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 4,
  },
});
