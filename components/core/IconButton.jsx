import React, { useState } from "react";

const ART = {
  home: "assets/icons/btn-home.png",
  menu: "assets/icons/btn-menu.png"
};

export function IconButton({
  icon,
  glyph,
  size = 56,
  active = false,
  disabled = false,
  assetBase = "",
  label,
  onClick,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const art = icon && ART[icon] ? assetBase + ART[icon] : null;

  return (
    <button
      type="button"
      aria-label={label || icon}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setDown(false); }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      style={{
        width: size,
        height: size,
        minWidth: "var(--fc-hit-min)",
        minHeight: "var(--fc-hit-min)",
        display: "grid",
        placeItems: "center",
        padding: 0,
        border: art ? "none" : "2px solid var(--fc-gold-700)",
        borderRadius: "var(--fc-radius-pill)",
        background: art ? `url("${art}") center/contain no-repeat` : "var(--fc-grad-gold)",
        boxShadow: art
          ? (active ? "var(--fc-glow-gold)" : "none")
          : `var(--fc-bevel-up), var(--fc-shadow-button)${active ? ", var(--fc-glow-gold)" : ""}`,
        color: "var(--fc-ink-700)",
        font: `var(--fc-weight-black) ${Math.round(size * 0.42)}px/1 var(--fc-font-ui)`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        filter: hover && !disabled ? "brightness(1.1)" : "none",
        transform: down && !disabled ? "scale(var(--fc-press-scale))" : "none",
        transition: "transform var(--fc-dur-press) var(--fc-ease-out), filter var(--fc-dur-fast) var(--fc-ease-out)"
      }}
      {...rest}
    >
      {!art && glyph}
    </button>
  );
}
