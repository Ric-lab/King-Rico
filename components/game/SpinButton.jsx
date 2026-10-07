import React, { useState } from "react";

export function SpinButton({
  label = "King Rico",
  state = "idle",
  onClick,
  onPress,
  delay = 280,
  width = 236,
  height = 56
}) {
  const [down, setDown] = useState(false);
  const [queued, setQueued] = useState(false);
  const spinning = state === "spinning" || queued;
  const disabled = state === "disabled";
  const sunk = down || spinning;
  const locked = spinning || disabled;

  const click = () => {
    if (locked) return;
    if (!delay) return onClick && onClick();
    setQueued(true);
    setTimeout(() => { setQueued(false); onClick && onClick(); }, delay);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={() => { if (!locked) { setDown(true); onPress && onPress(); } }}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      onClick={click}
      style={{
        position: "relative", width, height, overflow: "hidden",
        border: "3px solid var(--fc-gold-600)",
        borderRadius: "var(--fc-radius-spin)",
        background: "var(--fc-grad-cta)",
        boxShadow: sunk
          ? "var(--fc-sink-shadow-strong)"
          : `var(--fc-bevel-up), var(--fc-shadow-button)${state === "ready" ? ", var(--fc-glow-cta)" : ""}`,
        filter: sunk ? "var(--fc-sink-strong)" : "none",
        color: "var(--fc-cream-100)",
        font: "var(--fc-weight-black) var(--fc-size-value)/1 var(--fc-font-display)",
        letterSpacing: "3px", textTransform: "uppercase",
        textShadow: "var(--fc-text-shadow-ink)",
        cursor: locked ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transform: sunk ? "translateY(2px)" : "none",
        transition: sunk
          ? "filter var(--fc-dur-press-in), box-shadow var(--fc-dur-press-in), transform var(--fc-dur-press-in)"
          : "filter var(--fc-dur-release) ease, box-shadow var(--fc-dur-release) ease, transform 180ms ease",
        WebkitTapHighlightColor: "transparent"
      }}
    >
      {label}
      {!sunk && !disabled && (
        <span style={{
          position: "absolute", top: 0, left: 0, width: "35%", height: "100%",
          background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0))",
          animation: "fcShine 2.6s var(--fc-ease-inout) infinite", pointerEvents: "none"
        }} />
      )}
    </button>
  );
}
