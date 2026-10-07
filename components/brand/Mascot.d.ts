import * as React from "react";

/**
 * King Rico, the violet circus elephant. Use the shipped renders only.
 * @startingPoint section="Brand" subtitle="King Rico poses — hero, sitting, turnaround" viewport="700x400"
 */
export interface MascotProps {
  /** hero = full body on the ring podium · sitting = cut-out half body · turnaround = 4-view model sheet */
  pose?: "hero" | "sitting" | "turnaround";
  width?: number | string;
  assetBase?: string;
  /** Slow idle breathing loop. */
  float?: boolean;
  alt?: string;
}

export declare function Mascot(props: MascotProps): JSX.Element;
