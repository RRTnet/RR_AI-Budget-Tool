import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import WealthTracker from "./WealthTracker.jsx";
import InstallPrompt from "./InstallPrompt.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WealthTracker />
    <InstallPrompt />
  </StrictMode>
);
