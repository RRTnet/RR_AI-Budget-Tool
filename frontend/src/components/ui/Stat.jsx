import { G } from "../../constants";

export default function Stat({ label, value, sub, accent = G.gold }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: G.textSoft, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 700, color: accent, fontFamily: "'Playfair Display',serif" }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 12, color: G.textSoft }}>{sub}</span>}
    </div>
  );
}
