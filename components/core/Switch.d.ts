import * as React from "react";

/** Green pill switch used in the settings sheet. */
export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export declare function Switch(props: SwitchProps): JSX.Element;
