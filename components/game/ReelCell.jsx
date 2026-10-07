import React from "react";

// Frame order in assets/symbols-v6.png: 11 frames of 512×512 (124 units ≈ 4.1x),
// each symbol already centered as it sits in the Canva stage. Do not reorder.
export const SYMBOLS = [
  "curtain", "drum", "tent", "candy", "clover",
  "scepter", "coin", "crown", "gem", "wild", "blank"
];

const STATE_ANIM = {
  spinning: "fcBlur .16s linear infinite",
  drop: "fcDrop var(--fc-dur-drop) var(--fc-ease-out) 1",
  idle: "none", win: "none", lock: "none", antic: "none", dim: "none"
};

export function ReelCell({
  symbol = "blank",
  state = "idle",
  width = 126.5,
  height = 127.5,
  size,
  face = true,
  assetBase = "",
  onClick
}) {
  const w = size || width;
  const h = size ? size * (127.5 / 126.5) : height;
  const k = Math.min(w / 126.5, h / 127.5);
  const frame = 124 * k;
  const index = Math.max(0, SYMBOLS.indexOf(symbol));
  const overlay =
    state === "win" ? "fcWin .7s var(--fc-ease-inout) infinite"
      : state === "lock" ? "fcLock 1s var(--fc-ease-inout) infinite"
        : state === "antic" ? "fcAntic .45s var(--fc-ease-inout) infinite"
          : null;

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative", width: w, height: h, flex: "0 0 auto",
        borderRadius: "var(--fc-radius-cell)", overflow: "hidden",
        background: face ? "var(--fc-grad-reel-face)" : "transparent",
        boxShadow: face ? "var(--fc-reel-face-shadow)" : "none",
        cursor: onClick ? "pointer" : "default"
      }}
    >
      {symbol !== "blank" && (
        <div
          style={{
            position: "absolute", left: "50%", top: "50%",
            width: frame, height: frame, marginLeft: -frame / 2, marginTop: -frame / 2,
            backgroundImage: `url("${assetBase}assets/symbols-v6.png")`,
            backgroundSize: "1100% 100%",
            backgroundPositionX: `${index * 10}%`,
            backgroundRepeat: "no-repeat",
            opacity: state === "dim" ? 0.42 : 1,
            animation: STATE_ANIM[state] || "none"
          }}
        />
      )}
      {overlay && (
        <div style={{ position: "absolute", inset: 0, borderRadius: "var(--fc-radius-cell)", animation: overlay, pointerEvents: "none" }} />
      )}
    </div>
  );
}
