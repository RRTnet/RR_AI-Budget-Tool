import { G } from "../../constants";

export default function Card({ children, style = {}, interactive = false, className = "" }) {
  const classes = ["rr-card", interactive ? "rr-card-interactive" : "", className].filter(Boolean).join(" ");
  return (
    <div className={classes} style={{ padding: 24, ...style }}>
      {children}
    </div>
  );
}
