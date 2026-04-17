import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { G, PIE_COLORS } from "../constants";
import { fmt, pct, toBase } from "../utils/currency";
import Card from "../components/ui/Card";
import CustomTooltip from "../components/ui/CustomTooltip";

function KpiCard({ icon, label, value, sub, color, accent }) {
  return (
    <div className="rr-kpi-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: G.textSoft, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
          {label}
        </span>
        <span style={{
          width: 32, height: 32, borderRadius: 8, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 16,
          background: accent || "rgba(201,168,76,0.12)",
        }}>
          {icon}
        </span>
      </div>
      <span style={{ fontSize: 26, fontWeight: 700, color: color || G.gold, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 12, color: G.textSoft }}>{sub}</span>}
    </div>
  );
}

export default function Dashboard({ income, expenses, goals, historyData, currency, rates }) {
  const totalIncome   = income.reduce((s, i) => s + toBase(i.amount, i.currency || currency, currency, rates), 0);
  const totalExpenses = expenses.reduce((s, e) => s + toBase(e.amount, e.currency || currency, currency, rates), 0);
  const savings       = totalIncome - totalExpenses;
  const savingsRate   = pct(savings, totalIncome);
  const wealthScore   = Math.min(100, Math.round(savingsRate * 1.8));
  const isMixed       = [...income, ...expenses].some(x => x.currency && x.currency !== currency);
  const prefix        = isMixed ? "~" : "";

  const pieData = Object.entries(
    expenses.reduce((acc, e) => {
      const v = toBase(e.amount, e.currency || currency, currency, rates);
      acc[e.category] = (acc[e.category] || 0) + v;
      return acc;
    }, {})
  ).map(([k, v]) => ({ name: k, value: v }));

  const scoreColor = wealthScore > 70 ? G.green : wealthScore > 50 ? G.gold : G.red;
  const rateColor  = savingsRate >= 20 ? G.green : savingsRate >= 10 ? G.gold : G.red;

  return (
    <div className="rr-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Hero banner */}
      <div style={{
        background: "linear-gradient(135deg, #1a1505 0%, #16190f 40%, #161a22 70%, #0d1018 100%)",
        border: `1px solid rgba(201,168,76,0.2)`,
        borderRadius: 20, padding: "28px 32px",
        position: "relative", overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
      }}>
        {/* Decorative glow */}
        <div style={{
          position: "absolute", top: -80, right: -80, width: 260, height: 260,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${G.gold}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: 80, width: 160, height: 160,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${G.green}0a 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative" }}>
          <p style={{ color: G.textSoft, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
            Monthly Net Worth Growth
          </p>
          <p style={{
            fontSize: 54, fontWeight: 700, color: G.goldSoft,
            fontFamily: "'Playfair Display',serif", margin: "0 0 6px", lineHeight: 1,
          }}>
            {prefix}{fmt(savings, currency)}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: `${G.green}18`, border: `1px solid ${G.green}30`,
              borderRadius: 20, padding: "4px 12px", fontSize: 13, color: G.green, fontWeight: 600,
            }}>
              ↑ {savingsRate}% savings rate
            </span>
            {isMixed && (
              <span style={{ color: G.muted, fontSize: 12 }}>~ multi-currency converted</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="rr-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        <KpiCard
          icon="💵" label="Total Income"
          value={`${prefix}${fmt(totalIncome, currency)}`}
          sub={`${income.length} entries`}
          color={G.green} accent="rgba(34,197,94,0.12)"
        />
        <KpiCard
          icon="💸" label="Total Expenses"
          value={`${prefix}${fmt(totalExpenses, currency)}`}
          sub={`${expenses.length} entries`}
          color={G.red} accent="rgba(239,68,68,0.1)"
        />
        <KpiCard
          icon="🏆" label="Wealth Score"
          value={`${wealthScore}/100`}
          sub={wealthScore > 70 ? "Excellent 🌟" : wealthScore > 50 ? "Good 👍" : "Needs work"}
          color={scoreColor}
          accent={`${scoreColor}18`}
        />
      </div>

      {/* Savings rate bar */}
      <Card style={{ padding: "18px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <span style={{ color: G.text, fontSize: 14, fontWeight: 600 }}>Savings Rate</span>
            <span style={{ color: G.textSoft, fontSize: 12, marginLeft: 8 }}>
              {savingsRate >= 20 ? "You're building real wealth" : savingsRate >= 10 ? "On the right track" : "Try to cut expenses"}
            </span>
          </div>
          <span style={{ color: rateColor, fontWeight: 700, fontSize: 20, fontFamily: "'Playfair Display',serif" }}>
            {savingsRate}%
          </span>
        </div>
        <div style={{ background: G.border, borderRadius: 99, height: 10, overflow: "hidden" }}>
          <div className="rr-progress-bar" style={{
            width: `${Math.min(savingsRate, 100)}%`, height: "100%", borderRadius: 99,
            background: `linear-gradient(90deg, ${rateColor}bb, ${rateColor})`,
            boxShadow: `0 0 10px ${rateColor}50`,
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 11, color: G.muted }}>0%</span>
          <span style={{ fontSize: 11, color: G.muted }}>Target: 20–30%</span>
          <span style={{ fontSize: 11, color: G.muted }}>100%</span>
        </div>
      </Card>

      {/* Charts row */}
      <div className="rr-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card>
          <h3 style={{ color: G.text, marginBottom: 4, fontSize: 15, fontWeight: 600 }}>6-Month Trajectory</h3>
          <p style={{ color: G.textSoft, fontSize: 12, marginBottom: 20 }}>Income · Savings · Expenses</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={G.green} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={G.green} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSav" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={G.gold}  stopOpacity={0.4} />
                  <stop offset="95%" stopColor={G.gold}  stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
              <XAxis dataKey="month" stroke={G.muted} fontSize={11} tickLine={false} />
              <YAxis stroke={G.muted} fontSize={11} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income"   stroke={G.green} fill="url(#gInc)" name="Income"   strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="savings"  stroke={G.gold}  fill="url(#gSav)" name="Savings"  strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="expenses" stroke={G.red}   fill="none"       name="Expenses" strokeWidth={2} strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ color: G.text, marginBottom: 4, fontSize: 15, fontWeight: 600 }}>Spending Breakdown</h3>
          <p style={{ color: G.textSoft, fontSize: 12, marginBottom: 12 }}>This month by category</p>
          {pieData.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 8 }}>
              <span style={{ fontSize: 36 }}>💸</span>
              <p style={{ color: G.muted, fontSize: 13 }}>No expenses this month</p>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie data={pieData} cx={70} cy={70} innerRadius={45} outerRadius={68}
                    dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                {pieData.slice(0, 6).map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: G.textSoft, fontSize: 12, textTransform: "capitalize" }}>{d.name}</span>
                    </div>
                    <span style={{ color: G.text, fontSize: 12, fontWeight: 600 }}>{fmt(d.value, currency)}</span>
                  </div>
                ))}
                {pieData.length > 6 && (
                  <span style={{ color: G.muted, fontSize: 11 }}>+{pieData.length - 6} more</span>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Goals */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{ color: G.text, fontSize: 15, fontWeight: 600, margin: 0 }}>🎯 Wealth Goals</h3>
          <span style={{ color: G.textSoft, fontSize: 12 }}>{goals.length} active</span>
        </div>
        <p style={{ color: G.textSoft, fontSize: 12, marginBottom: 20 }}>Your path to financial independence</p>

        {goals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <span style={{ fontSize: 36 }}>🎯</span>
            <p style={{ color: G.muted, fontSize: 13, marginTop: 10 }}>No goals yet — add some in the Goals tab!</p>
          </div>
        ) : (
          <div className="rr-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {goals.map((g) => {
              const p    = pct(g.saved, g.target);
              const done = g.saved >= g.target;
              return (
                <div key={g.id} style={{
                  background: G.surface, borderRadius: 12, padding: 16,
                  border: `1px solid ${done ? g.color + "40" : G.border}`,
                  transition: "border-color 0.2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{ color: G.text, fontSize: 13, fontWeight: 600, flex: 1, paddingRight: 8 }}>
                      {done ? "✅ " : ""}{g.name}
                    </span>
                    <span style={{
                      background: `${g.color}20`, color: g.color,
                      fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      border: `1px solid ${g.color}30`,
                    }}>
                      {p}%
                    </span>
                  </div>
                  <div style={{ background: G.border, borderRadius: 99, height: 6, marginBottom: 8, overflow: "hidden" }}>
                    <div className="rr-progress-bar" style={{
                      width: `${Math.min(p, 100)}%`, background: g.color, height: "100%",
                      borderRadius: 99, boxShadow: `0 0 8px ${g.color}50`,
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: G.textSoft, fontSize: 11 }}>{fmt(g.saved, g.currency || currency)}</span>
                    <span style={{ color: G.muted, fontSize: 11 }}>of {fmt(g.target, g.currency || currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
