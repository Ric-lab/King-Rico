import * as React from "react";

/**
 * A folha escura do jogo: gradiente roxo, borda dourada de 2px, canto 18.
 * O corpo não tem padding — cada seção controla o seu, como no jogo.
 * @startingPoint section="Core" subtitle="Folha de menu roxa com borda dourada" viewport="700x420"
 */
export interface PanelProps {
  title?: string;
  /** Mostra o ✕ dourado no cabeçalho. */
  onClose?: () => void;
  width?: number | string;
  children?: React.ReactNode;
}

export declare function Panel(props: PanelProps): JSX.Element;
