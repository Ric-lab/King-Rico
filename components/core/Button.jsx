import React, { useState } from "react";

const PADS = { md: "10px 20px", lg: "14px 30px" };
const SIZES = { md: 18, lg: 24 };

const SKINS = {
  cta: {
    background: "var(--fc-grad-cta)",
    color: "var(--fc-cream-100)",
    textShadow: "0 2px 2px rgba(0,0,0,.45)",
    border: "2px solid var(--fc-gold-600)",
    boxShadow: "var(--fc-bevel-up), var(--fc-shadow-button), var(--fc-glow-cta)"
  },
  gold: {
    background: "var(--fc-grad-gold)",
    color: "var(--fc-ink-700)",
    textShadow: "0 1px 0 rgba(255,255,255,.45)",
    border: "2px solid var(--fc-gold-700)",
    boxShadow: "var(--fc-bevel-up), var(--fc-shadow-button)"
  },
  ghost: {
    background: "rgba(255,214,107,.12)",
    color: "var(--fc-gold-300)",
    textShadow: "none",
    border: "2px solid rgba(255,214,107,.5)",
    boxShadow: "none"
  }
};

export function Button({
  children,
  variant = "cta",
  size = "md",
  disabled = false,
  full = false,
  onClick,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const skin = SKINS[variant] || SKINS.cta;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setDown(false); }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      style={{
        ...skin,
        font: `var(--fc-weight-black) ${SIZES[size]}px/1 var(--fc-font-ui)`,
        letterSpacing: "var(--fc-tracking-wide)",
        textTransform: "uppercase",
        padding: PADS[size],
        minHeight: "var(--fc-hit-min)",
        width: full ? "100%" : "auto",
        borderRadius: "var(--fc-radius-pill)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        filter: hover && !disabled ? "brightness(1.08)" : "none",
        transform: down && !disabled ? "translateY(2px) scale(.98)" : "none",
        transition: "transform var(--fc-dur-press) var(--fc-ease-out), filter var(--fc-dur-fast) var(--fc-ease-out)",
        userSelect: "none"
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
