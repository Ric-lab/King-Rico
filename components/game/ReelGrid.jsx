import React from "react";
import { ReelCell } from "./ReelCell.jsx";

export function ReelGrid({
  cells = [],
  cellSize = 117,
  gap = 3,
  assetBase = "",
  paylines = []
}) {
  return (
    <div
      style={{
        position: "relative",
        display: "inline-grid",
        gridTemplateColumns: `repeat(3, ${cellSize}px)`,
        gap,
        padding: gap + 3,
        borderRadius: "var(--fc-radius-md)",
        background: "var(--fc-grad-gold)",
        boxShadow: "var(--fc-bevel-up), var(--fc-shadow-panel)"
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const c = cells[i] || {};
        return (
          <ReelCell
            key={i}
            symbol={c.symbol || "blank"}
            state={c.state || "idle"}
            size={cellSize}
            assetBase={assetBase}
          />
        );
      })}
      {paylines.map((row) => (
        <div
          key={row}
          style={{
            position: "absolute",
            left: gap + 3,
            right: gap + 3,
            top: gap + 3 + row * (Math.round(cellSize * 0.974) + gap) + Math.round(cellSize * 0.974) / 2 - 2,
            height: 5,
            borderRadius: 3,
            background: "linear-gradient(90deg, rgba(255,214,90,0), #fff3b0, rgba(255,214,90,0))",
            boxShadow: "0 0 12px 3px rgba(255,200,60,.9)",
            animation: "fcLine var(--fc-dur-line) var(--fc-ease-out) forwards",
            pointerEvents: "none"
          }}
        />
      ))}
    </div>
  );
}
