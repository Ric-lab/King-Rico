import * as React from "react";

/**
 * Round gold-coin button. Prefer the shipped PNG art (`icon`) over a glyph.
 * @startingPoint section="Core" subtitle="Round gold coin buttons — home, menu, +/−" viewport="700x150"
 */
export interface IconButtonProps {
  /** Shipped coin artwork. Falls back to `glyph` when omitted. */
  icon?: "home" | "menu";
  /** Single character (＋, −, », ▶) rendered on a gold coin face when no `icon` art exists. */
  glyph?: string;
  /** Diameter in px. Never below 44. */
  size?: number;
  /** Adds the gold halo — used for toggled states like turbo spin. */
  active?: boolean;
  disabled?: boolean;
  /** Path prefix to the assets/ folder, relative to the consuming page. */
  assetBase?: string;
  label?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export declare function IconButton(props: IconButtonProps): JSX.Element;
