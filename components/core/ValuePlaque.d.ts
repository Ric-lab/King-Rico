import * as React from "react";

/**
 * Dark gold-rimmed plaque holding a number — balance, win counter, jackpot.
 * @startingPoint section="Core" subtitle="Balance, win and bet number plaques" viewport="700x150"
 */
export interface ValuePlaqueProps {
  value: React.ReactNode;
  /** Small uppercase caption above the number. */
  label?: string;
  tone?: "win" | "gold" | "cream";
  /** Any CSS font-size; defaults to the title step. */
  size?: string;
  width?: number | string;
  /** Beats three times — use when the number just changed. */
  pulse?: boolean;
}

export declare function ValuePlaque(props: ValuePlaqueProps): JSX.Element;
