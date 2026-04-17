import { useState, useEffect, useRef } from "react";
import { G } from "../constants";
import { fmt, pct, toBase } from "../utils/currency";
import { API_BASE } from "../utils/api";
import Card from "../components/ui/Card";
import ErrorBanner from "../components/ui/ErrorBanner";
import { inputStyle } from "../utils/styles";

const PROMPT_CATEGORIES = [
  {
    id: "analysis", icon: "📊", label: "Analysis",
    prompts: [
      "Analyse my finances and give me the top 5 actions to build wealth faster.",
      "What are my biggest financial strengths and weaknesses this month?",
      "Give me a financial health score out of 10 and explain it.",
      "Compare my income vs spending — am I on track for financial independence?",
      "What patterns do you see in my spending that I should fix?",
    ],
  },
  {
    id: "savings", icon: "💰", label: "Savings",
    prompts: [
      "How can I increase my savings rate to 30%?",
      "What expenses should I cut first to save more money?",
      "How do I build a 6-month emergency fund with my current income?",
      "Create a step-by-step 90-day savings plan for me.",
      "What's the fastest way to save an extra £500 per month?",
    ],
  },
  {
    id: "investing", icon: "📈", label: "Investing",
    prompts: [
      "What's a realistic investment strategy with my current income?",
      "How much should I invest each month given my expenses?",
      "Should I focus on index funds, property, or something else?",
      "Explain compound interest using my actual savings numbers.",
      "How long until I reach financial independence at my current savings rate?",
    ],
  },
  {
    id: "debt", icon: "💳", label: "Debt & Bills",
    prompts: [
      "Should I focus on paying down debt or investing?",
      "What's the avalanche vs snowball debt method — which suits me?",
      "How do I prioritise which bills to pay off first?",
      "What's a healthy debt-to-income ratio and how do I get there?",
    ],
  },
  {
    id: "planning", icon: "🎯", label: "Planning",
    prompts: [
      "Create a personalised 12-month financial roadmap for me.",
      "What should my ideal budget look like based on my income?",
      "How much should I allocate to housing, food, and transport?",
      "What financial milestones should I aim for this year?",
      "Help me plan financially for a major purchase.",
    ],
  },
  {
    id: "tax", icon: "🏛️", label: "Tax & UK",
    prompts: [
      "What UK tax-efficient savings options should I use (ISA, pension)?",
      "How can I reduce my tax bill legally in the UK?",
      "Should I contribute more to my pension given my income?",
      "Explain the UK personal allowance and how it affects my tax.",
      "What is the best way to use my ISA allowance this tax year?",
    ],
  },
];

