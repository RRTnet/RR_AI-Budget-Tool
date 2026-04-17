import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { G } from '../constants/colors';

import DashboardScreen      from '../screens/dashboard/DashboardScreen';
import ExpensesScreen       from '../screens/expenses/ExpensesScreen';
import AddExpenseScreen     from '../screens/expenses/AddExpenseScreen';
import ReceiptScannerScreen from '../screens/expenses/ReceiptScannerScreen';
import IncomeScreen         from '../screens/income/IncomeScreen';
import AddIncomeScreen      from '../screens/income/AddIncomeScreen';
import GoalsScreen          from '../screens/goals/GoalsScreen';
import AddGoalScreen        from '../screens/goals/AddGoalScreen';
import AdvisorScreen        from '../screens/advisor/AdvisorScreen';
import BudgetScreen         from '../screens/budgets/BudgetScreen';
import SettingsScreen       from '../screens/settings/SettingsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: G.surface,
    borderBottomColor: G.border,
    borderBottomWidth: 1,
  },
  headerTintColor: G.gold,
  headerTitleStyle: { color: G.text, fontWeight: '700', fontSize: 16 },
  contentStyle: { backgroundColor: G.bg },
  headerShadowVisible: false,
};

const modalOptions = {
  presentation: 'modal',
  headerStyle: { backgroundColor: G.surface },
  headerTintColor: G.gold,
  headerTitleStyle: { color: G.text, fontWeight: '700' },
  headerShadowVisible: false,
};

function DashboardStack()  {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ExpensesStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ExpensesMain"   component={ExpensesScreen}       options={{ headerShown: false }} />
      <Stack.Screen name="AddExpense"     component={AddExpenseScreen}     options={{ title: 'Add Expense',   ...modalOptions }} />
      <Stack.Screen name="ReceiptScanner" component={ReceiptScannerScreen} options={{ title: 'Scan Receipt',  ...modalOptions }} />
    </Stack.Navigator>
  );
}

function IncomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="IncomeMain" component={IncomeScreen}    options={{ headerShown: false }} />
      <Stack.Screen name="AddIncome"  component={AddIncomeScreen} options={{ title: 'Add Income', ...modalOptions }} />
    </Stack.Navigator>
  );
}

function GoalsStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="GoalsMain" component={GoalsScreen}    options={{ headerShown: false }} />
      <Stack.Screen name="AddGoal"   component={AddGoalScreen}  options={{ title: 'Add Goal',  ...modalOptions }} />
    </Stack.Navigator>
  );
}

function AdvisorStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="AdvisorMain" component={AdvisorScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function BudgetStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="BudgetMain" component={BudgetScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

const ICON_MAP = {
  Dashboard: 'home',
  Expenses:  'credit-card',
  Income:    'trending-up',
  Goals:     'target',
  Budgets:   'bar-chart-2',
  Advisor:   'cpu',
  Settings:  'settings',
};

function TabIcon({ name, color, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Feather name={name} size={20} color={color} />
      {focused && <View style={[styles.dot, { backgroundColor: G.gold }]} />}
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor:   G.gold,
        tabBarInactiveTintColor: G.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused }) => (
          <TabIcon name={ICON_MAP[route.name] || 'circle'} color={color} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Expenses"  component={ExpensesStack} />
      <Tab.Screen name="Income"    component={IncomeStack} />
      <Tab.Screen name="Goals"     component={GoalsStack} />
      <Tab.Screen name="Budgets"   component={BudgetStack} />
      <Tab.Screen name="Advisor"   component={AdvisorStack} />
      <Tab.Screen name="Settings"  component={SettingsStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: G.surface,
    borderTopColor: G.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 68,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 32,
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: G.goldFade,
  },
  dot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
