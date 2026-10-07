import * as React from "react";

/**
 * The − value + bet rail that sits directly above the spin button.
 * @startingPoint section="Game" subtitle="Bet rail with gold steppers" viewport="700x150"
 */
export interface BetStepperProps {
  value: React.ReactNode;
  label?: string;
  onDecrease?: () => void;
  onIncrease?: () => void;
  /** Locks both steppers — used while the reels are spinning. */
  disabled?: boolean;
  /** At the lowest / highest bet step. */
  min?: boolean;
  max?: boolean;
  width?: number | string;
}

export declare function BetStepper(props: BetStepperProps): JSX.Element;
