import { G } from "../constants";
import { fmt, toBase } from "../utils/currency";
import NavBtn from "./ui/NavBtn";
import Divider from "./ui/Divider";

const NAV = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "income",    icon: "💵", label: "Income" },
  { id: "expenses",  icon: "💸", label: "Expenses" },
  { id: "goals",     icon: "🎯", label: "Goals" },
  { id: "budgets",   icon: "💰", label: "Budgets" },
  { id: "insights",  icon: "🔍", label: "Insights" },
  { id: "export",    icon: "📤", label: "Export" },
  { id: "summary",   icon: "📈", label: "Summary" },
  { id: "advisor",   icon: "🤖", label: "AI Advisor" },
  { id: "reminders", icon: "⏰", label: "Reminders" },
];

export default function Sidebar({ view, setView, user, income, expenses, rates, onLogout }) {
  const baseCcy       = user?.currency || "USD";
  const isMixedCcy    = [...income, ...expenses].some(x => x.currency && x.currency !== baseCcy);
  const totalIncome   = income.reduce((s, i) => s + toBase(i.amount, i.currency || baseCcy, baseCcy, rates), 0);
  const totalExpenses = expenses.reduce((s, e) => s + toBase(e.amount, e.currency || baseCcy, baseCcy, rates), 0);
  const savings       = totalIncome - totalExpenses;
  const prefix        = isMixedCcy ? "~" : "";

  return (
    <div
      className="rr-sidebar"
      style={{
        width: 240,
        background: G.surface,
        borderRight: `1px solid ${G.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        gap: 4,
        flexShrink: 0,
        minHeight: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 28, padding: "0 4px" }}>
        <p className="rr-logo-text" style={{
          fontSize: 20, fontWeight: 700,
          fontFamily: "'Playfair Display',serif", margin: 0,
        }}>
          💰 Rolling Revenue
        </p>
        <p style={{ color: G.textSoft, fontSize: 10, margin: "4px 0 0", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Your Money Tool
        </p>
        {user && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            marginTop: 10, padding: "6px 10px",
            background: `${G.gold}0a`, borderRadius: 8,
            border: `1px solid ${G.gold}15`,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: G.goldFade, border: `1px solid ${G.gold}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: G.gold, fontWeight: 700, flexShrink: 0,
            }}>
              {(user.name || "U")[0].toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ color: G.text, fontSize: 12, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </p>
              <p style={{ color: G.muted, fontSize: 10, margin: 0 }}>{user.currency}</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(n => (
          <NavBtn key={n.id} {...n} active={view === n.id} onClick={() => setView(n.id)} />
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <Divider />

      {/* Quick stats */}
      <div style={{ padding: "4px 6px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Income",   val: `${prefix}${fmt(totalIncome,   baseCcy)}`, color: G.green },
          { label: "Expenses", val: `${prefix}${fmt(totalExpenses, baseCcy)}`, color: G.red },
          { label: "Savings",  val: `${prefix}${fmt(savings,       baseCcy)}`, color: savings >= 0 ? G.gold : G.red },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: G.textSoft, fontSize: 11 }}>{s.label}</span>
            <span style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* DGX badge */}
      <div style={{
        margin: "12px 0 0",
        padding: "10px 12px",
        background: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.04) 100%)",
        borderRadius: 10,
        border: `1px solid ${G.gold}25`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12 }}>⚡</span>
          <p style={{ color: G.gold, fontSize: 11, fontWeight: 600, margin: 0 }}>DGX Spark Ready</p>
        </div>
        <p style={{ color: G.muted, fontSize: 10, margin: 0 }}>AI · gpt-oss:120b</p>
      </div>

      <button
        className="rr-btn-ghost"
        onClick={onLogout}
        style={{
          marginTop: 8, background: "transparent", color: G.muted,
          border: `1px solid ${G.border}`, borderRadius: 8,
          padding: "9px 0", cursor: "pointer", fontSize: 12, width: "100%",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
