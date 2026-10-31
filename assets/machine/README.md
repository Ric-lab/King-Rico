# Peças da máquina Circus

Seis imagens independentes geradas com GPT Image, com transparência; não são
recortes de uma máquina única. Base fiel à área anterior da aposta, visor de
prêmio discreto, vidro da carga e três superfícies dos rolos.

`ui/park/cabinet.css` posiciona cada peça e normaliza suas margens transparentes.
A primeira/terceira linha recebe uma rotação suave em perspectiva; a linha do
meio permanece plana. As imagens não contêm símbolos, números ou controles.
O preenchimento das barras continua animado pelo pulso real do Circus.

Os arquivos WebP preservam as dimensões e os pixels das gerações PNG; a exportação
só comprime o formato. Os limites abaixo definem a área útil em pixels da fonte.
Fragmentos fora dessa área ficam ocultos pela caixa do componente.

| Peça | Fonte (px) | Área útil x, y, largura, altura |
|---|---|---|
| `base-v1.webp` | 2084 × 755 | 17, 199, 2050, 322 |
| `gauge-v1.webp` | 911 × 1727 | 334, 13, 243, 1691 |
| `prize-v1.webp` | 2172 × 724 | 96, 121, 1980, 474 |
| `reel-top-v1.webp` | 1230 × 1278 | 29, 51, 1170, 1148 |
| `reel-middle-v1.webp` | 1230 × 1278 | 176, 180, 878, 940 |
| `reel-bottom-v1.webp` | 1231 × 1278 | 137, 95, 956, 1086 |
