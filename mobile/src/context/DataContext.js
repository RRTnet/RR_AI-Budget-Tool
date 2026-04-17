import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from './AuthContext';
import {
  getIncomeApi,
  getExpensesApi,
  getGoalsApi,
  getSummaryApi,
  getBudgetsApi,
} from '../services/api';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { token } = useAuth();
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [inc, exp, gls, summ, bdg] = await Promise.all([
        getIncomeApi(token),
        getExpensesApi(token),
        getGoalsApi(token),
        getSummaryApi(token, month, year),
        getBudgetsApi(token),
      ]);

      setIncome(Array.isArray(inc) ? inc : []);
      setExpenses(Array.isArray(exp) ? exp : []);
      setGoals(Array.isArray(gls) ? gls : []);
      setSummary(summ);
      setBudgets(Array.isArray(bdg) ? bdg : []);
    } catch (e) {
      if (!e.message?.includes('Network error')) {
        console.error('DataContext refresh error:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refresh();
    } else {
      setIncome([]);
      setExpenses([]);
      setGoals([]);
      setBudgets([]);
      setSummary(null);
    }
  }, [token, refresh]);

  const value = {
    income,
    expenses,
    goals,
    budgets,
    summary,
    isOffline,
    loading,
    refresh,
    setIncome,
    setExpenses,
    setGoals,
    setBudgets,
    setSummary,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export default DataContext;
