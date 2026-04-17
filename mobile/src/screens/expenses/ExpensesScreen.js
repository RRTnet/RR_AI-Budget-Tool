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

const CAT_COLORS = {
  food:          '#f97316',
  transport:     '#3b82f6',
  housing:       '#a855f7',
  health:        '#22c55e',
  entertainment: '#ec4899',
  shopping:      '#f59e0b',
  utilities:     '#06b6d4',
  education:     '#84cc16',
  other:         '#94a3b8',
};

function getCatColor(cat) {
  return CAT_COLORS[cat] || G.gold;
}

function formatCurrency(amount, currency = 'USD') {
  const sym = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$' }[currency] || '$';
  return `${sym}${Number(amount).toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (_) {
    return dateStr;
  }
}

function ExpenseRow({ item, currency, deleting, onDelete }) {
  const emoji = EXPENSE_CATS[item.category] || '📦';
  const isDeleting = deleting === item.id;
  const accentColor = getCatColor(item.category);
  const catLabel = item.category
    ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
    : 'Other';

  return (
    <View style={[styles.row, isDeleting && styles.rowDeleting]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Emoji badge */}
      <View style={[styles.emojiBadge, { backgroundColor: `${accentColor}18` }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel} numberOfLines={1}>{item.label}</Text>
        <View style={styles.rowMeta}>
          <View style={[styles.catChip, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}30` }]}>
            <Text style={[styles.catChipText, { color: accentColor }]}>{catLabel}</Text>
          </View>
          <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
        </View>
        {item.note ? (
          <Text style={styles.rowNote} numberOfLines={1}>{item.note}</Text>
        ) : null}
      </View>

      {/* Right: amount + delete */}
      <View style={styles.rowRight}>
        <Text style={styles.amount}>{formatCurrency(item.amount, currency)}</Text>
        <TouchableOpacity
          onPress={() => onDelete(item)}
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="trash-2" size={14} color={G.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
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

  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

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

  const catKeys = ['all', ...Object.keys(EXPENSE_CATS)];

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Expenses</Text>
          <Text style={styles.subtitle}>{expenses.length} transactions</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalLabel}>
            {selectedCat === 'all' ? 'Total' : 'Filtered'}
          </Text>
          <Text style={styles.totalValue}>
            {formatCurrency(totalFiltered, currency)}
          </Text>
        </View>
      </View>

      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        keyboardShouldPersistTaps="handled"
      >
        {catKeys.map((key) => {
          const isActive = selectedCat === key;
          const emoji = key === 'all' ? '✨' : EXPENSE_CATS[key];
          const catColor = key === 'all' ? G.gold : getCatColor(key);
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                isActive && {
                  borderColor: catColor,
                  backgroundColor: `${catColor}18`,
                },
              ]}
              onPress={() => setSelectedCat(key)}
              activeOpacity={0.75}
            >
              <Text style={styles.filterEmoji}>{emoji}</Text>
              <Text style={[
                styles.filterLabel,
                isActive && { color: catColor, fontWeight: '700' },
              ]}>
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
        renderItem={({ item }) => (
          <ExpenseRow
            item={item}
            currency={currency}
            deleting={deleting}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyEmoji}>💸</Text>
            </View>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyText}>Tap + to add your first expense</Text>
          </View>
        }
      />

      {/* FAB */}
      <View style={[styles.fabRow, { bottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.fabSecondary}
          onPress={() => navigation.navigate('ReceiptScanner')}
          activeOpacity={0.85}
        >
          <Feather name="camera" size={20} color={G.textSoft} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddExpense')}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: G.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: G.text,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: G.textSoft,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 11,
    color: G.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: G.red,
  },

  // Filter chips
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: G.border,
    backgroundColor: G.card,
    marginRight: 2,
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

  // Expense rows
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 8,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: G.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: G.border,
    overflow: 'hidden',
    paddingVertical: 12,
    paddingRight: 14,
  },
  rowDeleting: {
    opacity: 0.4,
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    marginRight: 12,
  },
  emojiBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 20,
  },
  rowInfo: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: G.text,
    marginBottom: 5,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  catChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  rowDate: {
    fontSize: 12,
    color: G.muted,
  },
  rowNote: {
    fontSize: 11,
    color: G.muted,
    marginTop: 4,
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

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: G.card,
    borderWidth: 1,
    borderColor: G.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 34,
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

  // FAB
  fabRow: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fabSecondary: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: G.surface,
    borderWidth: 1,
    borderColor: G.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: G.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: G.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
