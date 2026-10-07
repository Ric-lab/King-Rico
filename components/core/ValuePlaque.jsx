import React from "react";

const TONES = {
  win: "var(--fc-win)",
  gold: "var(--fc-gold-500)",
  cream: "var(--fc-cream-100)"
};

export function ValuePlaque({
  value,
  label,
  tone = "gold",
  size = "var(--fc-size-title)",
  width,
  pulse = false
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        minWidth: width,
        padding: "6px 18px",
        background: "linear-gradient(180deg, #4b0f12 0%, #2a0616 100%)",
        border: "var(--fc-border-hairline) solid var(--fc-gold-600)",
        borderRadius: "var(--fc-radius-pill)",
        boxShadow: "var(--fc-bevel-down), 0 0 0 1px rgba(255,229,138,.35)"
      }}
    >
      {label && (
        <span
          style={{
            font: "var(--fc-weight-bold) var(--fc-size-caption)/1 var(--fc-font-ui)",
            letterSpacing: "var(--fc-tracking-label)",
            textTransform: "uppercase",
            color: "var(--fc-gold-200)",
            opacity: 0.8
          }}
        >
          {label}
        </span>
      )}
      <span
        style={{
          font: `var(--fc-weight-black) ${size}/1 var(--fc-font-numeric)`,
          color: TONES[tone] || TONES.gold,
          textShadow: tone === "win" ? "var(--fc-text-shadow-win)" : "var(--fc-text-shadow-ink)",
          fontVariantNumeric: "tabular-nums",
          animation: pulse ? "fcBeat .45s var(--fc-ease-inout) 3" : "none"
        }}
      >
        {value}
      </span>
    </div>
  );
}
