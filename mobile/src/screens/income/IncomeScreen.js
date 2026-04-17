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

export default function IncomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const { income, refresh } = useData();
  const [deleting, setDeleting] = useState(null);

  const currency = user?.currency || 'USD';

  const sorted = [...income].sort((a, b) => new Date(b.date) - new Date(a.date));

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

  const renderItem = useCallback(({ item }) => {
    const emoji = INCOME_CATS[item.category] || '💰';
    const isDeleting = deleting === item.id;
    return (
      <View style={[styles.row, isDeleting && styles.rowDeleting]}>
        <View style={styles.rowLeft}>
          <Text style={styles.emoji}>{emoji}</Text>
          <View style={styles.rowInfo}>
            <View style={styles.rowTitleRow}>
              <Text style={styles.rowLabel} numberOfLines={1}>{item.label}</Text>
              {item.is_recurring && (
                <View style={styles.recurringBadge}>
                  <Text style={styles.recurringText}>↻ Recurring</Text>
                </View>
              )}
            </View>
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

  const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Income</Text>
          <Text style={styles.total}>{formatCurrency(totalIncome, currency)} total</Text>
        </View>
        <Text style={styles.count}>{income.length} entries</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          sorted.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💼</Text>
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
  total: {
    fontSize: 13,
    color: G.green,
    fontWeight: '600',
    marginTop: 2,
  },
  count: {
    fontSize: 13,
    color: G.textSoft,
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
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 3,
    gap: 6,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: G.text,
  },
  recurringBadge: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: G.blue,
  },
  recurringText: {
    fontSize: 10,
    color: G.blue,
    fontWeight: '700',
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
    color: G.green,
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
