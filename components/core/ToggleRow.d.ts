import * as React from "react";

/** Uma linha de ajuste do menu: ícone glifo, rótulo, estado em caixa alta e o Switch. */
export interface ToggleRowProps {
  /** Glifo tipográfico (♫, ≈, ◇) — nunca emoji. */
  icon?: React.ReactNode;
  label: string;
  /** Estado em caixa alta à esquerda do switch: "LIGADO" / "DESLIGADO". */
  hint?: string;
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  /** Linha divisória embaixo — use em todas menos na última. */
  divider?: boolean;
}

export declare function ToggleRow(props: ToggleRowProps): JSX.Element;
