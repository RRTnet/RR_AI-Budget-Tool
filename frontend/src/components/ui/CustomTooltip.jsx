import { G } from "../../constants";
import { fmt } from "../../utils/currency";

export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: G.surface,
      border: `1px solid ${G.border}`,
      borderRadius: 10,
      padding: "10px 14px",
    }}>
      <p style={{ color: G.textSoft, fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}
