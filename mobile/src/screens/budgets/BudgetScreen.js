import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { G, PIE_COLORS } from '../../constants/colors';
import { EXPENSE_CATS } from '../../constants/categories';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createBudgetApi, deleteBudgetApi } from '../../services/api';
import ProgressBar from '../../components/ui/ProgressBar';
import Card from '../../components/ui/Card';
import ErrorBanner from '../../components/ui/ErrorBanner';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD'];

function formatCurrency(amount, currency = 'USD') {
  const sym = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$', CAD: 'C$', SGD: 'S$' }[currency] || '$';
  return `${sym}${Number(amount).toFixed(0)}`;
}

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { expenses, budgets, setBudgets, refresh } = useData();
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [limitInput, setLimitInput] = useState('');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Calculate current month spending per category
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const spendByCat = {};
  expenses.forEach((e) => {
    const d = new Date(e.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      spendByCat[e.category] = (spendByCat[e.category] || 0) + e.amount;
    }
  });

  // Categories that already have a budget
  const budgetedCats = new Set(budgets.map((b) => b.category));

  // Open modal — if editing existing budget, pre-fill
  const openModal = useCallback((category = null) => {
    if (category) {
      const existing = budgets.find((b) => b.category === category);
      setSelectedCategory(category);
      setLimitInput(existing ? String(existing.monthly_limit) : '');
      setCurrency(existing?.currency || user?.currency || 'USD');
    } else {
      // Default to first unbudgeted category
      const first = Object.keys(EXPENSE_CATS).find((c) => !budgetedCats.has(c)) || 'other';
      setSelectedCategory(first);
      setLimitInput('');
      setCurrency(user?.currency || 'USD');
    }
    setError('');
    setModalVisible(true);
  }, [budgets, budgetedCats, user]);

  const handleSave = useCallback(async () => {
    const limit = parseFloat(limitInput);
    if (!limitInput || isNaN(limit) || limit <= 0) {
      setError('Enter a valid limit greater than 0.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await createBudgetApi(token, {
        category: selectedCategory,
        monthly_limit: limit,
        currency,
      });
      // Upsert in local state
      setBudgets((prev) => {
        const idx = prev.findIndex((b) => b.category === selectedCategory);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = result;
          return updated;
        }
        return [...prev, result];
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
    } catch (e) {
      setError(e.message || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  }, [limitInput, selectedCategory, currency, token, setBudgets]);

  const handleDelete = useCallback((budget) => {
    Alert.alert(
      'Remove Budget',
      `Remove the ${budget.category} budget limit?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudgetApi(token, budget.id);
              setBudgets((prev) => prev.filter((b) => b.id !== budget.id));
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to remove budget.');
            }
          },
        },
      ]
    );
  }, [token, setBudgets]);

  const totalBudgeted = budgets.reduce((s, b) => s + b.monthly_limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spendByCat[b.category] || 0), 0);
  const overCount = budgets.filter((b) => (spendByCat[b.category] || 0) > b.monthly_limit).length;

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Budgets</Text>
          <Text style={styles.headerSub}>Monthly spending limits</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => openModal()}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color={G.bg} />
          <Text style={styles.addBtnText}>Set Budget</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G.gold} colors={[G.gold]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary row */}
        {budgets.length > 0 && (
          <View style={styles.summaryRow}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Budgeted</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalBudgeted, user?.currency)}</Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={[styles.summaryValue, { color: totalSpent > totalBudgeted ? G.red : G.green }]}>
                {formatCurrency(totalSpent, user?.currency)}
              </Text>
            </Card>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Over limit</Text>
              <Text style={[styles.summaryValue, { color: overCount > 0 ? G.red : G.textSoft }]}>
                {overCount}
              </Text>
            </Card>
          </View>
        )}

        {/* Budget cards */}
        {budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💰</Text>
            <Text style={styles.emptyTitle}>No budgets set</Text>
            <Text style={styles.emptyText}>
              Set monthly spending limits per category to stay on track.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => openModal()} activeOpacity={0.8}>
              <Text style={styles.emptyBtnText}>Set your first budget</Text>
            </TouchableOpacity>
          </View>
        ) : (
          budgets.map((budget, idx) => {
            const spent = spendByCat[budget.category] || 0;
            const pct = Math.min(100, (spent / budget.monthly_limit) * 100);
            const isOver = spent > budget.monthly_limit;
            const isNear = !isOver && pct >= 80;
            const barColor = isOver ? G.red : isNear ? '#f97316' : PIE_COLORS[idx % PIE_COLORS.length];
            const emoji = EXPENSE_CATS[budget.category] || '📦';
            const label = budget.category.charAt(0).toUpperCase() + budget.category.slice(1);

            return (
              <Card key={budget.id} style={[styles.budgetCard, isOver && styles.budgetCardOver]}>
                <View style={styles.budgetTop}>
                  <View style={styles.budgetLeft}>
                    <Text style={styles.budgetEmoji}>{emoji}</Text>
                    <View>
                      <Text style={styles.budgetLabel}>{label}</Text>
                      {isOver && (
                        <Text style={styles.overText}>🚨 Over by {formatCurrency(spent - budget.monthly_limit, budget.currency)}</Text>
                      )}
                      {isNear && (
                        <Text style={styles.nearText}>⚠️ {pct.toFixed(0)}% used</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.budgetActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openModal(budget.category)}
                      activeOpacity={0.7}
                    >
                      <Feather name="edit-2" size={14} color={G.gold} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(budget)}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={14} color={G.red} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ProgressBar pct={pct} color={barColor} height={7} style={styles.bar} />

                <View style={styles.budgetAmounts}>
                  <Text style={[styles.spentAmount, { color: isOver ? G.red : G.text }]}>
                    {formatCurrency(spent, budget.currency)} spent
                  </Text>
                  <Text style={styles.limitAmount}>
                    of {formatCurrency(budget.monthly_limit, budget.currency)}
                  </Text>
                </View>
              </Card>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {budgetedCats.has(selectedCategory) ? 'Edit Budget' : 'Set Budget'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
              <Feather name="x" size={22} color={G.textSoft} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

            {/* Category picker */}
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {Object.entries(EXPENSE_CATS).map(([key, emoji]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.catChip, selectedCategory === key && styles.catChipActive]}
                  onPress={() => {
                    setSelectedCategory(key);
                    // Pre-fill if existing budget
                    const existing = budgets.find((b) => b.category === key);
                    if (existing) setLimitInput(String(existing.monthly_limit));
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.catChipEmoji}>{emoji}</Text>
                  <Text style={[styles.catChipText, selectedCategory === key && styles.catChipTextActive]}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Monthly limit */}
            <Text style={styles.fieldLabel}>Monthly limit</Text>
            <TextInput
              style={styles.input}
              value={limitInput}
              onChangeText={setLimitInput}
              placeholder="e.g. 500"
              placeholderTextColor={G.textSoft}
              keyboardType="decimal-pad"
            />

            {/* Currency */}
            <Text style={styles.fieldLabel}>Currency</Text>
            <View style={styles.currencyRow}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
                  onPress={() => setCurrency(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Budget'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: G.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: G.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: G.text },
  headerSub: { fontSize: 12, color: G.textSoft, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: G.gold,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: G.bg },
  container: { padding: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  summaryLabel: { fontSize: 10, color: G.textSoft, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: G.text },
  budgetCard: { marginBottom: 12 },
  budgetCardOver: { borderColor: 'rgba(239,68,68,0.4)' },
  budgetTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  budgetLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  budgetEmoji: { fontSize: 26 },
  budgetLabel: { fontSize: 15, fontWeight: '600', color: G.text },
  overText: { fontSize: 11, color: G.red, marginTop: 2, fontWeight: '600' },
  nearText: { fontSize: 11, color: '#f97316', marginTop: 2, fontWeight: '600' },
  budgetActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 6, borderRadius: 8, backgroundColor: G.goldFade, borderWidth: 1, borderColor: G.gold },
  deleteBtn: { padding: 6, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: G.red },
  bar: { marginBottom: 8 },
  budgetAmounts: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spentAmount: { fontSize: 14, fontWeight: '700' },
  limitAmount: { fontSize: 13, color: G.textSoft },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: G.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: G.textSoft, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 20 },
  emptyBtn: { backgroundColor: G.gold, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: G.bg },
  // Modal
  modalContainer: { flex: 1, backgroundColor: G.surface },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: G.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: G.text },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 12, color: G.textSoft, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },
  catScroll: { gap: 8, paddingBottom: 4 },
  catChip: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: G.border, backgroundColor: G.card, minWidth: 72 },
  catChipActive: { borderColor: G.gold, backgroundColor: G.goldFade },
  catChipEmoji: { fontSize: 20, marginBottom: 4 },
  catChipText: { fontSize: 11, color: G.textSoft, fontWeight: '500' },
  catChipTextActive: { color: G.gold },
  input: { backgroundColor: G.card, borderWidth: 1, borderColor: G.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: G.text, fontSize: 16 },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: G.border, backgroundColor: G.card },
  currencyChipActive: { borderColor: G.gold, backgroundColor: G.goldFade },
  currencyText: { fontSize: 13, color: G.textSoft, fontWeight: '600' },
  currencyTextActive: { color: G.gold },
  saveBtn: { backgroundColor: G.gold, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 28 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: G.bg },
});
