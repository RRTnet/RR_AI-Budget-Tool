import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { G, CURRENCIES, INCOME_CATS } from "../constants";
import { fmt, toBase, currSym } from "../utils/currency";
import { apiCall } from "../utils/api";
import { inputStyle } from "../utils/styles";
import Card from "../components/ui/Card";
import ErrorBanner from "../components/ui/ErrorBanner";
import CustomTooltip from "../components/ui/CustomTooltip";

export default function IncomeView({ income, setIncome, token, currency, rates }) {
  const [form, setForm] = useState({
    label: "", amount: "", currency: currency || "USD",
    category: "salary", date: "", note: "",
    is_recurring: false, recurrence_period: "monthly",
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const add = async () => {
    if (!form.label || !form.amount || !form.date) return;
    setLoading(true);
    setError("");
    try {
      const item = await apiCall("/income", {
        method: "POST",
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      }, token);
      setIncome(p => [item, ...p]);
      setForm({ label: "", amount: "", currency: currency || "USD", category: "salary", date: "", note: "", is_recurring: false, recurrence_period: "monthly" });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await apiCall(`/income/${id}`, { method: "DELETE" }, token);
      setIncome(p => p.filter(i => i.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const isMixed = income.some(i => i.currency && i.currency !== currency);
  const total   = income.reduce((s, i) => s + toBase(i.amount, i.currency || currency, currency, rates), 0);

  const barData = Object.entries(
    income.reduce((a, i) => { a[i.category] = (a[i.category] || 0) + i.amount; return a; }, {})
  ).map(([k, v]) => ({ name: k, amount: v }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: G.text, margin: 0, fontSize: 20, fontFamily: "'Playfair Display',serif" }}>Income Streams</h2>
          <p style={{ color: G.textSoft, fontSize: 13, margin: "4px 0 0" }}>
            Total this month: <span style={{ color: G.green, fontWeight: 700 }}>{isMixed ? "~" : ""}{fmt(total, currency)}</span>
          </p>
        </div>
        <button onClick={() => setShowForm(p => !p)} style={{
          background: G.gold, color: "#000", border: "none",
          borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14,
        }}>+ Add Income</button>
      </div>

      <ErrorBanner msg={error} onDismiss={() => setError("")} />

      {showForm && (
        <Card style={{ borderColor: G.gold + "40" }}>
          <h3 style={{ color: G.gold, margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>New Income Entry</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input type="text" placeholder="Description (e.g. Salary)" value={form.label}
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
              {Object.entries(INCOME_CATS).map(([k, v]) => (
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
              border: `1px solid ${form.is_recurring ? G.gold + "50" : G.border}`,
            }}>
              <button type="button" onClick={() => set("is_recurring", !form.is_recurring)} style={{
                width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                background: form.is_recurring ? G.gold : G.muted, position: "relative", flexShrink: 0,
              }}>
                <span style={{
                  position: "absolute", top: 2, left: form.is_recurring ? 20 : 2,
                  width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s",
                }} />
              </button>
              <div style={{ flex: 1 }}>
                <p style={{ color: form.is_recurring ? G.gold : G.textSoft, fontSize: 13, fontWeight: 600, margin: 0 }}>
                  🔄 Recurring Income
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
              background: G.gold, color: "#000", border: "none",
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
        {income.length === 0 && (
          <p style={{ color: G.muted, fontSize: 13, textAlign: "center", padding: 40 }}>
            No income entries yet. Click "+ Add Income" to get started.
          </p>
        )}
        {income.map(i => (
          <div key={i.id} style={{
            background: G.card, border: `1px solid ${G.border}`,
            borderRadius: 12, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 24 }}>{INCOME_CATS[i.category] || "💰"}</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: G.text, margin: 0, fontWeight: 600, fontSize: 14 }}>{i.label}</p>
              <p style={{ color: G.textSoft, margin: "2px 0 0", fontSize: 12 }}>
                {i.category} · {i.date}
                {i.note && <span> · {i.note}</span>}
                {i.is_recurring && (
                  <span style={{
                    marginLeft: 6, background: G.goldFade, color: G.gold,
                    fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 600,
                  }}>
                    🔄 {i.recurrence_period || "recurring"}
                  </span>
                )}
              </p>
            </div>
            <span style={{ color: G.green, fontWeight: 700, fontSize: 16 }}>
              {fmt(i.amount, i.currency || currency)}
            </span>
            <button onClick={() => remove(i.id)} style={{
              background: "transparent", border: "none", color: G.muted,
              cursor: "pointer", fontSize: 16, padding: "4px 8px",
            }}>✕</button>
          </div>
        ))}
      </div>

      {barData.length > 0 && (
        <Card>
          <h3 style={{ color: G.text, margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>Income by Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
              <XAxis dataKey="name" stroke={G.muted} fontSize={11} />
              <YAxis stroke={G.muted} fontSize={11} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="Amount" fill={G.green} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
