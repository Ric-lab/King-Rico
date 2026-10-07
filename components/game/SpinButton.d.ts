import * as React from "react";

/**
 * The green "KING RICO" spin bar as a standalone CSS button (for screens without the stage art).
 * On the game stage itself use PressZone over stage-hd.png instead.
 * @startingPoint section="Game" subtitle="Spin bar — ready, pressed/spinning, disabled" viewport="700x170"
 */
export interface SpinButtonProps {
  label?: string;
  /** idle · ready (green glow) · spinning (sunk, dark, ignores taps) · disabled */
  state?: "idle" | "ready" | "spinning" | "disabled";
  onClick?: () => void;
  /** Fires on pointer down — play the click sound here. */
  onPress?: () => void;
  /** ms between click and onClick; the bar stays sunk meanwhile. Default 280. */
  delay?: number;
  width?: number | string;
  height?: number;
}

export declare function SpinButton(props: SpinButtonProps): JSX.Element;
