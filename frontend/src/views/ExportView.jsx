import { G } from "../constants";
import { fmt, toBase } from "../utils/currency";
import Card from "../components/ui/Card";
import Stat from "../components/ui/Stat";

export default function ExportView({ income, expenses, goals, currency, rates }) {
  const baseCcy       = currency;
  const totalIncome   = income.reduce((s, i) => s + toBase(i.amount, i.currency || baseCcy, baseCcy, rates), 0);
  const totalExpenses = expenses.reduce((s, e) => s + toBase(e.amount, e.currency || baseCcy, baseCcy, rates), 0);

  const downloadCSV = (data, filename, headers) => {
    const escape = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = data.map(row => headers.map(h => escape(row[h.key])).join(","));
    const csv  = [headers.map(h => h.label).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const COLS = [
    { key: "date",         label: "Date" },
    { key: "label",        label: "Description" },
    { key: "category",     label: "Category" },
    { key: "amount",       label: "Amount" },
    { key: "currency",     label: "Currency" },
    { key: "note",         label: "Note" },
    { key: "is_recurring", label: "Recurring" },
  ];

  const exportAll = () => {
    const all = [
      ...income.map(x => ({ ...x, type: "income" })),
      ...expenses.map(x => ({ ...x, type: "expense" })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1));
    downloadCSV(all, "rolling-revenue-all.csv", [{ key: "type", label: "Type" }, ...COLS]);
  };

  const items = [
    { label: "📥 All Transactions", sub: `${income.length + expenses.length} records`,                         onClick: exportAll,                                                        accent: G.gold  },
    { label: "💵 Income Only",      sub: `${income.length} records · ${fmt(totalIncome,   baseCcy)}`,          onClick: () => downloadCSV(income,   "rr-income.csv",   COLS),             accent: G.green },
    { label: "💸 Expenses Only",    sub: `${expenses.length} records · ${fmt(totalExpenses, baseCcy)}`,        onClick: () => downloadCSV(expenses, "rr-expenses.csv", COLS),             accent: G.red   },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>
      <div>
        <h2 style={{ color: G.text, margin: 0, fontSize: 20, fontFamily: "'Playfair Display',serif" }}>📤 Export Data</h2>
        <p style={{ color: G.textSoft, fontSize: 13, margin: "4px 0 0" }}>
          Download your financial records for accounting or tax purposes
        </p>
      </div>

      <Card>
        <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Data Summary
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <Stat label="Income entries"  value={income.length}   accent={G.green} />
          <Stat label="Expense entries" value={expenses.length} accent={G.red} />
          <Stat label="Goals"           value={goals.length}    accent={G.gold} />
        </div>
      </Card>

      <Card>
        <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          CSV Export
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item, i) => (
            <button key={i} onClick={item.onClick} style={{
              background: G.surface, border: `1px solid ${G.border}`, borderRadius: 12,
              padding: "14px 18px", cursor: "pointer", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ textAlign: "left" }}>
                <p style={{ color: item.accent, fontWeight: 600, fontSize: 14, margin: 0 }}>{item.label}</p>
                <p style={{ color: G.muted, fontSize: 11, margin: "2px 0 0" }}>{item.sub}</p>
              </div>
              <span style={{ color: G.textSoft, fontSize: 20 }}>↓</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          PDF / Print
        </p>
        <p style={{ color: G.textSoft, fontSize: 12, marginBottom: 14 }}>
          Opens a print-friendly summary — use "Save as PDF" in the print dialog
        </p>
        <button onClick={() => window.print()} style={{
          background: G.goldFade, border: `1px solid ${G.gold}40`, color: G.gold,
          borderRadius: 10, padding: "12px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14, width: "100%",
        }}>🖨️ Print / Save as PDF</button>
      </Card>
    </div>
  );
}
