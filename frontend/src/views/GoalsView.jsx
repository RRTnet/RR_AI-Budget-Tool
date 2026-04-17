import { useState } from "react";
import { G, CURRENCIES } from "../constants";
import { fmt, pct, currSym } from "../utils/currency";
import { apiCall } from "../utils/api";
import { inputStyle } from "../utils/styles";
import Card from "../components/ui/Card";
import ErrorBanner from "../components/ui/ErrorBanner";

const GOAL_COLORS = ["#c9a84c", "#3b82f6", "#22c55e", "#a855f7", "#ef4444", "#f97316"];

export default function GoalsView({ goals, setGoals, token, currency }) {
  const [form, setForm] = useState({
    name: "", target: "", saved: "0",
    color: "#c9a84c", currency: currency || "USD",
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const add = async () => {
    if (!form.name || !form.target) return;
    setLoading(true);
    setError("");
    try {
      const goal = await apiCall("/goals", {
        method: "POST",
        body: JSON.stringify({ ...form, target: parseFloat(form.target), saved: parseFloat(form.saved || 0) }),
      }, token);
      setGoals(p => [...p, goal]);
      setForm({ name: "", target: "", saved: "0", color: "#c9a84c", currency: currency || "USD" });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addSavings = async (goal) => {
    const amount = prompt(`Add to "${goal.name}"? Enter amount:`);
    if (!amount || isNaN(parseFloat(amount))) return;
    try {
      const updated = await apiCall(`/goals/${goal.id}`, {
        method: "PATCH",
        body: JSON.stringify({ saved: goal.saved + parseFloat(amount) }),
      }, token);
      setGoals(p => p.map(g => g.id === goal.id ? updated : g));
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await apiCall(`/goals/${id}`, { method: "DELETE" }, token);
      setGoals(p => p.filter(g => g.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: G.text, margin: 0, fontSize: 20, fontFamily: "'Playfair Display',serif" }}>Wealth Goals</h2>
          <p style={{ color: G.textSoft, fontSize: 13, margin: "4px 0 0" }}>Track your path to financial independence</p>
        </div>
        <button onClick={() => setShowForm(p => !p)} style={{
          background: G.goldFade, color: G.gold,
          border: `1px solid ${G.gold}40`, borderRadius: 10,
          padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14,
        }}>+ Add Goal</button>
      </div>

      <ErrorBanner msg={error} onDismiss={() => setError("")} />

      {showForm && (
        <Card style={{ borderColor: G.gold + "40" }}>
          <h3 style={{ color: G.gold, margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>New Wealth Goal</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input type="text" placeholder="Goal name (e.g. Emergency Fund)" value={form.name}
              onChange={e => set("name", e.target.value)}
              style={{ ...inputStyle, gridColumn: "1/-1" }} />

            <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: G.textSoft, fontSize: 12, whiteSpace: "nowrap" }}>Currency:</span>
              <select value={form.currency} onChange={e => set("currency", e.target.value)}
                style={{ ...inputStyle, flex: 1 }}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name} ({c.sym})</option>
                ))}
              </select>
            </div>

            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: G.gold, fontSize: 13, fontWeight: 700, pointerEvents: "none",
              }}>
                {currSym(form.currency)}
              </span>
              <input type="number" placeholder="Target amount" value={form.target}
                onChange={e => set("target", e.target.value)}
                style={{ ...inputStyle, paddingLeft: currSym(form.currency).length > 2 ? 46 : 30, width: "100%" }} />
            </div>

            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: G.gold, fontSize: 13, fontWeight: 700, pointerEvents: "none",
              }}>
                {currSym(form.currency)}
              </span>
              <input type="number" placeholder="Already saved" value={form.saved}
                onChange={e => set("saved", e.target.value)}
                style={{ ...inputStyle, paddingLeft: currSym(form.currency).length > 2 ? 46 : 30, width: "100%" }} />
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", gridColumn: "1/-1" }}>
              <span style={{ color: G.textSoft, fontSize: 13 }}>Colour:</span>
              {GOAL_COLORS.map(c => (
                <button key={c} onClick={() => set("color", c)} style={{
                  width: 24, height: 24, borderRadius: "50%", background: c, border: "none",
                  cursor: "pointer", outline: form.color === c ? `2px solid ${G.text}` : "none",
                  outlineOffset: 2,
                }} />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={add} disabled={loading} style={{
              background: G.gold, color: "#000", border: "none",
              borderRadius: 8, padding: "10px 24px", fontWeight: 700, cursor: "pointer",
            }}>{loading ? "Saving…" : "Save Goal"}</button>
            <button onClick={() => setShowForm(false)} style={{
              background: "transparent", color: G.textSoft,
              border: `1px solid ${G.border}`, borderRadius: 8, padding: "10px 24px", cursor: "pointer",
            }}>Cancel</button>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {goals.length === 0 && (
          <p style={{ color: G.muted, fontSize: 13, gridColumn: "1/-1", textAlign: "center", padding: 40 }}>
            No goals yet. Add your first wealth goal above!
          </p>
        )}
        {goals.map(g => {
          const p    = pct(g.saved, g.target);
          const done = g.saved >= g.target;
          return (
            <Card key={g.id} style={{ borderColor: done ? g.color + "60" : G.border }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ color: G.text, fontSize: 15, fontWeight: 600, margin: 0 }}>
                    {done ? "✅ " : ""}{g.name}
                  </h3>
                  {done && <span style={{ color: G.green, fontSize: 11 }}>Goal reached!</span>}
                </div>
                <button onClick={() => remove(g.id)} style={{
                  background: "transparent", border: "none", color: G.muted, cursor: "pointer", fontSize: 14,
                }}>✕</button>
              </div>

              <div style={{ background: G.border, borderRadius: 99, height: 8, marginBottom: 12 }}>
                <div style={{
                  width: `${Math.min(p, 100)}%`, background: g.color, height: "100%",
                  borderRadius: 99, boxShadow: `0 0 10px ${g.color}60`, transition: "width 0.5s",
                }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ color: g.color, fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{p}%</span>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: G.text, fontSize: 14, fontWeight: 600, margin: 0 }}>{fmt(g.saved, g.currency || currency)}</p>
                  <p style={{ color: G.textSoft, fontSize: 11, margin: 0 }}>of {fmt(g.target, g.currency || currency)}</p>
                </div>
              </div>

              <button onClick={() => addSavings(g)} style={{
                width: "100%", background: `${g.color}20`, color: g.color,
                border: `1px solid ${g.color}40`, borderRadius: 8,
                padding: "8px 0", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>+ Add Savings</button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
