import * as React from "react";

/**
 * Chunky gold-rimmed action button. `cta` is the one green primary per screen.
 * @startingPoint section="Core" subtitle="Primary, gold and ghost pill buttons" viewport="700x160"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** cta = green primary (one per screen), gold = secondary, ghost = tertiary on dark */
  variant?: "cta" | "gold" | "ghost";
  size?: "md" | "lg";
  disabled?: boolean;
  /** Stretch to the container width — used for the spin rail. */
  full?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export declare function Button(props: ButtonProps): JSX.Element;
