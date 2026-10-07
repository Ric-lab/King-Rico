import * as React from "react";

/**
 * A pressable crop of the stage art: sinks and darkens the painted button itself.
 * Use for every button that is part of the stage art (spin bar, turbo, auto).
 */
export interface PressZoneProps {
  /** Position/size in stage units (453 × 802 frame). Must match the art exactly. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Clip shape. Spin bar: 13 (var(--fc-radius-spin)). Coins: "50%". */
  radius?: number | string;
  /** strong = spin bar (brightness .6, sink 2px). soft = coins (brightness .84, sink 1px). */
  strength?: "strong" | "soft";
  /** Stay sunk: while spinning (spin bar) or while toggled on (turbo/auto). A sunk spin bar ignores taps. */
  sunk?: boolean;
  disabled?: boolean;
  /** ms between the click and onClick. The spin bar uses 280 so the click sound is heard before the reels start. */
  delay?: number;
  /** Fires on pointer down: play the click sound and vibrate here. */
  onPress?: () => void;
  /** Fires on pointer up: play the lighter release click here. */
  onRelease?: () => void;
  onClick?: () => void;
  assetBase?: string;
  label?: string;
  children?: React.ReactNode;
}

export declare function PressZone(props: PressZoneProps): JSX.Element;
