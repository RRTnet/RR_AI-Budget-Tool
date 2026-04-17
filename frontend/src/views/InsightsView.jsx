import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { G, MONTHS, PIE_COLORS, EXPENSE_CATS } from "../constants";
import { fmt, toBase } from "../utils/currency";
import Card from "../components/ui/Card";

export default function InsightsView({ income, expenses, currency, rates }) {
  const baseCcy = currency;
  const isMixed = [...income, ...expenses].some(x => x.currency && x.currency !== baseCcy);

  const expByCat = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + toBase(e.amount, e.currency || baseCcy, baseCcy, rates);
    return acc;
  }, {});
  const pieData = Object.entries(expByCat).map(([name, value]) => ({ name, value }));

  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d  = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const ms = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const inc = income.filter(x => x.date?.startsWith(ms))
      .reduce((s, x) => s + toBase(x.amount, x.currency || baseCcy, baseCcy, rates), 0);
    const exp = expenses.filter(x => x.date?.startsWith(ms))
      .reduce((s, x) => s + toBase(x.amount, x.currency || baseCcy, baseCcy, rates), 0);
    return { month: MONTHS[d.getMonth()], income: Math.round(inc), expenses: Math.round(exp) };
  });

  const top5 = [...expenses]
    .sort((a, b) => toBase(b.amount, b.currency || baseCcy, baseCcy, rates) - toBase(a.amount, a.currency || baseCcy, baseCcy, rates))
    .slice(0, 5);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDay = expenses.reduce((acc, e) => {
    const day = new Date(e.date + "T00:00:00").getDay();
    acc[day] = (acc[day] || 0) + toBase(e.amount, e.currency || baseCcy, baseCcy, rates);
    return acc;
  }, {});
  const dayData = dayNames.map((name, i) => ({ name, amount: Math.round(byDay[i] || 0) }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ color: G.text, margin: 0, fontSize: 20, fontFamily: "'Playfair Display',serif" }}>📊 Spending Insights</h2>
        <p style={{ color: G.textSoft, fontSize: 13, margin: "4px 0 0" }}>
          Understand your money patterns
          {isMixed && <span style={{ color: G.gold, marginLeft: 8 }}>~ converted to {baseCcy}</span>}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Expenses by Category
          </p>
          {pieData.length === 0
            ? <p style={{ color: G.muted, fontSize: 13, textAlign: "center", padding: 40 }}>No expenses yet</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                    labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v, baseCcy)} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </Card>

        <Card>
          <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Top 5 Expenses
          </p>
          {top5.length === 0
            ? <p style={{ color: G.muted, fontSize: 13, textAlign: "center", padding: 40 }}>No expenses yet</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {top5.map((e, i) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: G.gold, fontWeight: 700, fontSize: 13, width: 20 }}>#{i + 1}</span>
                    <span style={{ fontSize: 18 }}>{EXPENSE_CATS[e.category] || "📦"}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: G.text, fontSize: 13, margin: 0, fontWeight: 600 }}>{e.label}</p>
                      <p style={{ color: G.muted, fontSize: 11, margin: 0 }}>{e.category} · {e.date}</p>
                    </div>
                    <span style={{ color: G.red, fontWeight: 700, fontSize: 13 }}>
                      {fmt(toBase(e.amount, e.currency || baseCcy, baseCcy, rates), baseCcy)}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </Card>
      </div>

      <Card>
        <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Income vs Expenses — Last 6 Months
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={G.border} vertical={false} />
            <XAxis dataKey="month" stroke={G.muted} fontSize={11} />
            <YAxis stroke={G.muted} fontSize={11} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmt(v, baseCcy)} />
            <Bar dataKey="income"   name="Income"   fill={G.green} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill={G.red}   radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Spending by Day of Week
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dayData}>
            <CartesianGrid strokeDasharray="3 3" stroke={G.border} vertical={false} />
            <XAxis dataKey="name" stroke={G.muted} fontSize={11} />
            <YAxis stroke={G.muted} fontSize={11} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
            <Tooltip formatter={(v) => fmt(v, baseCcy)} />
            <Bar dataKey="amount" name="Spending" fill={G.gold} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
