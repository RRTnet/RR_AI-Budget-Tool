import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { G, MONTHS } from "../constants";
import { fmt, pct, toBase, currSym } from "../utils/currency";
import Card from "../components/ui/Card";
import CustomTooltip from "../components/ui/CustomTooltip";

export default function SummaryView({ income, expenses, currency, rates }) {
  const totalIncome   = income.reduce((s, i) => s + toBase(i.amount, i.currency || currency, currency, rates), 0);
  const totalExpenses = expenses.reduce((s, e) => s + toBase(e.amount, e.currency || currency, currency, rates), 0);
  const savings       = totalIncome - totalExpenses;
  const rate          = pct(savings, totalIncome);

  const projected = Array.from({ length: 12 }, (_, i) => ({
    month: MONTHS[i],
    wealth: Math.round(savings * (i + 1) * 1.06 ** (i / 12)),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h2 style={{ color: G.text, margin: 0, fontSize: 20, fontFamily: "'Playfair Display',serif" }}>Monthly Summary</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { label: "Total Income",   val: fmt(totalIncome,   currency), color: G.green, icon: "💵" },
          { label: "Total Expenses", val: fmt(totalExpenses, currency), color: G.red,   icon: "💸" },
          { label: "Net Savings",    val: fmt(savings,       currency), color: G.gold,  icon: "🏆" },
        ].map((c, i) => (
          <Card key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{c.icon}</div>
            <p style={{ color: G.textSoft, fontSize: 12, margin: "0 0 4px" }}>{c.label}</p>
            <p style={{ color: c.color, fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "'Playfair Display',serif" }}>{c.val}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: G.text, fontWeight: 600 }}>Savings Rate</span>
          <span style={{ color: G.gold, fontWeight: 700 }}>{rate}%</span>
        </div>
        <div style={{ background: G.border, borderRadius: 99, height: 10 }}>
          <div style={{
            width: `${Math.min(rate, 100)}%`,
            background: `linear-gradient(90deg,${G.gold},${G.green})`,
            height: "100%", borderRadius: 99,
            boxShadow: `0 0 12px ${G.gold}50`, transition: "width 0.5s",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ color: G.textSoft, fontSize: 11 }}>0%</span>
          <span style={{ color: G.textSoft, fontSize: 11 }}>Excellent: 30%+</span>
          <span style={{ color: G.textSoft, fontSize: 11 }}>100%</span>
        </div>
      </Card>

      <Card>
        <h3 style={{ color: G.text, margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>💰 12-Month Wealth Projection</h3>
        <p style={{ color: G.textSoft, fontSize: 12, marginBottom: 20 }}>
          At current savings rate with 6% annual investment return
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={projected}>
            <defs>
              <linearGradient id="gWealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={G.gold} stopOpacity={0.4} />
                <stop offset="95%" stopColor={G.gold} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
            <XAxis dataKey="month" stroke={G.muted} fontSize={11} />
            <YAxis stroke={G.muted} fontSize={11} tickFormatter={v => `${currSym(currency)}${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="wealth" name="Projected Wealth"
              stroke={G.gold} fill="url(#gWealth)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
