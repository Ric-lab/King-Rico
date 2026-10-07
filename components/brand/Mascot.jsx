import React from "react";

const POSES = {
  hero: "assets/brand/king-rico-hero.png",
  sitting: "assets/brand/king-rico-sitting.png",
  turnaround: "assets/brand/king-rico-turnaround.png"
};

export function Mascot({ pose = "hero", width = 220, assetBase = "", float = false, alt = "King Rico" }) {
  return (
    <img
      src={assetBase + (POSES[pose] || POSES.hero)}
      alt={alt}
      style={{
        width,
        height: "auto",
        display: "block",
        filter: "drop-shadow(0 10px 18px rgba(0,0,0,.45))",
        animation: float ? "fcBeat 3.2s var(--fc-ease-inout) infinite" : "none"
      }}
    />
  );
}
