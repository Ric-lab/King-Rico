# Fortune Circus — Design System

Fortune Circus é um jogo de caça-níquel mobile (retrato, 453 × 802) com tema de circo,
estrelado por **King Rico**, um elefante violeta coroado de capa vermelha. O produto é um
jogo casual de moedas virtuais em pt-BR: gira, ganha, sobe de nível. Não há dinheiro real,
e a comunicação deixa isso explícito.

Hoje existe **um único produto**: o jogo mobile (tela de jogo, folha de menu, tabela de
pagamentos). Não há site, painel administrativo nem app de loja neste material.

A tela de jogo é uma **placa única de arte** (`assets/stage-hd.png`, 453 × 802 unidades,
entregue em 3x) com a UI sobreposta em coordenadas fixas. O layout não é recomposto em CSS —
a arte manda, e as coordenadas estão travadas em `ui_kits/slot-game/README.md`.
Na tela, o quadro escala para caber (sem barras vazias: no celular preenche a largura; em
telas grandes aparece com cantos de 20px sobre uma cópia desfocada da própria arte).

## Fontes deste design system

Tudo aqui foi extraído de material fornecido pelo autor do jogo dentro deste projeto —
não há repositório Git, arquivo Figma ou base de código externa associada.

- Arte do personagem e da marca enviada em `uploads/` e copiada para `assets/brand/`
  (wordmark, King Rico hero, King Rico sentado, **vista anatômica / turnaround de 4 vistas**,
  placa do palco de circo).
