import React from "react";

export function Switch({ checked = false, onChange, disabled = false, label }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={disabled ? undefined : () => onChange && onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        padding: "0 3px",
        display: "flex",
        alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start",
        borderRadius: 12,
        background: checked ? "#2ec962" : "rgba(255,255,255,.22)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background var(--fc-dur-fast) var(--fc-ease-out)"
      }}
    >
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: checked ? "#fff" : "#efe6f7" }} />
    </div>
  );
}
