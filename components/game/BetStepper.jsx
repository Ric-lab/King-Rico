import React from "react";
import { IconButton } from "../core/IconButton.jsx";

export function BetStepper({
  value,
  label = "Aposta",
  onDecrease,
  onIncrease,
  disabled = false,
  min = false,
  max = false,
  width = 260
}) {
  return (
    <div
      style={{
        width,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--fc-space-3)",
        padding: "4px 6px",
        borderRadius: "var(--fc-radius-pill)",
        background: "var(--fc-surface-rail)",
        border: "var(--fc-border-hairline) solid var(--fc-gold-600)",
        boxShadow: "var(--fc-bevel-down)"
      }}
    >
      <IconButton glyph="−" size={44} disabled={disabled || min} onClick={onDecrease} label="Diminuir aposta" />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
        <span
          style={{
            font: "var(--fc-weight-bold) var(--fc-size-caption)/1 var(--fc-font-ui)",
            letterSpacing: "var(--fc-tracking-label)",
            textTransform: "uppercase",
            color: "var(--fc-gold-200)",
            opacity: 0.75
          }}
        >
          {label}
        </span>
        <span
          style={{
            font: "var(--fc-weight-black) var(--fc-size-title)/1 var(--fc-font-numeric)",
            color: "var(--fc-text-value)",
            textShadow: "var(--fc-text-shadow-ink)",
            fontVariantNumeric: "tabular-nums"
          }}
        >
          {value}
        </span>
      </div>
      <IconButton glyph="＋" size={44} disabled={disabled || max} onClick={onIncrease} label="Aumentar aposta" />
    </div>
  );
}
