import * as React from "react";

/** Three-step intensity control: OFF · 50% · 100%. Used for sound effects and vibration. */
export interface LevelSelectorProps {
  /** 0 = OFF, 1 = 50%, 2 = 100%. Default 2. */
  value?: 0 | 1 | 2;
  onChange?: (next: 0 | 1 | 2) => void;
  labels?: [string, string, string];
  /** Accessible name for the group. */
  label?: string;
}

/** A menu row with glyph icon, label and a LevelSelector on the right. */
export interface LevelRowProps {
  /** Typographic glyph (♫, ≈) — never emoji. */
  icon?: React.ReactNode;
  label: string;
  value?: 0 | 1 | 2;
  onChange?: (next: 0 | 1 | 2) => void;
  divider?: boolean;
}

export declare function LevelSelector(props: LevelSelectorProps): JSX.Element;
export declare function LevelRow(props: LevelRowProps): JSX.Element;
