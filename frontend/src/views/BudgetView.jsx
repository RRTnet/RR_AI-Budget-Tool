import { useState } from "react";
import { G, CURRENCIES, EXPENSE_CATS } from "../constants";
import { fmt, toBase, currSym } from "../utils/currency";
import { apiCall } from "../utils/api";
import { inputStyle } from "../utils/styles";
import Card from "../components/ui/Card";
import ErrorBanner from "../components/ui/ErrorBanner";

export default function BudgetView({ expenses, token, currency, rates, budgets, setBudgets }) {
  const baseCcy = currency;
  const [form, setForm] = useState({ category: "food", monthly_limit: "", currency: baseCcy });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const spendByCat = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + toBase(e.amount, e.currency || baseCcy, baseCcy, rates);
    return acc;
  }, {});

  const save = async () => {
    if (!form.monthly_limit) return;
    setLoading(true); setError("");
    try {
      const item = await apiCall("/budgets", {
        method: "POST",
        body: JSON.stringify({ ...form, monthly_limit: parseFloat(form.monthly_limit) }),
      }, token);
      setBudgets(p => {
        const existing = p.find(b => b.category === item.category);
        return existing ? p.map(b => b.category === item.category ? item : b) : [item, ...p];
      });
      setForm(p => ({ ...p, monthly_limit: "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await apiCall(`/budgets/${id}`, { method: "DELETE" }, token);
      setBudgets(p => p.filter(b => b.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 700 }}>
      <div>
        <h2 style={{ color: G.text, margin: 0, fontSize: 20, fontFamily: "'Playfair Display',serif" }}>💰 Budget Limits</h2>
        <p style={{ color: G.textSoft, fontSize: 13, margin: "4px 0 0" }}>
          Set monthly spending limits per category — get warned when you're close
        </p>
      </div>

      <ErrorBanner msg={error} onDismiss={() => setError("")} />

      {/* Add budget form */}
      <Card style={{ borderColor: G.gold + "40" }}>
        <p style={{ color: G.gold, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Set a Budget Limit</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 6 }}>Category</p>
            <select value={form.category} onChange={e => set("category", e.target.value)} style={inputStyle}>
              {Object.entries(EXPENSE_CATS).map(([k, v]) => (
                <option key={k} value={k}>{v} {k}</option>
              ))}
            </select>
          </div>
          <div>
            <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 6 }}>Currency</p>
            <select value={form.currency} onChange={e => set("currency", e.target.value)} style={inputStyle}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
          </div>
          <div>
            <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 6 }}>Monthly Limit</p>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                color: G.gold, fontSize: 13, fontWeight: 700,
              }}>
                {currSym(form.currency)}
              </span>
              <input type="number" placeholder="0.00" value={form.monthly_limit}
                onChange={e => set("monthly_limit", e.target.value)}
                style={{ ...inputStyle, paddingLeft: currSym(form.currency).length > 2 ? 42 : 26 }} />
            </div>
          </div>
          <button onClick={save} disabled={loading} style={{
            background: G.gold, color: "#000", border: "none", borderRadius: 8,
            padding: "10px 20px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}>{loading ? "Saving…" : "Set Limit"}</button>
        </div>
      </Card>

      {/* Budget list */}
      {budgets.length === 0 ? (
        <p style={{ color: G.muted, fontSize: 13, textAlign: "center", padding: 40 }}>
          No budgets set yet. Add your first budget limit above.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {budgets.map(b => {
            const spent    = spendByCat[b.category] || 0;
            const limit    = toBase(b.monthly_limit, b.currency, baseCcy, rates);
            const usedPct  = Math.min(100, Math.round((spent / limit) * 100));
            const over     = spent >= limit;
            const warn     = !over && usedPct >= 80;
            const barColor = over ? G.red : warn ? "#f97316" : G.green;
            return (
              <Card key={b.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{EXPENSE_CATS[b.category] || "📦"}</span>
                    <div>
                      <p style={{ color: G.text, fontWeight: 600, fontSize: 14, margin: 0 }}>
                        {b.category.charAt(0).toUpperCase() + b.category.slice(1)}
                        {over && <span style={{ marginLeft: 8, color: G.red,     fontSize: 11 }}>🚨 Over limit!</span>}
                        {warn && <span style={{ marginLeft: 8, color: "#f97316", fontSize: 11 }}>⚠️ Near limit</span>}
                      </p>
                      <p style={{ color: G.textSoft, fontSize: 12, margin: "2px 0 0" }}>
                        {fmt(spent, baseCcy)} spent of {fmt(limit, baseCcy)} limit
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: barColor, fontWeight: 700, fontSize: 16 }}>{usedPct}%</span>
                    <button onClick={() => remove(b.id)} style={{
                      background: "transparent", border: "none", color: G.muted, cursor: "pointer", fontSize: 14,
                    }}>✕</button>
                  </div>
                </div>
                <div style={{ height: 8, background: G.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${usedPct}%`, borderRadius: 4,
                    background: barColor, transition: "width 0.4s ease",
                  }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
