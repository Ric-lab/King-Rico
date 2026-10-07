import React, { useState, useRef } from "react";

// A hotspot that *is* a piece of the stage art: it shows the same crop of
// stage-hd.png that sits under it, so pressing can sink and darken the art
// itself — no drawn button on top. Used for the spin bar and turbo/auto coins.
export function PressZone({
  left, top, width, height,
  radius = "50%",
  strength = "strong",
  sunk = false,
  disabled = false,
  delay = 0,
  onPress,
  onRelease,
  onClick,
  assetBase = "",
  label,
  children
}) {
  const [down, setDown] = useState(false);
  const queued = useRef(false);
  const strong = strength === "strong";
  const on = down || sunk;
  const offset = strong ? 2 : 1;
  const locked = disabled || (sunk && !down);

  const press = () => { if (locked) return; setDown(true); onPress && onPress(); };
  const release = () => { if (!down) return; setDown(false); onRelease && onRelease(); };
  const click = () => {
    if (locked || queued.current || !onClick) return;
    if (!delay) return onClick();
    queued.current = true;
    setTimeout(() => { queued.current = false; onClick(); }, delay);
  };

  return (
    <div
      role="button"
      aria-label={label}
      aria-pressed={sunk}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onClick={click}
      style={{
        position: "absolute", left, top, width, height,
        borderRadius: radius, overflow: "hidden",
        cursor: locked ? "default" : "pointer",
        pointerEvents: disabled ? "none" : "auto",
        backgroundColor: strong ? "#04561f" : "transparent",
        backgroundImage: `url("${assetBase}assets/stage-hd.png")`,
        backgroundSize: "var(--fc-frame-w) var(--fc-frame-h)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: `-${left}px -${on ? top - offset : top}px`,
        filter: on ? (strong ? "var(--fc-sink-strong)" : "var(--fc-sink-soft)") : "none",
        boxShadow: on ? (strong ? "var(--fc-sink-shadow-strong)" : "var(--fc-sink-shadow-soft)") : "none",
        transition: on
          ? "filter var(--fc-dur-press-in), box-shadow var(--fc-dur-press-in), background-position var(--fc-dur-press-in)"
          : `filter var(--fc-dur-release) ease, box-shadow var(--fc-dur-release) ease, background-position ${strong ? "180ms" : "150ms"} ease`,
        WebkitTapHighlightColor: "transparent",
        userSelect: "none"
      }}
    >
      {children}
    </div>
  );
}
