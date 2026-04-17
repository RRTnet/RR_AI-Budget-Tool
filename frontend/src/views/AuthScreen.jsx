import { useState } from "react";
import { G, CURRENCIES, COUNTRY_CODES, TIMEZONES } from "../constants";
import { apiCall } from "../utils/api";
import { inputStyle } from "../utils/styles";
import ErrorBanner from "../components/ui/ErrorBanner";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode]       = useState("login");
  const [form, setForm]       = useState({
    email: "", password: "", name: "", currency: "USD",
    countryCode: "+1", localPhone: "",
    reminderTime: "20:00", timezone: "UTC",
    reminderChannel: "whatsapp",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      let body;
      if (mode === "login") {
        body = { email: form.email, password: form.password };
      } else {
        const phone = form.localPhone.trim()
          ? form.countryCode + form.localPhone.replace(/\D/g, "")
          : undefined;
        body = {
          email: form.email,
          password: form.password,
          name: form.name,
          currency: form.currency,
          phone_number: phone,
          reminder_time: form.reminderTime,
          timezone: form.timezone,
          reminder_channel: form.reminderChannel,
        };
      }
      const data = await apiCall(path, { method: "POST", body: JSON.stringify(body) });
      onAuth(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: G.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: ${G.muted}; }
        input, select { color-scheme: dark; }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 420,
        background: G.surface, borderRadius: 24,
        border: `1px solid ${G.border}`,
        padding: 40, boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: G.gold, fontFamily: "'Playfair Display',serif" }}>
            💰 Rolling Revenue
          </p>
          <p style={{ color: G.textSoft, fontSize: 12, letterSpacing: "0.12em", marginTop: 4 }}>
            YOUR MONEY TOOL
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", background: G.card, borderRadius: 10, padding: 4, marginBottom: 28 }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: mode === m ? G.goldFade : "transparent",
              color: mode === m ? G.gold : G.textSoft,
              fontWeight: mode === m ? 600 : 400, fontSize: 13,
            }}>
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <input
              type="text" placeholder="Full name" value={form.name}
              onChange={e => set("name", e.target.value)} required
              style={inputStyle}
            />
          )}

          <input
            type="email" placeholder="Email address" value={form.email}
            onChange={e => set("email", e.target.value)} required
            style={inputStyle}
          />

          <input
            type="password" placeholder="Password" value={form.password}
            onChange={e => set("password", e.target.value)} required
            style={inputStyle}
          />

          {mode === "register" && (
            <select value={form.currency} onChange={e => set("currency", e.target.value)} style={inputStyle}>
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name} ({c.sym})</option>
              ))}
            </select>
          )}

          {mode === "register" && (
            <>
              <div>
                <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 6, letterSpacing: "0.06em" }}>
                  📱 MOBILE NUMBER <span style={{ color: G.muted }}>(for daily reminders — optional)</span>
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    value={form.countryCode}
                    onChange={e => set("countryCode", e.target.value)}
                    style={{ ...inputStyle, width: 130, flexShrink: 0 }}
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={form.localPhone}
                    onChange={e => set("localPhone", e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {form.localPhone.trim() && (
                <>
                  <div>
                    <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 8 }}>📬 Reminder channel</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        { id: "whatsapp", label: "WhatsApp", icon: "💬", note: "Free, rich messages" },
                        { id: "sms",      label: "SMS",       icon: "📱", note: "Universal, no app needed" },
                      ].map(ch => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => set("reminderChannel", ch.id)}
                          style={{
                            flex: 1, padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                            border: `1px solid ${form.reminderChannel === ch.id ? G.gold : G.border}`,
                            background: form.reminderChannel === ch.id ? G.goldFade : G.surface,
                            textAlign: "left",
                          }}
                        >
                          <p style={{ color: form.reminderChannel === ch.id ? G.gold : G.text, fontSize: 13, fontWeight: 600 }}>
                            {ch.icon} {ch.label}
                          </p>
                          <p style={{ color: G.muted, fontSize: 11, marginTop: 2 }}>{ch.note}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 6 }}>⏰ Reminder time</p>
                      <input
                        type="time"
                        value={form.reminderTime}
                        onChange={e => set("reminderTime", e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <p style={{ color: G.textSoft, fontSize: 11, marginBottom: 6 }}>🌍 Timezone</p>
                      <select
                        value={form.timezone}
                        onChange={e => set("timezone", e.target.value)}
                        style={inputStyle}
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {error && <ErrorBanner msg={error} onDismiss={() => setError("")} />}

          <button type="submit" disabled={loading} style={{
            background: loading ? G.muted : G.gold,
            color: "#000", border: "none", borderRadius: 10,
            padding: "12px 0", fontWeight: 700, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s", marginTop: 4,
          }}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p style={{ color: G.muted, fontSize: 11, textAlign: "center", marginTop: 20 }}>
          🤖 AI advisor powered by qwen3:30b on DGX Spark
        </p>
      </div>
    </div>
  );
}
