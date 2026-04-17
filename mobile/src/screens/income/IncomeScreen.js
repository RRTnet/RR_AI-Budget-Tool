import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { G } from '../../constants/colors';
import { INCOME_CATS } from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { deleteIncomeApi } from '../../services/api';

const CAT_COLORS = {
  salary:      '#22c55e',
  freelance:   '#3b82f6',
  investment:  '#a855f7',
  business:    '#f97316',
  rental:      '#06b6d4',
  gift:        '#ec4899',
  other:       '#94a3b8',
};

function getCatColor(cat) {
  return CAT_COLORS[cat] || G.green;
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

function IncomeRow({ item, currency, deleting, onDelete }) {
  const emoji = INCOME_CATS[item.category] || '💰';
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
        <View style={styles.rowTitleRow}>
          <Text style={styles.rowLabel} numberOfLines={1}>{item.label}</Text>
          {item.is_recurring && (
            <View style={styles.recurringBadge}>
              <Feather name="repeat" size={9} color={G.blue} style={{ marginRight: 3 }} />
              <Text style={styles.recurringText}>Recurring</Text>
            </View>
          )}
        </View>
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

export default function IncomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const { income, refresh } = useData();
  const [deleting, setDeleting] = useState(null);

  const currency = user?.currency || 'USD';
  const sorted = [...income].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const recurringCount = income.filter((i) => i.is_recurring).length;

  const handleDelete = useCallback((item) => {
    Alert.alert(
      'Delete Income',
      `Delete "${item.label}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(item.id);
            try {
              await deleteIncomeApi(token, item.id);
              await refresh();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to delete income.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  }, [token, refresh]);

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Income</Text>
          <Text style={styles.subtitle}>{income.length} entries</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalIncome, currency)}</Text>
          {recurringCount > 0 && (
            <View style={styles.recurringPill}>
              <Feather name="repeat" size={10} color={G.blue} style={{ marginRight: 3 }} />
              <Text style={styles.recurringPillText}>{recurringCount} recurring</Text>
            </View>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <IncomeRow
            item={item}
            currency={currency}
            deleting={deleting}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          sorted.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyEmoji}>💼</Text>
            </View>
            <Text style={styles.emptyTitle}>No income recorded yet</Text>
            <Text style={styles.emptyText}>Tap + to add your first income entry</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => navigation.navigate('AddIncome')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#000" />
      </TouchableOpacity>
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
    gap: 4,
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
    color: G.green,
  },
  recurringPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  recurringPillText: {
    fontSize: 10,
    color: G.blue,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 8,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },

  // Rows
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
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 6,
    flexWrap: 'wrap',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: G.text,
    flexShrink: 1,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  recurringText: {
    fontSize: 9,
    color: G.blue,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    color: G.green,
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
    shadowRadius: 10,
    elevation: 8,
  },
});
