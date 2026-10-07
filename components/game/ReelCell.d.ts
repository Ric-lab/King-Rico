import * as React from "react";

/**
 * One cream reel cell holding a symbol, with the game's spin/win/lock states.
 * @startingPoint section="Game" subtitle="Reel cell states — idle, spinning, win, lock, dim" viewport="700x180"
 */
export interface ReelCellProps {
  /** Sprite frame name — game order, most common to wild. */
  symbol?: "curtain" | "drum" | "tent" | "candy" | "clover" | "scepter" | "coin" | "crown" | "gem" | "wild" | "blank";
  /** idle · spinning (blur loop) · drop (landing) · win (gold pulse) · lock (green pulse) · antic (red near-miss) · dim (non-winning) */
  state?: "idle" | "spinning" | "drop" | "win" | "lock" | "antic" | "dim";
  /** Cell box in px. The game uses 126.5/122.5/130 wide × 127.5/126/120 tall. Default 126.5 × 127.5. */
  width?: number;
  height?: number;
  /** Shorthand: square-ish cell of this width (height follows 126.5:127.5). */
  size?: number;
  /** Draw the cream face. Set false when the cell sits on the stage art, which already has it. Default true. */
  face?: boolean;
  assetBase?: string;
  onClick?: () => void;
}

export declare function ReelCell(props: ReelCellProps): JSX.Element;
export declare const SYMBOLS: string[];
