import { useState } from "react";
import { G, CURRENCIES, EXPENSE_CATS } from "../constants";
import { fmt, toBase, currSym } from "../utils/currency";
import { apiCall } from "../utils/api";
import { inputStyle } from "../utils/styles";
import Card from "../components/ui/Card";
import ErrorBanner from "../components/ui/ErrorBanner";

export default function ExpensesView({ expenses, setExpenses, token, currency, rates, budgets }) {
  const [form, setForm] = useState({
    label: "", amount: "", currency: currency || "USD",
    category: "food", date: "", note: "",
    is_recurring: false, recurrence_period: "monthly",
  });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter]     = useState("all");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const add = async () => {
    if (!form.label || !form.amount || !form.date) return;
    setLoading(true);
    setError("");
    try {
      const item = await apiCall("/expenses", {
        method: "POST",
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      }, token);
      setExpenses(p => [item, ...p]);
      setForm({ label: "", amount: "", currency: currency || "USD", category: "food", date: "", note: "", is_recurring: false, recurrence_period: "monthly" });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await apiCall(`/expenses/${id}`, { method: "DELETE" }, token);
      setExpenses(p => p.filter(e => e.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const isMixed = expenses.some(e => e.currency && e.currency !== currency);
  const total   = expenses.reduce((s, e) => s + toBase(e.amount, e.currency || currency, currency, rates), 0);
  const visible = filter === "all" ? expenses : expenses.filter(e => e.category === filter);

  const spendByCat = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + toBase(e.amount, e.currency || currency, currency, rates);
    return acc;
  }, {});

  const budgetAlerts = (budgets || []).filter(b => {
    const spent = spendByCat[b.category] || 0;
    const limit = toBase(b.monthly_limit, b.currency, currency, rates);
    return spent >= limit * 0.8;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: G.text, margin: 0, fontSize: 20, fontFamily: "'Playfair Display',serif" }}>Expenses</h2>
          <p style={{ color: G.textSoft, fontSize: 13, margin: "4px 0 0" }}>
            Total: <span style={{ color: G.red, fontWeight: 700 }}>{isMixed ? "~" : ""}{fmt(total, currency)}</span>
          </p>
        </div>
        <button onClick={() => setShowForm(p => !p)} style={{
          background: "#ef444420", color: G.red,
          border: "1px solid #ef444440", borderRadius: 10,
          padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14,
        }}>+ Add Expense</button>
      </div>

      <ErrorBanner msg={error} onDismiss={() => setError("")} />

      {/* Budget alerts */}
      {budgetAlerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {budgetAlerts.map(b => {
            const spent   = spendByCat[b.category] || 0;
            const limit   = toBase(b.monthly_limit, b.currency, currency, rates);
            const pctUsed = Math.round((spent / limit) * 100);
            const over    = spent >= limit;
            return (
              <div key={b.id} style={{
                background: over ? "#ef444415" : "#f9731615",
                border: `1px solid ${over ? "#ef444440" : "#f9731640"}`,
                borderRadius: 10, padding: "10px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 18 }}>{over ? "🚨" : "⚠️"}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: over ? G.red : "#f97316", fontSize: 13, fontWeight: 600, margin: 0 }}>
                    {over ? "Over budget" : "Near budget limit"}: {EXPENSE_CATS[b.category] || ""} {b.category}
                  </p>
                  <p style={{ color: G.textSoft, fontSize: 11, margin: "2px 0 0" }}>
                    {fmt(spent, currency)} spent of {fmt(limit, currency)} limit ({pctUsed}%)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["all", ...Object.keys(EXPENSE_CATS)].map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: "6px 14px", borderRadius: 20,
            border: `1px solid ${filter === c ? G.gold : G.border}`,
            background: filter === c ? G.goldFade : "transparent",
            color: filter === c ? G.gold : G.textSoft,
            cursor: "pointer", fontSize: 12, fontWeight: filter === c ? 600 : 400,
          }}>
            {c === "all" ? "All" : EXPENSE_CATS[c] + " " + c}
          </button>
        ))}
      </div>

      {showForm && (
        <Card style={{ borderColor: "#ef444440" }}>
          <h3 style={{ color: G.red, margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>New Expense</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input type="text" placeholder="Description" value={form.label}
              onChange={e => set("label", e.target.value)} style={inputStyle} />

            <div style={{ display: "flex", gap: 8 }}>
              <select value={form.currency} onChange={e => set("currency", e.target.value)}
                style={{ ...inputStyle, width: 110, flexShrink: 0 }}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: G.gold, fontSize: 13, fontWeight: 700, pointerEvents: "none",
                }}>
                  {currSym(form.currency)}
                </span>
                <input type="number" placeholder="0.00" value={form.amount}
                  onChange={e => set("amount", e.target.value)}
                  style={{ ...inputStyle, paddingLeft: currSym(form.currency).length > 2 ? 46 : 30, width: "100%" }} />
              </div>
            </div>

            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inputStyle} />

            <select value={form.category} onChange={e => set("category", e.target.value)} style={inputStyle}>
              {Object.entries(EXPENSE_CATS).map(([k, v]) => (
                <option key={k} value={k}>{v} {k.charAt(0).toUpperCase() + k.slice(1)}</option>
              ))}
            </select>

            <input type="text" placeholder="Note (optional)" value={form.note}
              onChange={e => set("note", e.target.value)}
              style={{ ...inputStyle, gridColumn: "1/-1" }} />

            {/* Recurring toggle */}
            <div style={{
              gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 12,
              background: G.surface, borderRadius: 10, padding: "12px 14px",
              border: `1px solid ${form.is_recurring ? "#ef444440" : G.border}`,
            }}>
              <button type="button" onClick={() => set("is_recurring", !form.is_recurring)} style={{
                width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                background: form.is_recurring ? G.red : G.muted, position: "relative", flexShrink: 0,
              }}>
                <span style={{
                  position: "absolute", top: 2, left: form.is_recurring ? 20 : 2,
                  width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
                }} />
              </button>
              <div style={{ flex: 1 }}>
                <p style={{ color: form.is_recurring ? G.red : G.textSoft, fontSize: 13, fontWeight: 600, margin: 0 }}>
                  🔄 Recurring Expense
                </p>
                <p style={{ color: G.muted, fontSize: 11, margin: "2px 0 0" }}>Auto-remind to log this each period</p>
              </div>
              {form.is_recurring && (
                <select value={form.recurrence_period} onChange={e => set("recurrence_period", e.target.value)}
                  style={{ ...inputStyle, width: 120 }}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={add} disabled={loading} style={{
              background: G.red, color: "#fff", border: "none",
              borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer",
            }}>{loading ? "Saving…" : "Save"}</button>
            <button onClick={() => setShowForm(false)} style={{
              background: "transparent", color: G.textSoft,
              border: `1px solid ${G.border}`, borderRadius: 8, padding: "10px 24px", cursor: "pointer",
            }}>Cancel</button>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.length === 0 && (
          <p style={{ color: G.muted, fontSize: 13, textAlign: "center", padding: 40 }}>
            {filter === "all" ? 'No expenses yet. Click "+ Add Expense" to get started.' : `No ${filter} expenses found.`}
          </p>
        )}
        {visible.map(e => {
          const budget  = (budgets || []).find(b => b.category === e.category);
          const spent   = spendByCat[e.category] || 0;
          const limit   = budget ? toBase(budget.monthly_limit, budget.currency, currency, rates) : null;
          const isOver  = limit && spent >= limit;
          return (
            <div key={e.id} style={{
              background: G.card, border: `1px solid ${isOver ? "#ef444430" : G.border}`,
              borderRadius: 12, padding: "14px 20px",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <span style={{ fontSize: 24 }}>{EXPENSE_CATS[e.category] || "📦"}</span>
              <div style={{ flex: 1 }}>
                <p style={{ color: G.text, margin: 0, fontWeight: 600, fontSize: 14 }}>{e.label}</p>
                <p style={{ color: G.textSoft, margin: "2px 0 0", fontSize: 12 }}>
                  {e.category} · {e.date}
                  {e.note && <span> · {e.note}</span>}
                  {e.is_recurring && (
                    <span style={{
                      marginLeft: 6, background: "#ef444420", color: G.red,
                      fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 600,
                    }}>
                      🔄 {e.recurrence_period || "recurring"}
                    </span>
                  )}
                </p>
              </div>
              <span style={{ color: G.red, fontWeight: 700, fontSize: 16 }}>
                {fmt(e.amount, e.currency || currency)}
              </span>
              <button onClick={() => remove(e.id)} style={{
                background: "transparent", border: "none", color: G.muted,
                cursor: "pointer", fontSize: 16, padding: "4px 8px",
              }}>✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
