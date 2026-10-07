import React from "react";
import { Switch } from "./Switch.jsx";

export function ToggleRow({ icon, label, hint, checked = false, onChange, disabled = false, divider = false }) {
  return (
    <div
      role="button"
      onClick={disabled ? undefined : () => onChange && onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 0",
        cursor: disabled ? "not-allowed" : "pointer",
        borderBottom: divider ? "1px solid rgba(255,255,255,.07)" : "none",
        fontFamily: "var(--fc-font-ui)"
      }}
    >
      {icon && <span style={{ width: 22, textAlign: "center", fontSize: 17, color: "var(--fc-gold-300)" }}>{icon}</span>}
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: "#f6e8ff" }}>{label}</span>
      {hint && (
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".8px", color: "#b98fd6" }}>
          {hint}
        </span>
      )}
      <Switch checked={checked} onChange={onChange} disabled={disabled} label={label} />
    </div>
  );
}
