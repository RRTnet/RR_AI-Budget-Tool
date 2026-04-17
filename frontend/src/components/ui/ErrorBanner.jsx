import { G } from "../../constants";

export default function ErrorBanner({ msg, onDismiss }) {
  if (!msg) return null;
  return (
    <div style={{
      background: "#ef444420",
      border: "1px solid #ef444440",
      borderRadius: 10,
      padding: "12px 16px",
      color: G.red,
      fontSize: 13,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <span>⚠️ {msg}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{
          background: "none", border: "none", color: G.red, cursor: "pointer", fontSize: 16,
        }}>✕</button>
      )}
    </div>
  );
}
