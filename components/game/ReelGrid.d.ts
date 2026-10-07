import * as React from "react";

/**
 * The 3×3 gold-framed reel window with its payline sweeps.
 * @startingPoint section="Game" subtitle="3×3 reel window with winning payline" viewport="700x420"
 */
export interface ReelGridCell {
  symbol?: string;
  state?: "idle" | "spinning" | "drop" | "win" | "lock" | "antic" | "dim";
}

export interface ReelGridProps {
  /** Exactly 9 entries, left-to-right then top-to-bottom. */
  cells?: ReelGridCell[];
  cellSize?: number;
  gap?: number;
  assetBase?: string;
  /** Row indices (0–2) that just paid — draws the animated gold sweep. */
  paylines?: number[];
}

export declare function ReelGrid(props: ReelGridProps): JSX.Element;
