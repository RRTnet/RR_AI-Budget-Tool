import { G } from "../../constants";

export default function NavBtn({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rr-nav-btn${active ? " active" : ""}`}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 10,
        border: "none", cursor: "pointer", width: "100%", textAlign: "left",
        background: active ? G.goldFade : "transparent",
        color: active ? G.gold : G.textSoft,
        fontWeight: active ? 600 : 400, fontSize: 14,
        borderLeft: active ? `3px solid ${G.gold}` : "3px solid transparent",
      }}
    >
      <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span>
      <span style={{ letterSpacing: "0.01em" }}>{label}</span>
    </button>
  );
}