export default function AdvisorView({ token, income, expenses, currency, rates }) {
  const [question,   setQuestion]   = useState("");
  const [history,    setHistory]    = useState([]);
  const [liveAnswer, setLiveAnswer] = useState("");
  const [liveQ,      setLiveQ]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [streaming,  setStreaming]  = useState(false);
  const [error,      setError]      = useState("");
  const [activeTab,  setActiveTab]  = useState("analysis");
  const [copied,     setCopied]     = useState(null);
  const bottomRef = useRef(null);

  const isBusy    = loading || streaming;
  const baseCcy   = currency || "USD";
  const totalIncome   = (income   || []).reduce((s, i) => s + toBase(i.amount, i.currency || baseCcy, baseCcy, rates), 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + toBase(e.amount, e.currency || baseCcy, baseCcy, rates), 0);
  const savingsRate   = pct(totalIncome - totalExpenses, totalIncome);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveAnswer, history]);

  const ask = async (q) => {
    const qText = (q || question).trim();
    if (!qText) return;
    setQuestion("");
    setLiveQ(qText);
    setLiveAnswer("");
    setLoading(true);
    setStreaming(false);
    setError("");

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/advisor/stream`, {
        method: "POST", headers,
        body: JSON.stringify({ question: qText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(err.detail || "Request failed");
      }
      setLoading(false);
      setStreaming(true);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalModel = ""; let finalTokens = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const payload = JSON.parse(raw);
            if (payload.error) { setError(payload.error); return; }
            if (payload.token) setLiveAnswer(prev => prev + payload.token);
            if (payload.done)  { finalModel = payload.model || ""; finalTokens = payload.tokens; }
          } catch { /* skip */ }
        }
      }
      setLiveAnswer(prev => {
        setHistory(h => {
          const last = { q: qText, a: prev, model: finalModel, tokens: finalTokens, id: Date.now() };
          return [...h.slice(0, -1), last].filter((x, i, arr) => arr.findIndex(y => y.id === x.id) === i || i === arr.length - 1);
        });
        return prev;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStreaming(false);
      setLiveAnswer(prev => {
        if (prev) {
          setHistory(h => [...h, { q: liveQ, a: prev, model: "", tokens: null, id: Date.now() }]);
        }
        return "";
      });
      setLiveQ("");
    }
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} style={{ color: G.text }}>{p.slice(2, -2)}</strong>
        : p
    );
  };

  const renderAdvice = (text) => text.split("\n").map((line, i) => {
    if (line.startsWith("### "))
      return <h4 key={i} style={{ color: G.goldSoft, margin: "14px 0 5px", fontSize: 13, fontWeight: 700 }}>{renderInline(line.slice(4))}</h4>;
    if (line.startsWith("## ") || line.startsWith("# "))
      return <h3 key={i} style={{ color: G.gold, fontFamily: "'Playfair Display',serif", margin: "18px 0 8px", fontSize: 15 }}>{renderInline(line.replace(/^#+\s*/, ""))}</h3>;
    if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* "))
      return <li key={i} style={{ color: G.textSoft, fontSize: 14, lineHeight: 1.75, marginLeft: 18, marginBottom: 2 }}>{renderInline(line.slice(2))}</li>;
    if (/^\d+\./.test(line))
      return <li key={i} style={{ color: G.textSoft, fontSize: 14, lineHeight: 1.75, marginLeft: 18, marginBottom: 2, listStyle: "decimal" }}>{renderInline(line.replace(/^\d+\.\s*/, ""))}</li>;
    if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
    return <p key={i} style={{ color: G.textSoft, fontSize: 14, lineHeight: 1.75, margin: "3px 0" }}>{renderInline(line)}</p>;
  });

  const activeCat = PROMPT_CATEGORIES.find(c => c.id === activeTab);

  return (
    <div style={{ display: "flex", gap: 24 }}>
      {/* Left panel — prompt library */}
      <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Financial snapshot */}
        <Card style={{ padding: 16 }}>
          <p style={{ color: G.textSoft, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Your Snapshot
          </p>
          {[
            { label: "Income",       val: fmt(totalIncome,   baseCcy), color: G.green },
            { label: "Expenses",     val: fmt(totalExpenses, baseCcy), color: G.red },
            { label: "Savings rate", val: `${savingsRate}%`,           color: savingsRate >= 20 ? G.green : savingsRate >= 10 ? "#f97316" : G.red },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: G.textSoft, fontSize: 12 }}>{s.label}</span>
              <span style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{s.val}</span>
            </div>
          ))}
        </Card>

        {/* Category tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {PROMPT_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
              background: activeTab === cat.id ? G.goldFade : "transparent",
              color: activeTab === cat.id ? G.gold : G.textSoft,
              fontWeight: activeTab === cat.id ? 600 : 400, fontSize: 13,
              borderLeft: activeTab === cat.id ? `2px solid ${G.gold}` : "2px solid transparent",
            }}>
              <span>{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>

        {/* Prompt buttons */}
        {activeCat && (
          <Card style={{ padding: 14 }}>
            <p style={{ color: G.gold, fontSize: 11, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {activeCat.icon} {activeCat.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {activeCat.prompts.map((p, i) => (
                <button key={i} onClick={() => { setQuestion(p); ask(p); }} disabled={isBusy} style={{
                  background: G.surface, border: `1px solid ${G.border}`,
                  borderRadius: 8, padding: "8px 10px", cursor: isBusy ? "not-allowed" : "pointer",
                  color: G.textSoft, fontSize: 12, textAlign: "left", lineHeight: 1.4,
                }}>
                  {p}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Right panel — chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ color: G.text, margin: 0, fontSize: 20, fontFamily: "'Playfair Display',serif" }}>🤖 AI Financial Advisor</h2>
            <p style={{ color: G.textSoft, fontSize: 13, margin: "4px 0 0" }}>
              Powered by <span style={{ color: G.gold }}>gpt-oss:120b</span> on your DGX Spark · streams in real-time
            </p>
          </div>
          {history.length > 0 && (
            <button onClick={() => setHistory([])} style={{
              background: "transparent", border: `1px solid ${G.border}`, color: G.muted,
              borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12,
            }}>🗑 Clear chat</button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {history.length === 0 && !isBusy && !error && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
              <p style={{ color: G.textSoft, fontSize: 14, marginBottom: 6 }}>Your financial advisor is ready.</p>
              <p style={{ color: G.muted, fontSize: 12 }}>Pick a prompt from the left or type your own question below.</p>
            </div>
          )}

          {history.map((item) => (
            <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{
                  background: G.goldFade, border: `1px solid ${G.gold}30`,
                  borderRadius: "16px 16px 4px 16px", padding: "10px 16px",
                  maxWidth: "80%", color: G.gold, fontSize: 14, lineHeight: 1.5,
                }}>
                  {item.q}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Card style={{ borderColor: G.gold + "20", padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🤖</span>
                      <span style={{ color: G.gold, fontSize: 12, fontWeight: 600 }}>AI Advisor</span>
                      {item.model && (
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: G.goldFade, color: G.gold }}>{item.model}</span>
                      )}
                      {item.tokens && (
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: G.surface, color: G.muted }}>{item.tokens} tokens</span>
                      )}
                    </div>
                    <button onClick={() => copyText(item.a, item.id)} style={{
                      background: "transparent", border: `1px solid ${G.border}`, borderRadius: 6,
                      padding: "4px 10px", cursor: "pointer", color: copied === item.id ? G.green : G.muted, fontSize: 11,
                    }}>
                      {copied === item.id ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <div>{renderAdvice(item.a)}</div>
                </Card>
              </div>
            </div>
          ))}

          {/* Live streaming */}
          {(loading || (streaming && liveQ)) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{
                  background: G.goldFade, border: `1px solid ${G.gold}30`,
                  borderRadius: "16px 16px 4px 16px", padding: "10px 16px",
                  maxWidth: "80%", color: G.gold, fontSize: 14,
                }}>
                  {liveQ}
                </div>
              </div>
              <Card style={{ borderColor: G.gold + "20", padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 16 }}>🤖</span>
                  <span style={{ color: G.gold, fontSize: 12, fontWeight: 600 }}>AI Advisor</span>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: G.green, animation: "pulse 1s infinite" }} />
                  <span style={{ color: G.muted, fontSize: 11 }}>{loading ? "Connecting to DGX Spark…" : "Streaming…"}</span>
                </div>
                {loading ? (
                  <div style={{ display: "flex", gap: 6, padding: "8px 0" }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{
                        width: 8, height: 8, borderRadius: "50%", background: G.gold, display: "inline-block",
                        animation: `pulse 1s ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                ) : (
                  <div>
                    {renderAdvice(liveAnswer)}
                    <span style={{
                      display: "inline-block", width: 2, height: 14, background: G.gold, marginLeft: 2,
                      animation: "blink 0.8s step-end infinite", verticalAlign: "middle",
                    }} />
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        <ErrorBanner msg={error} onDismiss={() => setError("")} />

        <Card style={{ padding: 16, marginTop: "auto" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), ask())}
              placeholder="Ask anything about your finances… (Enter to send, Shift+Enter for new line)"
              rows={2}
              disabled={isBusy}
              style={{
                ...inputStyle, resize: "none", flex: 1,
                fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5,
                opacity: isBusy ? 0.6 : 1, borderRadius: 10,
              }}
            />
            <button onClick={() => ask()} disabled={isBusy || !question.trim()} style={{
              background: (isBusy || !question.trim()) ? G.muted : G.gold,
              color: "#000", border: "none", borderRadius: 10,
              padding: "10px 20px", fontWeight: 700, fontSize: 14, flexShrink: 0,
              cursor: (isBusy || !question.trim()) ? "not-allowed" : "pointer",
            }}>
              {loading ? "…" : streaming ? "⏳" : "Send ↑"}
            </button>
          </div>
        </Card>

        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
