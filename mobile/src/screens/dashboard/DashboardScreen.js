import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import { G, PIE_COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { EXPENSE_CATS } from '../../constants/categories';
import StatCard from '../../components/ui/StatCard';
import ProgressBar from '../../components/ui/ProgressBar';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Card from '../../components/ui/Card';

const { width: SCREEN_W } = Dimensions.get('window');

function formatCurrency(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0,
    }).format(amount ?? 0);
  } catch {
    const sym = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$' }[currency] || '$';
    return `${sym}${Number(amount ?? 0).toFixed(0)}`;
  }
}

function SavingsRateRing({ rate }) {
  const color = rate >= 20 ? G.green : rate >= 10 ? G.gold : G.red;
  const label = rate >= 20 ? 'Excellent' : rate >= 10 ? 'Good' : 'Improve';
  return (
    <View style={styles.rateRing}>
      <Text style={[styles.rateValue, { color }]}>{Number(rate).toFixed(1)}%</Text>
      <Text style={[styles.rateLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { summary, goals, isOffline, refresh, loading } = useData();
  const [refreshing, setRefreshing] = useState(false);

  const currency    = user?.currency || 'USD';
  const monthLabel  = format(new Date(), 'MMMM yyyy');
  const firstName   = user?.name?.split(' ')[0] || 'Friend';

  const totalIncome   = summary?.total_income    ?? 0;
  const totalExpenses = summary?.total_expenses  ?? 0;
  const netSavings    = summary?.net_savings     ?? 0;
  const savingsRate   = summary?.savings_rate    ?? 0;
  const expByCategory = summary?.expense_by_category ?? [];
  const topGoals      = goals.slice(0, 3);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const wealthScore = Math.min(100, Math.round(savingsRate * 1.8));

  return (
    <ScrollView
      style={[styles.flex, { paddingTop: insets.top }]}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={G.gold} colors={[G.gold]} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Good day, {firstName} 👋</Text>
          <Text style={styles.appName}>Rolling Revenue</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.monthBadge}>
            <Feather name="calendar" size={11} color={G.textSoft} style={{ marginRight: 5 }} />
            <Text style={styles.monthText}>{monthLabel}</Text>
          </View>
        </View>
      </View>

      {isOffline && <ErrorBanner message="Offline — showing cached data" />}

      {/* ── Hero card ─────────────────────────────────────────── */}
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroLabel}>Net Savings This Month</Text>
        <Text style={[styles.heroAmount, { color: netSavings >= 0 ? G.goldSoft : G.red }]}>
          {formatCurrency(netSavings, currency)}
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Feather name="arrow-up-circle" size={14} color={G.green} />
            <Text style={styles.heroStatValue}>{formatCurrency(totalIncome, currency)}</Text>
            <Text style={styles.heroStatLabel}>Income</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Feather name="arrow-down-circle" size={14} color={G.red} />
            <Text style={styles.heroStatValue}>{formatCurrency(totalExpenses, currency)}</Text>
            <Text style={styles.heroStatLabel}>Expenses</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Feather name="award" size={14} color={G.gold} />
            <Text style={styles.heroStatValue}>{wealthScore}/100</Text>
            <Text style={styles.heroStatLabel}>Score</Text>
          </View>
        </View>
      </View>

      {/* ── Savings rate card ─────────────────────────────────── */}
      <Card style={styles.rateCard}>
        <View style={styles.rateRow}>
          <View style={styles.rateFlex}>
            <Text style={styles.rateTitle}>Savings Rate</Text>
            <Text style={styles.rateHint}>
              {savingsRate >= 20 ? 'Excellent! Keep it up 🚀' : savingsRate >= 10 ? 'Good — aim for 20%+' : 'Try to cut spending'}
            </Text>
            <ProgressBar
              pct={Math.min(100, savingsRate)}
              color={savingsRate >= 20 ? G.green : savingsRate >= 10 ? G.gold : G.red}
              height={8}
              style={styles.rateBar}
            />
          </View>
          <SavingsRateRing rate={savingsRate} />
        </View>
      </Card>

      {/* ── Expense breakdown ─────────────────────────────────── */}
      {expByCategory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          <Card>
            {expByCategory.slice(0, 6).map((item, idx) => {
              const emoji    = EXPENSE_CATS[item.category] || '📦';
              const barColor = PIE_COLORS[idx % PIE_COLORS.length];
              const catLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);
              return (
                <View key={item.category} style={[styles.catRow, idx < expByCategory.slice(0,6).length - 1 && styles.catRowBorder]}>
                  <View style={styles.catLeft}>
                    <View style={[styles.catIconWrap, { backgroundColor: `${barColor}18` }]}>
                      <Text style={styles.catEmoji}>{emoji}</Text>
                    </View>
                    <View>
                      <Text style={styles.catName}>{catLabel}</Text>
                      <Text style={styles.catAmount}>{formatCurrency(item.total, currency)}</Text>
                    </View>
                  </View>
                  <View style={styles.catRight}>
                    <Text style={[styles.catPct, { color: barColor }]}>
                      {Number(item.pct).toFixed(1)}%
                    </Text>
                    <ProgressBar pct={item.pct} color={barColor} height={5} style={styles.catBar} />
                  </View>
                </View>
              );
            })}
          </Card>
        </View>
      )}

      {/* ── Goals ─────────────────────────────────────────────── */}
      {topGoals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals Progress</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {topGoals.map((goal) => {
            const p        = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;
            const isReached = p >= 100;
            const color    = goal.color || G.gold;
            return (
              <Card key={goal.id} style={styles.goalCard} accent={isReached ? G.green : color}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
                  {isReached ? (
                    <View style={styles.reachedBadge}>
                      <Text style={styles.reachedText}>✅ Done!</Text>
                    </View>
                  ) : (
                    <Text style={[styles.goalPctBadge, { color, backgroundColor: `${color}18` }]}>
                      {p.toFixed(0)}%
                    </Text>
                  )}
                </View>
                <View style={styles.goalAmounts}>
                  <Text style={[styles.goalSaved, { color }]}>{formatCurrency(goal.saved, currency)}</Text>
                  <Text style={styles.goalTarget}> / {formatCurrency(goal.target, currency)}</Text>
                </View>
                <ProgressBar pct={p} color={color} height={7} style={styles.goalBar} />
              </Card>
            );
          })}
        </View>
      )}

      {/* ── Empty state ────────────────────────────────────────── */}
      {!summary && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyText}>
            Add income and expenses to see your financial summary here.
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: G.bg,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerLeft: {},
  greeting: {
    fontSize: 14,
    color: G.textSoft,
    marginBottom: 2,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: G.gold,
    letterSpacing: 0.2,
  },
  headerRight: {
    marginTop: 4,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: G.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: G.border,
  },
  monthText: {
    color: G.textSoft,
    fontSize: 12,
    fontWeight: '600',
  },

  // Hero card
  heroCard: {
    backgroundColor: '#131706',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: G.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(201,168,76,0.07)',
  },
  heroLabel: {
    fontSize: 11,
    color: G.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 8,
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 12,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: G.text,
    marginTop: 3,
  },
  heroStatLabel: {
    fontSize: 10,
    color: G.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: G.border,
  },

  // Savings rate
  rateCard: {
    marginBottom: 20,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rateFlex: {
    flex: 1,
  },
  rateTitle: {
    fontSize: 14,
    color: G.text,
    fontWeight: '700',
    marginBottom: 3,
  },
  rateHint: {
    fontSize: 11,
    color: G.textSoft,
    marginBottom: 10,
  },
  rateBar: {},
  rateRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: G.surface,
    borderWidth: 1,
    borderColor: G.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  rateLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: G.text,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    color: G.gold,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Category rows
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  catRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: G.border,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: {
    fontSize: 18,
  },
  catName: {
    fontSize: 13,
    color: G.text,
    fontWeight: '600',
  },
  catAmount: {
    fontSize: 11,
    color: G.textSoft,
    marginTop: 1,
  },
  catRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  catPct: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  catBar: {
    width: 72,
  },

  // Goals
  goalCard: {
    marginBottom: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '600',
    color: G.text,
    flex: 1,
    marginRight: 8,
  },
  goalPctBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  reachedBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  reachedText: {
    fontSize: 11,
    color: G.green,
    fontWeight: '700',
  },
  goalAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  goalSaved: {
    fontSize: 18,
    fontWeight: '800',
  },
  goalTarget: {
    fontSize: 13,
    color: G.textSoft,
  },
  goalBar: {
    marginTop: 2,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: G.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: G.textSoft,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
