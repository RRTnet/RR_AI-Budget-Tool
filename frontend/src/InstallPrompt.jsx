/**
 * InstallPrompt.jsx
 * ─────────────────
 * Shows a native-style "Install App" banner when the browser fires
 * the beforeinstallprompt event (Chrome/Edge on Android & desktop).
 *
 * iOS Safari doesn't fire this event — instead we show a manual
 * "tap Share → Add to Home Screen" tooltip.
 */
import { useState, useEffect } from "react";

const G = {
  bg:      "#0a0c10",
  card:    "#161a22",
  border:  "#1e2430",
  gold:    "#c9a84c",
  text:    "#e2e8f0",
  textSoft:"#94a3b8",
};

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAndroid, setShowAndroid]       = useState(false);
  const [showIos, setShowIos]               = useState(false);
  const [dismissed, setDismissed]           = useState(false);

  useEffect(() => {
    // Already installed — don't show anything
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem("pwa-dismissed")) return;

    // iOS: show manual instructions
    if (isIos()) {
      setShowIos(true);
      return;
    }

    // Android/Chrome: capture the install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("pwa-dismissed", "1");
    setShowAndroid(false);
    setShowIos(false);
    setDismissed(true);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowAndroid(false);
      setDeferredPrompt(null);
    }
  };

  if (dismissed || (!showAndroid && !showIos)) return null;

  const bannerStyle = {
    position:       "fixed",
    bottom:         "env(safe-area-inset-bottom, 16px)",
    left:           "50%",
    transform:      "translateX(-50%)",
    width:          "calc(100% - 32px)",
    maxWidth:       480,
    background:     G.card,
    border:         `1px solid ${G.border}`,
    borderRadius:   16,
    padding:        "14px 16px",
    display:        "flex",
    alignItems:     "center",
    gap:            12,
    zIndex:         9999,
    boxShadow:      "0 8px 32px rgba(0,0,0,0.6)",
    marginBottom:   16,
  };

  return (
    <div style={bannerStyle} role="banner" aria-label="Install Rolling Revenue">
      {/* Icon */}
      <img src="/icons/icon.svg" alt="" width={40} height={40}
        style={{ borderRadius: 10, flexShrink: 0 }} />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: G.text, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
          Install Rolling Revenue
        </p>
        {showAndroid && (
          <p style={{ color: G.textSoft, fontSize: 12 }}>
            Add to your home screen for quick access
          </p>
        )}
        {showIos && (
          <p style={{ color: G.textSoft, fontSize: 12 }}>
            Tap <strong style={{ color: G.gold }}>Share</strong> then{" "}
            <strong style={{ color: G.gold }}>Add to Home Screen</strong>
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {showAndroid && (
          <button onClick={install} style={{
            background: G.gold, color: "#0a0c10",
            border: "none", borderRadius: 8,
            padding: "7px 14px", fontSize: 13,
            fontWeight: 700, cursor: "pointer",
          }}>
            Install
          </button>
        )}
        <button onClick={dismiss} style={{
          background: "transparent",
          color: G.textSoft,
          border: `1px solid ${G.border}`,
          borderRadius: 8,
          padding: "7px 10px",
          fontSize: 13,
          cursor: "pointer",
        }}>
          ✕
        </button>
      </div>
    </div>
  );
}
