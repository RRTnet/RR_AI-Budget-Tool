import { useState } from "react";
import { G, COUNTRY_CODES, TIMEZONES } from "../constants";
import { apiCall } from "../utils/api";
import { inputStyle } from "../utils/styles";
import Card from "../components/ui/Card";
import ErrorBanner from "../components/ui/ErrorBanner";

export default function ReminderSettingsView({ user, token, onUpdate }) {
  const [form, setForm] = useState({
    countryCode:       "+1",
    localPhone:        "",
    reminder_enabled:  user?.reminder_enabled  ?? false,
    reminder_time:     user?.reminder_time     ?? "20:00",
    timezone:          user?.timezone          ?? "UTC",
    reminder_channel:  user?.reminder_channel  ?? "whatsapp",
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Pre-fill phone if user already has one
  useState(() => {
    if (user?.phone_number) {
      const match = COUNTRY_CODES.find(c => user.phone_number.startsWith(c.code));
      if (match) {
        setForm(p => ({
          ...p,
          countryCode: match.code,
          localPhone: user.phone_number.slice(match.code.length),
        }));
      }
    }
  });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess(false);
    try {
      const phone = form.localPhone.trim()
        ? form.countryCode + form.localPhone.replace(/\D/g, "")
        : null;
      const updated = await apiCall("/auth/reminder-settings", {
        method: "PATCH",
        body: JSON.stringify({
          phone_number:     phone,
          reminder_enabled: form.reminder_enabled,
          reminder_time:    form.reminder_time,
          timezone:         form.timezone,
          reminder_channel: form.reminder_channel,
        }),
      }, token);
      onUpdate(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const rowStyle   = { display: "flex", flexDirection: "column", gap: 6 };
  const labelStyle = { color: G.textSoft, fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase" };

  return (
    <div style={{ maxWidth: 560 }}>
      <h2 style={{ color: G.gold, fontFamily: "'Playfair Display',serif", fontSize: 22, marginBottom: 6 }}>
        ⏰ Daily Reminders
      </h2>
      <p style={{ color: G.textSoft, fontSize: 13, marginBottom: 28 }}>
        Get a daily SMS nudge to log your expenses and stay on top of your finances.
      </p>

      <Card>
        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Phone number */}
          <div style={rowStyle}>
            <span style={labelStyle}>📱 Mobile Number</span>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={form.countryCode}
                onChange={e => set("countryCode", e.target.value)}
                style={{ ...inputStyle, width: 130, flexShrink: 0 }}
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="Phone number (digits only)"
                value={form.localPhone}
                onChange={e => set("localPhone", e.target.value)}
                style={inputStyle}
              />
            </div>
            <span style={{ color: G.muted, fontSize: 11 }}>
              {form.localPhone.trim()
                ? `Will send to: ${form.countryCode}${form.localPhone.replace(/\D/g, "")}`
                : "Leave empty to remove your phone number."}
            </span>
          </div>

          {/* Enable toggle */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: G.surface, borderRadius: 10, padding: "14px 16px",
            border: `1px solid ${form.reminder_enabled ? G.gold + "50" : G.border}`,
          }}>
            <div>
              <p style={{ color: G.text, fontSize: 14, fontWeight: 600 }}>Daily SMS Reminder</p>
              <p style={{ color: G.textSoft, fontSize: 12, marginTop: 2 }}>
                {form.reminder_enabled ? "Active — you'll receive a daily nudge" : "Disabled"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => set("reminder_enabled", !form.reminder_enabled)}
              style={{
                width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: form.reminder_enabled ? G.gold : G.muted,
                position: "relative", transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 3,
                left: form.reminder_enabled ? 25 : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left 0.2s",
              }} />
            </button>
          </div>

          {/* Channel picker */}
          <div style={rowStyle}>
            <span style={labelStyle}>📬 Reminder Channel</span>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { id: "whatsapp", label: "WhatsApp", icon: "💬", note: "Free, rich messages, read receipts" },
                { id: "sms",      label: "SMS",       icon: "📱", note: "Universal — works on any phone" },
              ].map(ch => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => set("reminder_channel", ch.id)}
                  style={{
                    flex: 1, padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                    border: `1px solid ${form.reminder_channel === ch.id ? G.gold : G.border}`,
                    background: form.reminder_channel === ch.id ? G.goldFade : G.surface,
                    textAlign: "left", transition: "all 0.15s",
                  }}
                >
                  <p style={{ color: form.reminder_channel === ch.id ? G.gold : G.text, fontSize: 14, fontWeight: 600, margin: 0 }}>
                    {ch.icon} {ch.label}
                  </p>
                  <p style={{ color: G.muted, fontSize: 11, marginTop: 4 }}>{ch.note}</p>
                </button>
              ))}
            </div>
            {form.reminder_channel === "whatsapp" && (
              <p style={{ color: G.muted, fontSize: 11, marginTop: 4 }}>
                💡 First-time WhatsApp: you must join the Twilio sandbox once by sending the join code to the WhatsApp number in your .env.
              </p>
            )}
          </div>

          {/* Time + Timezone */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ ...rowStyle, flex: 1 }}>
              <span style={labelStyle}>⏰ Reminder Time</span>
              <input
                type="time"
                value={form.reminder_time}
                onChange={e => set("reminder_time", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ ...rowStyle, flex: 2 }}>
              <span style={labelStyle}>🌍 Your Timezone</span>
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

          {error   && <ErrorBanner msg={error} onDismiss={() => setError("")} />}

          {success && (
            <div style={{
              background: "#22c55e20", border: "1px solid #22c55e40",
              borderRadius: 10, padding: "12px 16px", color: G.green, fontSize: 13,
            }}>
              ✅ Reminder settings saved!
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            background: saving ? G.muted : G.gold,
            color: "#000", border: "none", borderRadius: 10,
            padding: "12px 0", fontWeight: 700, fontSize: 14,
            cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </form>
      </Card>

      <div style={{
        marginTop: 20, padding: "14px 18px",
        background: G.goldFade, borderRadius: 12,
        border: `1px solid ${G.gold}30`, fontSize: 12, color: G.textSoft, lineHeight: 1.6,
      }}>
        <p style={{ color: G.gold, fontWeight: 600, marginBottom: 6 }}>💡 How reminders work</p>
        <p>• You'll receive one SMS per day at your chosen time.</p>
        <p>• The message is a friendly nudge — tap it to open Rolling Revenue.</p>
        <p>• Toggle off anytime to stop reminders immediately.</p>
        <p style={{ marginTop: 6, color: G.muted }}>Powered by Twilio. Standard SMS rates may apply.</p>
      </div>
    </div>
  );
}
