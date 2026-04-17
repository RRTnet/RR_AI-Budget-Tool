import { useState, useEffect, useCallback } from "react";
import { G } from "./constants";
import { apiCall } from "./utils/api";
import Spinner from "./components/ui/Spinner";
import Sidebar from "./components/Sidebar";
import AuthScreen from "./views/AuthScreen";
import Dashboard from "./views/Dashboard";
import IncomeView from "./views/IncomeView";
import ExpensesView from "./views/ExpensesView";
import GoalsView from "./views/GoalsView";
import BudgetView from "./views/BudgetView";
import InsightsView from "./views/InsightsView";
import ExportView from "./views/ExportView";
import SummaryView from "./views/SummaryView";
import AdvisorView from "./views/AdvisorView";
import ReminderSettingsView from "./views/ReminderSettingsView";

// Placeholder history data (will be replaced with real API data in a future update)
const PLACEHOLDER_HISTORY = [
  { month: "Sep", savings: 2100, expenses: 2800, income: 9800 },
  { month: "Oct", savings: 2500, expenses: 2600, income: 10100 },
  { month: "Nov", savings: 3200, expenses: 2400, income: 9900 },
  { month: "Dec", savings: 2800, expenses: 3100, income: 10300 },
  { month: "Jan", savings: 3500, expenses: 2700, income: 10130 },
  { month: "Feb", savings: 4100, expenses: 2600, income: 10200 },
];

export default function WealthTracker() {
  const [token,    setToken]    = useState(() => localStorage.getItem("wt_token"));
  const [user,     setUser]     = useState(null);
  const [income,   setIncome]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [goals,    setGoals]    = useState([]);
  const [budgets,  setBudgets]  = useState([]);
  const [view,     setView]     = useState("dashboard");
  const [loading,  setLoading]  = useState(false);
  const [rates,    setRates]    = useState({});

  // ── Load all data when token changes ──────────────────────────────
  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [userData, incomeData, expenseData, goalData, budgetData] = await Promise.all([
        apiCall("/auth/me",   {}, token),
        apiCall("/income",    {}, token),
        apiCall("/expenses",  {}, token),
        apiCall("/goals",     {}, token),
        apiCall("/budgets",   {}, token),
      ]);
      setUser(userData);
      setIncome(incomeData);
      setExpenses(expenseData);
      setGoals(goalData);
      setBudgets(budgetData);
    } catch (err) {
      console.warn("Session expired:", err.message);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  // Fetch live exchange rates (free API, no key needed)
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(r => r.json())
      .then(d => { if (d.rates) setRates(d.rates); })
      .catch(() => {}); // silently fallback to 1:1 if offline
  }, []);

  const logout = () => {
    localStorage.removeItem("wt_token");
    setToken(null);
    setUser(null);
    setIncome([]);
    setExpenses([]);
    setGoals([]);
    setBudgets([]);
    setView("dashboard");
  };

  const onAuth = (t) => {
    localStorage.setItem("wt_token", t);
    setToken(t);
  };

  // ── Global styles ─────────────────────────────────────────────────
  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${G.bg}; }
    ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 3px; }
    input::placeholder { color: ${G.muted}; }
    textarea::placeholder { color: ${G.muted}; }
    input, select, textarea { color-scheme: dark; }
  `;

  // ── Not authenticated ─────────────────────────────────────────────
  if (!token) return <AuthScreen onAuth={onAuth} />;

  // ── Loading initial data ──────────────────────────────────────────
  if (loading && !user) {
    return (
      <div style={{
        minHeight: "100vh", background: G.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
        fontFamily: "'DM Sans',sans-serif",
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&display=swap');`}</style>
        <p style={{ color: G.gold, fontSize: 28, fontFamily: "'Playfair Display',serif" }}>💰 Rolling Revenue</p>
        <p style={{ color: G.textSoft, fontSize: 12, letterSpacing: "0.12em" }}>YOUR MONEY TOOL</p>
        <Spinner />
        <p style={{ color: G.textSoft, fontSize: 13 }}>Loading your financial data…</p>
      </div>
    );
  }

  const baseCcy = user?.currency || "USD";

  return (
    <div style={{ minHeight: "100vh", background: G.bg, fontFamily: "'DM Sans',sans-serif", display: "flex" }}>
      <style>{globalStyles}</style>

      <Sidebar
        view={view}
        setView={setView}
        user={user}
        income={income}
        expenses={expenses}
        rates={rates}
        onLogout={logout}
      />

      {/* Main content */}
      <div style={{ flex: 1, padding: 32, overflowY: "auto", maxHeight: "100vh" }}>
        {view === "dashboard" && (
          <Dashboard
            income={income} expenses={expenses} goals={goals}
            historyData={PLACEHOLDER_HISTORY} currency={baseCcy} rates={rates}
          />
        )}
        {view === "income" && (
          <IncomeView income={income} setIncome={setIncome} token={token} currency={baseCcy} rates={rates} />
        )}
        {view === "expenses" && (
          <ExpensesView
            expenses={expenses} setExpenses={setExpenses}
            token={token} currency={baseCcy} rates={rates} budgets={budgets}
          />
        )}
        {view === "goals" && (
          <GoalsView goals={goals} setGoals={setGoals} token={token} currency={user?.currency || "USD"} />
        )}
        {view === "budgets" && (
          <BudgetView
            expenses={expenses} token={token}
            currency={baseCcy} rates={rates}
            budgets={budgets} setBudgets={setBudgets}
          />
        )}
        {view === "insights" && (
          <InsightsView income={income} expenses={expenses} currency={baseCcy} rates={rates} />
        )}
        {view === "export" && (
          <ExportView income={income} expenses={expenses} goals={goals} currency={baseCcy} rates={rates} />
        )}
        {view === "summary" && (
          <SummaryView income={income} expenses={expenses} currency={baseCcy} rates={rates} />
        )}
        {view === "advisor" && (
          <AdvisorView token={token} income={income} expenses={expenses} currency={baseCcy} rates={rates} />
        )}
        {view === "reminders" && (
          <ReminderSettingsView user={user} token={token} onUpdate={setUser} />
        )}
      </div>
    </div>
  );
}
