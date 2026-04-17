import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { G } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { deleteExpenseApi } from '../../services/api';
import { EXPENSE_CATS } from '../../constants/categories';

function formatCurrency(amount, currency = 'USD') {
  const sym = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$' }[currency] || '$';
  return `${sym}${Number(amount).toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (_) {
    return dateStr;
  }
}

export default function ExpensesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const { expenses, refresh } = useData();
  const [selectedCat, setSelectedCat] = useState('all');
  const [deleting, setDeleting] = useState(null);

  const currency = user?.currency || 'USD';

  const filtered = selectedCat === 'all'
    ? [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))
    : [...expenses]
        .filter((e) => e.category === selectedCat)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleDelete = useCallback((item) => {
    Alert.alert(
      'Delete Expense',
      `Delete "${item.label}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(item.id);
            try {
              await deleteExpenseApi(token, item.id);
              await refresh();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to delete expense.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  }, [token, refresh]);

  const renderItem = useCallback(({ item }) => {
    const emoji = EXPENSE_CATS[item.category] || '📦';
    const isDeleting = deleting === item.id;
    return (
      <View style={[styles.row, isDeleting && styles.rowDeleting]}>
        <View style={styles.rowLeft}>
          <Text style={styles.emoji}>{emoji}</Text>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel} numberOfLines={1}>{item.label}</Text>
            <View style={styles.rowMeta}>
              <Text style={styles.rowCat}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Text>
              <Text style={styles.rowDot}> · </Text>
              <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
            </View>
            {item.note ? (
              <Text style={styles.rowNote} numberOfLines={1}>{item.note}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.amount}>{formatCurrency(item.amount, currency)}</Text>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" size={15} color={G.muted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [currency, deleting, handleDelete]);

  const catKeys = ['all', ...Object.keys(EXPENSE_CATS)];

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <Text style={styles.count}>{expenses.length} total</Text>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        keyboardShouldPersistTaps="handled"
      >
        {catKeys.map((key) => {
          const isActive = selectedCat === key;
          const emoji = key === 'all' ? '✨' : EXPENSE_CATS[key];
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedCat(key)}
            >
              <Text style={styles.filterEmoji}>{emoji}</Text>
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                {key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyText}>
              Tap + to add your first expense
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: G.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: G.text,
  },
  count: {
    fontSize: 13,
    color: G.textSoft,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: G.border,
    backgroundColor: G.card,
    marginRight: 8,
  },
  filterChipActive: {
    borderColor: G.gold,
    backgroundColor: G.goldFade,
  },
  filterEmoji: {
    fontSize: 13,
    marginRight: 4,
  },
  filterLabel: {
    fontSize: 12,
    color: G.textSoft,
    fontWeight: '500',
  },
  filterLabelActive: {
    color: G.goldSoft,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: G.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: G.border,
    padding: 14,
    marginBottom: 10,
  },
  rowDeleting: {
    opacity: 0.5,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  rowInfo: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: G.text,
    marginBottom: 3,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowCat: {
    fontSize: 12,
    color: G.textSoft,
  },
  rowDot: {
    fontSize: 12,
    color: G.muted,
  },
  rowDate: {
    fontSize: 12,
    color: G.muted,
  },
  rowNote: {
    fontSize: 11,
    color: G.muted,
    marginTop: 3,
    fontStyle: 'italic',
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: G.red,
  },
  deleteBtn: {
    padding: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: G.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: G.textSoft,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: G.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: G.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
