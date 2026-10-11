# UI kit — Fortune Circus (jogo mobile)

O UI kit **é o jogo real**: `index.html` abre `Fortune Circus.dc.html` (e a Home por `Home.dc.html`).
As recriações em JSX da primeira versão (`GameScreen`, `MenuSheet`, `PaytableSheet`, `audio.js`)
foram removidas em out/2026 porque tinham ficado para trás — não existe mais uma segunda cópia
para desatualizar. Para protótipos, copie trechos do jogo real.

A arte é uma placa de 453 × 802 unidades em dois estados: `assets/stage-off6.webp` (apagada,
repouso) e `assets/stage-lit.webp` (acesa, giro), em 3x (1359 × 2406). Em telas mais altas o
palco continua por `assets/bleed/stage-bleed.webp` (parte de cima e de baixo); a máquina
nunca é esticada.

## Geometria travada pela arte (unidades de 453 × 802)

- **Células** colunas `34.3 / 164.3 / 290.3`, larguras `126.5 / 122.5 / 130`;
  linhas `219.5 / 351 / 481`, alturas `127.5 / 126 / 120`. Símbolo = quadro 124 × 124 de
  `symbols-v7.webp` (12 quadros, `1200% 100%`; índice 10 = vazio, 11 = Happeach).
- **5 linhas**: 3 horizontais + 2 diagonais (`LINES` no jogo).
- **Saldo** ao lado da moeda do topo, centralizado na altura da moeda; fonte 19 → 16.5 → 14px conforme o comprimento.
- **Aposta** `150, 612 · 143 × 42`, número descido 2,5px (a fonte desenha acima do centro); **−/+** idem.
- **Botão de giro** `48, 685 · 357 × 78` com recorte próprio (`assets/spin/`).
- **Turbo / Auto** nos discos dos cantos sobre a aposta. **Home / Menu** no topo direito.
- **Cesta do Happeach** no topo direito; na Rodada Especial vai para o centro no lugar do King Rico.

## Comportamento que não é cosmético

- **Luz:** tudo apagado em repouso; no toque acende tudo junto; ao parar apaga **de uma vez**. Ver `guidelines/game-lights.card.html`.
- **Giro:** "tec" no toque, **280ms** e os rolos partem juntos; param escalonados (`6,3,0,7,4,1,8,5,2`), C1 por último, às vezes com um "tiquinho a mais" de suspense (mais marcado no auto).
- **Botão travado** do toque até o saldo terminar de contar — prêmio, dança e voo do Happeach não podem ser interrompidos.
- **Prêmio:** modal de ganho (OK ou girar de novo; no auto fecha sozinho em ~2s) → linha premiada pisca → moedas 3D saem do centro da linha para o saldo → linha some.
- **Happeach:** máx. 2 por jogada, não paga, conta até 5 na cesta; excedente já conta para a próxima.
- **Menu aberto pausa o jogo** inteiro (timers, rolos, efeitos).
- **Som / vibração** em OFF · 50% · 100%. Tabela de vibração em `guidelines/haptics.md`.
- **Placa de ganho vazia sem prêmio**, nunca `0`.
