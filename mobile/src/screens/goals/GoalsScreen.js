import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { G } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { updateGoalApi, deleteGoalApi } from '../../services/api';
import { currSym } from '../../constants/currencies';
import ProgressBar from '../../components/ui/ProgressBar';
import Card from '../../components/ui/Card';
import ErrorBanner from '../../components/ui/ErrorBanner';

function formatCurrency(amount, currency = 'USD') {
  const sym = currSym(currency);
  return `${sym}${Number(amount).toFixed(2)}`;
}

export default function GoalsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const { goals, refresh } = useData();
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Modal for adding savings (Android workaround for Alert.prompt)
  const [savingsModal, setSavingsModal] = useState({ visible: false, goal: null, amount: '' });

  const currency = user?.currency || 'USD';

  const handleAddSavings = useCallback((goal) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Add Savings',
        `How much are you adding to "${goal.name}"?`,
        async (inputValue) => {
          if (inputValue === null || inputValue === undefined) return;
          const addAmt = parseFloat(inputValue);
          if (isNaN(addAmt) || addAmt <= 0) {
            setError('Please enter a valid positive amount.');
            return;
          }
          try {
            const newSaved = (goal.saved || 0) + addAmt;
            await updateGoalApi(token, goal.id, { saved: newSaved });
            await refresh();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            setError(e.message || 'Failed to update goal.');
          }
        },
        'plain-text',
        '',
        'decimal-pad'
      );
    } else {
      setSavingsModal({ visible: true, goal, amount: '' });
    }
  }, [token, refresh]);

  const handleSavingsModalSave = useCallback(async () => {
    const { goal, amount } = savingsModal;
    const addAmt = parseFloat(amount);
    if (isNaN(addAmt) || addAmt <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    try {
      const newSaved = (goal.saved || 0) + addAmt;
      await updateGoalApi(token, goal.id, { saved: newSaved });
      await refresh();
      setSavingsModal({ visible: false, goal: null, amount: '' });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(e.message || 'Failed to update goal.');
      setSavingsModal({ visible: false, goal: null, amount: '' });
    }
  }, [savingsModal, token, refresh]);

  const handleDelete = useCallback((goal) => {
    Alert.alert(
      'Delete Goal',
      `Delete "${goal.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(goal.id);
            try {
              await deleteGoalApi(token, goal.id);
              await refresh();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              setError(e.message || 'Failed to delete goal.');
            } finally {
              setDeletingId(null);
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
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.subtitle}>{goals.length} goals</Text>
        </View>
        {goals.length > 0 && (
          <View style={styles.headerRight}>
            <Text style={styles.completedLabel}>
              {goals.filter((g) => g.target > 0 && (g.saved || 0) >= g.target).length} reached
            </Text>
          </View>
        )}
      </View>

      {error ? <ErrorBanner message={error} onDismiss={() => setError('')} /> : null}

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyEmoji}>🎯</Text>
            </View>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyText}>
              Tap + to set your first financial goal
            </Text>
          </View>
        ) : (
          goals.map((goal) => {
            const pct = goal.target > 0 ? Math.min(100, ((goal.saved || 0) / goal.target) * 100) : 0;
            const isReached = pct >= 100;
            const goalColor = goal.color || G.gold;
            const isDeleting = deletingId === goal.id;
            const remaining = Math.max(0, goal.target - (goal.saved || 0));

            return (
              <View key={goal.id} style={[styles.goalCard, isDeleting && styles.goalDeleting]}>
                {/* Colored top accent bar */}
                <View style={[styles.goalTopBar, { backgroundColor: goalColor }]} />

                <View style={styles.goalCardInner}>
                  {/* Goal header */}
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIconWrap, { backgroundColor: `${goalColor}18` }]}>
                      <Text style={styles.goalIcon}>🎯</Text>
                    </View>
                    <View style={styles.goalTitleWrap}>
                      <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
                      {isReached ? (
                        <View style={styles.reachedBadge}>
                          <Text style={styles.reachedText}>🏆 Goal Reached!</Text>
                        </View>
                      ) : (
                        <Text style={styles.goalRemaining}>
                          {formatCurrency(remaining, currency)} to go
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(goal)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.deleteBtn}
                    >
                      <Feather name="trash-2" size={15} color={G.muted} />
                    </TouchableOpacity>
                  </View>

                  {/* Progress bar + pct */}
                  <View style={styles.progressRow}>
                    <ProgressBar pct={pct} color={goalColor} height={8} style={styles.progressBar} />
                    <Text style={[styles.pctBadge, { color: goalColor }]}>{Math.round(pct)}%</Text>
                  </View>

                  {/* Amounts row */}
                  <View style={styles.amountsRow}>
                    <View style={styles.amountCol}>
                      <Text style={styles.amountLabel}>Saved</Text>
                      <Text style={[styles.amountValue, { color: goalColor }]}>
                        {formatCurrency(goal.saved || 0, currency)}
                      </Text>
                    </View>
                    <View style={styles.amountsDivider} />
                    <View style={styles.amountCol}>
                      <Text style={styles.amountLabel}>Target</Text>
                      <Text style={styles.amountValueNeutral}>
                        {formatCurrency(goal.target, currency)}
                      </Text>
                    </View>
                    <View style={styles.amountsDivider} />
                    <View style={styles.amountCol}>
                      <Text style={styles.amountLabel}>Remaining</Text>
                      <Text style={styles.amountValueMuted}>
                        {formatCurrency(remaining, currency)}
                      </Text>
                    </View>
                  </View>

                  {/* Add Savings button */}
                  {!isReached && (
                    <TouchableOpacity
                      style={[styles.addSavingsBtn, { borderColor: `${goalColor}40`, backgroundColor: `${goalColor}10` }]}
                      onPress={() => handleAddSavings(goal)}
                      activeOpacity={0.7}
                    >
                      <Feather name="plus-circle" size={15} color={goalColor} style={styles.addSavingsIcon} />
                      <Text style={[styles.addSavingsText, { color: goalColor }]}>Add Savings</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => navigation.navigate('AddGoal')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#000" />
      </TouchableOpacity>

      {/* Add Savings Modal (Android) */}
      <Modal
        visible={savingsModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setSavingsModal({ visible: false, goal: null, amount: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Savings</Text>
            {savingsModal.goal && (
              <Text style={styles.modalSubtitle}>
                Adding to: {savingsModal.goal.name}
              </Text>
            )}
            <View style={styles.modalInputRow}>
              <Text style={styles.modalPrefix}>
                {currSym(savingsModal.goal?.currency || currency)}
              </Text>
              <TextInput
                style={styles.modalInput}
                value={savingsModal.amount}
                onChangeText={(v) => setSavingsModal((s) => ({ ...s, amount: v }))}
                placeholder="0.00"
                placeholderTextColor={G.textSoft}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setSavingsModal({ visible: false, goal: null, amount: '' })}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleSavingsModalSave}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  completedLabel: {
    fontSize: 13,
    color: G.gold,
    fontWeight: '600',
  },
  container: {
    paddingHorizontal: 16,
  },
  goalCard: {
    backgroundColor: G.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: G.border,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  goalDeleting: {
    opacity: 0.4,
  },
  goalTopBar: {
    height: 3,
    width: '100%',
  },
  goalCardInner: {
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  goalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  goalIcon: {
    fontSize: 18,
  },
  goalTitleWrap: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '700',
    color: G.text,
    marginBottom: 3,
  },
  goalRemaining: {
    fontSize: 12,
    color: G.textSoft,
  },
  reachedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: G.goldFade,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: G.gold,
  },
  reachedText: {
    fontSize: 11,
    color: G.gold,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  progressBar: {
    flex: 1,
  },
  pctBadge: {
    fontSize: 12,
    fontWeight: '700',
    width: 38,
    textAlign: 'right',
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 10,
    color: G.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  amountValueNeutral: {
    fontSize: 15,
    fontWeight: '600',
    color: G.text,
  },
  amountValueMuted: {
    fontSize: 15,
    fontWeight: '600',
    color: G.textSoft,
  },
  amountsDivider: {
    width: 1,
    height: 30,
    backgroundColor: G.border,
    marginHorizontal: 12,
  },
  addSavingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
  },
  addSavingsIcon: {
    marginRight: 6,
  },
  addSavingsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalContent: {
    backgroundColor: G.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: G.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: G.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: G.textSoft,
    marginBottom: 16,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: G.card,
    borderWidth: 1,
    borderColor: G.gold,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  modalPrefix: {
    color: G.gold,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 14,
    color: G.text,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: G.border,
    alignItems: 'center',
  },
  modalCancelText: {
    color: G.textSoft,
    fontSize: 15,
    fontWeight: '600',
  },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: G.gold,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
});
