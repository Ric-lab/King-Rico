# UI kit — Fortune Circus (jogo mobile)

Recriação **fiel** da tela real do jogo (`Fortune Circus.dc.html`), não um layout novo.
A arte é uma placa única de 453 × 802 unidades (`assets/stage-hd.png`, entregue em 3x =
1359 × 2406) vinda do Canva, com as faces creme das células já pintadas. A UI são
sobreposições e `PressZone`s nas coordenadas exatas da arte.

| Arquivo | O que é |
| --- | --- |
| `GameScreen.jsx` | Tela de jogo: placa HD + 9 células, saldo, ganho, aposta, PressZones de giro/turbo/auto, hotspots de recarregar/menu, dica |
| `audio.js` | WebAudio sem arquivos: "tec" de aperta/solta, zumbido, notas de parada, arpejo; `setLevel(0/1/2)` e `buzz(padrão, nível)` |
| `MenuSheet.jsx` | Folha de menu: efeitos sonoros e vibração em OFF · 50% · 100%, tabela, progresso, links |
| `PaytableSheet.jsx` | Tabela de pagamentos: 10 símbolos com multiplicador e regras de linha |
| `index.html` | Protótipo clicável, escala para caber na tela |

## Geometria travada pela arte (unidades de 453 × 802)

- **Células** `[left, top, w, h]`:
  colunas `33 / 163 / 289` com larguras `126.5 / 122.5 / 130`;
  linhas `219.5 / 351 / 481` com alturas `127.5 / 126 / 120`.
  Símbolo = quadro de 124 × 124 centrado na célula (`symbols-v6.png`, 11 quadros, `1100% 100%`).
- **Paylines:** `left 33 · width 386`, tops `280.75 / 411.5 / 538.5`.
  Diagonais: `left -34 · top 407.75 · 520 × 5`, `±44.66°`.
- **Saldo** `57, 28 · 88 × 39` (mesma altura e centro da moeda, y = 47.5), fonte 19 → 16.5 → 14px conforme o comprimento, `translateY(.05em)`.
- **Ganho** `164, 180 · 125 × 32`. **Aposta** `150, 612 · 143 × 42`. **−** `98, 611` / **+** `307, 611` (44 × 44).
- **Barra de giro** `55, 693 · 337 × 60.5`, raio **13** (retângulo suave, não pílula).
- **Turbo** `23.5, 613.2 · 37` / **Auto** `391.4, 614.1 · 37` (o anel escuro interno da moeda, não o aro dourado).
- **Recarregar** `340.5, 29.5 · 41` / **Menu** `390.5, 29.5 · 41` (disco inteiro com o aro dourado; centros y = 50). **Dica** `top 770`.

## Comportamento que não é cosmético

- **Afundar é na arte:** a PressZone mostra o mesmo recorte de `stage-hd.png`, desloca 2px (giro) ou 1px (moedas) e escurece — `brightness(.6)` no giro, `.84` nas moedas. Entra em 30ms, volta em 300–350ms.
- **Giro:** "tec" no toque, **280ms** de espera e só então os rolos começam. A barra fica afundada e ignora toques até parar.
- **Home/Menu:** mesma PressZone suave das moedas (afunda 1px, `brightness(.84)`), só enquanto pressionados.
- **Turbo/Auto:** ficam afundados enquanto ligados e continuam clicáveis para desligar. O auto encadeia sem "tec" e sem espera.
- **Giro de verdade:** cada célula troca de símbolo a cada 70ms (`fcBlur` por cima). Parada na ordem `6,3,0,7,4,1,8,5,2`.
- **Placa de ganho vazia sem prêmio**, nunca `0`.
- **Som/vibração em 3 níveis:** som 50% = ganho 0.35; vibração 50% = pulsos pela metade.