- Ícones-moeda enviados (`assets/icons/btn-home.png`, `btn-menu.png`).
- **Arte do palco no Canva** — design `DAHVx_wVh7E`
  (https://www.canva.com/design/DAHVx_wVh7E), página 453 × 802. Dela saíram o palco
  (`assets/stage-hd.png`) e as camadas dos símbolos (`assets/symbols-v6.png`,
  `assets/symbols/sym-*.png`). As camadas do Canva são nativas em 1x; as versões 3x foram
  ampliadas (Lanczos) e realçadas com um filtro de borda para arte cartoon — não há fonte
  de maior resolução.
- Implementação ao vivo do jogo: `Fortune Circus.dc.html` (e as versões `v1 (emoji)`,
  `v2 (arte antiga)`, além de `Fortune Circus (offline).html`). Foi dela que saíram os
  valores exatos de cor, tamanho, geometria de rolo e animações.
- Referências de tela em `assets/reference/` (tela de jogo v1 e folha de menu).

## CONTENT FUNDAMENTALS

**Idioma:** pt-BR, sempre. Nomes próprios ficam em inglês porque são marca — *Fortune Circus*,
*King Rico*.

**Tom:** locutor de circo, não cassino. Animado, curto, direto ao jogador. Fala com o
jogador por **você**, nunca "nós" nem primeira pessoa do jogo.

**Casing:** botões e rótulos de medidor em CAIXA ALTA curta (`APOSTA`, `SALDO`, `GANHO`,
`MAX`, `OFF`). Títulos de painel em Sentence case (`Menu`, `Seu progresso`). Corpo em frase
normal, com ponto final.

**Tamanho:** rótulo = 1 palavra; botão = 1–3 palavras (`Jogar`, `Comprar moedas`);
parágrafo = no máximo duas frases.

**Números:** formato pt-BR com ponto de milhar (`8.420`, `1.000`). Ganhos sempre com sinal
(`+250`). Nunca abreviar para `8.4k`.

**Sem emoji.** Nenhum. A alegria vem da arte, não de emoji — a versão `v1 (emoji)` existe
justamente como o antes de um depois.

**Responsabilidade:** onde couber, lembrar que são moedas virtuais
(`Moedas virtuais · sem dinheiro real`), e ser honesto sobre limites do produto
(`A cartela em andamento não é salva.`, `Backup Google indisponível nesta versão.`).
Nunca prometer ganho, sorte ou retorno.

**Exemplos reais:**
- `SALDO 8.420` · `GANHO +250` · `APOSTA 1.000`
- `KING RICO` (barra de giro) · `Jogar` · `Comprar moedas`
- `Moedas e níveis são salvos automaticamente neste aparelho.`

## VISUAL FOUNDATIONS

**Paleta.** Três famílias fazem 90% da tela: **roxo** (fundo, palco, moldura),
**vermelho de cortina** (lona, bandeirolas, placas) e **ouro** (toda borda, aro, lâmpada e
número). Creme é a única superfície clara — face de rolo e painel de configurações. Verde
aparece só em dois lugares: vitória e a barra de giro. Máximo de duas cores de fundo por
tela (roxo + a placa fotográfica do palco). Ver `tokens/colors.css`.

**Áudio e vibração.** São parte da experiência, não enfeite. Três níveis cada:
OFF · 50% · 100% (`LevelSelector`). Som 50% = ganho mestre 0.35 (percebido como metade);
vibração 50% = pulsos pela metade (navegadores só controlam duração, não força). O "tec"
do botão fica bem abaixo do zumbido do giro — nunca mais alto que o jogo.

**Tipografia.** Baloo 2 (800/700) carrega tudo que é jogo: números, rótulos, botões —
gorda, arredondada, com sombra de texto escura. Nunito (400/700) só em copy longa
(configurações, progresso, textos legais). Entrelinha 1 em números e rótulos, 1.45 em corpo.
Números sempre `tabular-nums`. Nada abaixo de 19px nos números do quadro (saldo encolhe até 14px só quando o valor é longo); rótulos em caixa alta com tracking 1.2px.

**Fundos.** Duas opções: a placa fotográfica do circo (`bg-circus-stage.png`) em tela cheia
para splash e momentos de celebração; e o gradiente radial roxo (`--fc-bg-app`) para o resto.
Sem padrões repetidos, sem textura de grão, sem ilustração desenhada à mão em CSS — toda
imagem é arte renderizada em 3D, quente, saturada, com luz de palco.

**Nada é plano.** Todo elemento metálico é gradiente vertical + aro claro em cima
(`inset 0 2px 0 rgba(255,255,255,.55)`) + aresta escura embaixo
(`inset 0 -3px 0 rgba(0,0,0,.32)`), quase sempre com borda de 2–3px em `--fc-gold-600`.
Superfícies afundadas (trilho de aposta, placa de número) invertem: `--fc-bevel-down`.

**Cantos.** Célula de rolo 6px, botão pequeno 10px, barra de giro 13px, painel 14px,
quadro do jogo 20px, botões de texto e trilhos = pílula (999px). Não existe canto reto no produto.

**Sombras.** Externas: `--fc-shadow-button` (4px sólido + difusa) em botões,
`--fc-shadow-panel` em painéis, `--fc-shadow-frame` no quadro do jogo. Internas: bisel.
Glows são estados, não decoração: ouro = vitória, verde = símbolo travado, vermelho =
quase-ganho, e eles pulsam em loop enquanto o estado dura.

**Transparência e blur.** Quase inexistentes. Só dois usos: o véu
`rgba(12,2,24,.62)` atrás de um painel modal, e o `blur(2px)` do rolo girando. Nunca
glassmorphism, nunca texto em opacidade reduzida (contraste vem de cor cheia).

**Hover / press.** Hover = `brightness(1.06–1.1)`, nunca mudança de cor. Botões que fazem
parte da arte (barra de giro, turbo, auto) **afundam na própria arte** (`PressZone`): o
recorte desce 2px (giro) ou 1px (moedas) e escurece — `brightness(.6)` no giro,
`brightness(.84)` nas moedas — com sombra interna no topo. O escuro entra em **30ms** e
sai em **300–350ms**: pressionar é instantâneo, soltar é suave. A barra de giro fica
afundada e sem aceitar toque enquanto os rolos giram; turbo/auto ficam afundados enquanto
ligados. Todo press toca o "tec" (aperta grave, solta agudo) e o giro espera **280ms**
depois do clique para o som respirar. Home/menu também afundam na arte (suave, como as moedas).
Só botões CSS fora da arte encolhem para 0.88–0.9. Desabilitado = opacidade 0.45; jamais remover o botão da tela.

**Animação.** Presses são rápidos e secos; celebração e queda de símbolo dão overshoot e
assentam (`fcDrop`, `fcPop`, `fcBeat`). Linhas de pagamento varrem em 1.6s e desaparecem
sozinhas. O brilho diagonal (`fcShine`) corre na barra de giro só enquanto ela é clicável.
Única animação linear do sistema é o blur do rolo girando. Tudo em `tokens/motion.css`.

**Layout.** Coluna única, ancorada: cabeçalho em cima, ação em baixo, rolos ao centro; nada
rola. O trilho de aposta fica sempre imediatamente acima da barra de giro. Alvo de toque
mínimo 44px (`--fc-hit-min`) — os botões-moeda usam 44–56px.

**Cards.** Não existem "cards" no sentido web. Existem **placas** (número em fundo escuro
com aro dourado) e **painéis** (superfície creme com borda `--fc-cream-300` e sombra).

## ICONOGRAPHY

O jogo não usa biblioteca de ícones, fonte de ícones nem SVG. O sistema de ícones é
**arte rasterizada em formato de moeda dourada**:

- `assets/icons/btn-home.png` e `assets/icons/btn-menu.png` — as duas únicas moedas de
  ícone que existem como arte. Use-as como imagem, nunca redesenhe em SVG.
- Onde não há arte, o ícone é um **glifo tipográfico na face dourada** do `IconButton`:
  `＋`, `−`, `»`, `▶`, `✕`. É uma adição intencional (ver abaixo), não um padrão importado.
- Os 10 símbolos de rolo (`assets/symbols/sym-*.png`) são ilustração, não iconografia:
  nunca reduza um símbolo a ícone de interface nem o recolora.
- Emoji nunca são usados como ícone. Unicode só nos glifos listados acima.

**Precisa de um ícone novo?** Peça arte no mesmo estilo (moeda dourada com face creme e
glifo laranja/marrom, luz no topo). Não improvise em SVG — destoa na hora.

## Substituições sinalizadas

- **Fonte.** Não recebi arquivo de fonte. O wordmark é arte com letreiro serifado de circo
  próprio; a UI ao vivo já usava **Baloo 2** (Google Fonts), então adotei Baloo 2 como fonte
  de display/UI e **Nunito** como companheira para texto longo. Se existir uma fonte
  licenciada da marca, me mande os arquivos que eu troco os `@font-face`.
- **Logo.** Existe como arte (`assets/brand/logo-fortune-circus.png`) e é sempre usado como
  imagem — nunca foi redesenhado nem redigitado.

## Adições intencionais

- `IconButton` com `glyph`: a fonte só tem duas moedas de ícone em PNG, mas a UI precisa de
  `+`, `−` e turbo. O componente reproduz a moeda em CSS e recebe um caractere.
- `ValuePlaque`: a placa de número aparece três vezes na arte do jogo (saldo, ganho, aposta)
  sem existir como componente no código atual; foi extraída para não ser recriada à mão.
- `PressZone`: padrão do jogo atual — hotspot que reusa o recorte da arte para afundar/escurecer o botão pintado.
- `LevelSelector` / `LevelRow`: o menu atual usa OFF · 50% · 100% para som e vibração.
- `Switch` / `ToggleRow`: existem na folha de menu de referência
  (`assets/reference/menu-panel.png`), aqui reconstruídos sobre a paleta da marca.

## Índice

| Caminho | O que é |
| --- | --- |
| `styles.css` | Entrada única de CSS — só `@import`s |
| `tokens/fonts.css` | Webfonts (Baloo 2, Nunito) |
| `tokens/colors.css` | Rampas + aliases semânticos |
| `tokens/typography.css` | Famílias, pesos, escala, tracking |
| `tokens/spacing.css` | Escala 4px, raios, geometria do jogo |
| `tokens/effects.css` | Gradientes metálicos, biséis, aros, glows, sombras de texto |
| `tokens/motion.css` | Durações, easings e todos os `@keyframes` do jogo |
| `components/core/` | `Button`, `IconButton`, `Panel`, `Switch`, `ToggleRow`, `LevelSelector`/`LevelRow`, `ValuePlaque` |
| `components/game/` | `ReelCell`, `ReelGrid`, `BetStepper`, `SpinButton`, `PressZone` |
| `Fortune Circus.dc.html` | O jogo real, jogável — fonte de verdade de comportamento |
| `assets/stage-hd.png` | Placa do palco 3x (1359 × 2406), faces de célula vazias |
| `assets/symbols-v6.png` | Sprite de 11 quadros × 512px (último = vazio), remaster Meshy/GPT Image 2 dos símbolos originais |
| `components/brand/` | `Logo`, `Mascot` |
| `ui_kits/slot-game/` | Recriação fiel da tela real: jogo → menu → tabela de pagamentos |
| `guidelines/*.card.html` | Cartões de fundamentos (cores, tipo, espaço, marca) |
| `assets/brand/` | Wordmark, King Rico (hero, sentado, turnaround), placa de palco |
| `assets/icons/` | Moedas de ícone (home, menu) |
| `assets/symbols/` | 10 símbolos de rolo em 1024 × 1024, transparentes, 86% de preenchimento |
| `assets/reference/` | Capturas do jogo v1 e da folha de menu |
| `SKILL.md` | Empacotamento para uso como Agent Skill |
