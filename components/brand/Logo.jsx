import React from "react";

export function Logo({ width = 240, assetBase = "", alt = "Fortune Circus" }) {
  return (
    <img
      src={`${assetBase}assets/brand/logo-fortune-circus.png`}
      alt={alt}
      style={{ width, height: "auto", display: "block", filter: "drop-shadow(0 4px 10px rgba(0,0,0,.45))" }}
    />
  );
}
