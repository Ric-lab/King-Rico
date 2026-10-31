# Fortune Circus — Design System

Fortune Circus é um jogo de caça-níquel mobile (retrato, 453 × 802) com tema de circo,
estrelado por **King Rico**, um elefante violeta coroado de capa vermelha. O produto é um
jogo casual de moedas virtuais em pt-BR: gira, ganha, sobe de nível. Não há dinheiro real,
e a comunicação deixa isso explícito.

Produto atual: Circus e quatro atrações do parque na Home, com conta e saldo
compartilhados; os demais jogos mantêm seus endereços. O site oficial
é https://king-rico.web.app, publicado pelo workflow da main no Firebase Spark.
Veja o catálogo no [README](README.md). O Android disponível é a instalação PWA,
conforme [o guia](docs/INSTALAR-NO-CELULAR.md), sem projeto nativo neste checkout.
Público piloto: **terceira idade**, com prioridade em legibilidade e resposta clara.

A descrição de placa e coordenadas abaixo é referência do **Circus**. Os controles
compartilhados atuais estão em [ui/CONTROLS.md](ui/CONTROLS.md); não aplicar a
geometria antiga do slot como regra para todos os jogos.

A tela de jogo é uma **placa única de arte** 453 × 802 em dois estados — apagada
(`assets/stage-off6.webp`) e acesa (`assets/stage-lit.webp`), 3x — com a UI sobreposta em
coordenadas fixas (travadas em `ui_kits/slot-game/README.md`). Em telas mais altas o palco
continua para cima e para baixo por `assets/bleed/stage-bleed.webp`; a máquina nunca é
esticada nem recomposta em CSS.

## Parque diurno (31/10/2026)

A Home e o Circus usam céu azul, praça dourada e vegetação em um parque ao ar
livre. O cenário é `assets/scenes/circus-daylight-v1.webp`, sem escurecimento ou
desfoque global. A Home usa superfícies creme com texto azul, mantendo os assets
dos jogos. No Circus, as classes `park-machine-plate` e `park-machine-lights`
recortam somente a apresentação: a máquina e o pulso original ficam preservados
e as antigas cortinas deixam de aparecer. Os assets antigos seguem necessários
aos controles e a outras telas.

## Fontes deste design system

Tudo aqui foi extraído de material do autor do jogo. Repositório: **Ric-lab/King-Rico**
(consulte `git log origin/main` para o último commit). Processo de geração de assets e custos: `guidelines/asset-pipeline.md`;
manual completo do projeto: `MANUAL.md`.

- Arte do personagem e da marca enviada em `uploads/` e copiada para `assets/brand/`
  (wordmark, King Rico hero, King Rico sentado, turnaround de 4 vistas, placa do palco).
- Ícones-moeda enviados (`assets/icons/btn-home.png`, `btn-menu.png`).
- **Arte do palco no Canva** — design `DAHVx_wVh7E`
  (https://www.canva.com/design/DAHVx_wVh7E), página 453 × 802. Dela saíram o palco
  (`assets/stage-hd.png`) e as camadas dos símbolos (`assets/symbols-v6.png`,
  `assets/symbols/sym-*.png`). As camadas do Canva são nativas em 1x; as versões 3x foram
  ampliadas (Lanczos) e realçadas com um filtro de borda para arte cartoon — não há fonte
  de maior resolução.
- Símbolos remasterizados (`assets/symbols-v7.webp`, 12 quadros) e modelos 3D (`assets/models/*.glb`)
  gerados com Meshy a partir das artes do Canva; fontes de geração em `assets/meshy/`.
- King Rico animado: 40+ quadros desenhados em `assets/king-rico/fw6/` (registro em `reg.json`).
- Implementação ao vivo: `Fortune Circus.dc.html` e `Home.dc.html` são a **fonte de verdade**
  de cor, tamanho, geometria, tempos e matemática.

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

**Números:** formato pt-BR com ponto de milhar (`8.420`, `1.000`) e vírgula decimal sem zero
inútil (`2,5`, nunca `2,50`). Nunca abreviar (`8.4k`, `1 mil`). Multiplicadores com uma casa:
`x1,0`, `x33,3`. Ganhos com sinal (`+250`).

**Para quem joga:** a pessoa de referência é uma avó de primeira viagem. Prêmio sempre em
**modal** (nunca só um número piscando); bônus semanal da Home é **modal obrigatório** de
coletar; contador da Rodada Especial grande (`GIRO 2 / 5`); nada de balões de fala nem
textos soltos sobre a máquina — o espaço de ganho já mostra o valor.

**Sem emoji.** Nenhum. A alegria vem da arte, não de emoji — a versão `v1 (emoji)` existe
justamente como o antes de um depois.

**Responsabilidade:** onde couber, lembrar que são moedas virtuais
(`Moedas virtuais · sem dinheiro real`), e ser honesto sobre limites do produto
(`Não foi possível confirmar. Tente novamente.`, `Sua partida será retomada.`).
Nunca prometer ganho, sorte ou retorno.

**Exemplos reais:**
- `SALDO 8.420` · `GANHO +250` · `APOSTA 1.000`
- `KING RICO` (barra de giro) · `FORTUNE CIRCUS` (card do jogo na Home) · `Coletar`
- `Suas moedas e seu progresso ficam salvos na sua conta.`

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
gorda, arredondada, com sombra de texto escura. **Rammetto One** (`--fc-font-brand`) só em
títulos de marca com poucas letras (KING RICO, FORTUNE CIRCUS), grande, com degradê dourado e
contorno grosso. **Luckiest Guy** em letreiros de celebração. Nunito (400/700) só em copy longa.
Todas locais em `assets/fonts/` (exceto Nunito). Entrelinha 1 em números e rótulos, 1.45 em corpo.
Números sempre `tabular-nums`. Nada abaixo de 19px nos números do quadro. A placa do saldo deve acomodar até 100.000.000,65 sem diminuir a fonte; rótulos em caixa alta com tracking 1.2px.

**Fundos.** No jogo, o palco é a própria placa + sangria (`stage-bleed.webp`), com o topo limpo
para o King Rico e a cesta. Home e carregamento: gradiente radial roxo (`--fc-bg-app`) com
raios dourados suaves. A nuvem colorida atrás do King Rico é **2D** (gás/fumaça não vira 3D).
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

**Luz é o feedback (regra atual).** Em repouso a máquina inteira fica **apagada** (meia-luz:
moldura, lâmpadas, rolos, aro do botão, anéis de turbo/auto). O toque **acende**: o botão de
giro passa de verde escuro para verde claro com luz "atrás do vidro" das letras KING RICO,
a borda dourada acende, e um pulso de energia corre pela moldura. Turbo/auto acendem quando
ligados. Ao terminar, **tudo apaga no mesmo quadro** — nunca em cascata de cima para baixo.
A luz entra em ~30ms; o botão fica aceso e sem aceitar toque até o saldo terminar de contar.
Todo toque real toca o "tec" e o giro espera **280ms** para o som respirar. Na Rodada
Especial o botão acende/apaga só como efeito (o Happeach "aperta"), sem tec e sem aceitar toque.
Home/menu afundam suave na arte (`brightness(.84)`). Ver `guidelines/game-lights.card.html`.
Só botões CSS fora da arte encolhem para 0.88–0.9. Desabilitado = opacidade 0.45; jamais remover o botão da tela.

**Animação.** Presses são rápidos e secos; celebração e queda de símbolo dão overshoot e
assentam (`fcDrop`, `fcPop`, `fcBeat`). Rolos partem juntos com curva lenta → rápida →
lenta e param escalonados (C1 por último, às vezes um "tiquinho a mais"). Sequência de prêmio,
sempre com uma pausa curta entre etapas e **sem poder ser interrompida**: modal de ganho →
linha premiada piscando → moedas 3D saem do centro da linha e voam ao saldo → linha some.
Happeach: espera todos os rolos pararem → dança → voa para a cesta (`guidelines/game-happeach.card.html`).
King Rico: quadros desenhados em crossfade, sem mudar de tamanho, sempre atrás da máquina
(`guidelines/brand-king-rico-anim.card.html`). Menu aberto **pausa** tudo.

**Jogo e matemática.** 3 × 3, 5 linhas, apostas 1 → 1.000. Tabela (multiplicador por linha):
Bumbo 1,0 · Circo 2,5 · Trevo 5,0 · Nuvem 7,5 · Capa 10,0 · Cetro 12,5 · Moeda 15,0 · Coroa 17,5 ·
Diamante 20,0 · King Rico (coringa) 33,3. Happeach não paga: máx. 2 por jogada, 5 na cesta =
Rodada Especial de 5 giros; o excedente já conta. Tabela na tela: título 24px, multiplicadores 28px, símbolos 50px, regras 17px e botão FECHAR grande — nada abaixo de 17px em telas de leitura. RTP teórico 98%, incluindo a especial; referência em `docs/ECONOMIA.md`. O saldo oscila; não há prazo garantido para zerar. Ver `guidelines/game-paytable.card.html`.

**Layout.** Coluna única, ancorada: cabeçalho em cima, ação em baixo, rolos ao centro; nada
rola. O trilho de aposta fica sempre imediatamente acima da barra de giro. Alvo de toque
mínimo 44px (`--fc-hit-min`) — os botões-moeda usam 44–56px.

**Cards.** Não existem "cards" no sentido web. Existem **placas** (número em fundo escuro
com aro dourado) e **painéis** (superfície creme com borda `--fc-cream-300` e sombra).

## ICONOGRAPHY

O jogo não usa biblioteca de ícones, fonte de ícones nem SVG. O sistema de ícones é
**arte rasterizada em formato de moeda dourada**:

- `assets/icons/btn-home.png` e `assets/icons/btn-menu.png` — as moedas de ícone (Home =
  casinha, Menu). Usadas iguais na Home e no jogo. Nunca redesenhe em SVG.
- Onde não há arte, o ícone é um **glifo tipográfico na face dourada** do `IconButton`:
  `＋`, `−`, `»`, `▶`, `✕`. É uma adição intencional (ver abaixo), não um padrão importado.
- Os 11 símbolos de rolo (`assets/symbols-v7.webp`) são ilustração, não iconografia:
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
- `PressZone`: hotspot que reusa o recorte da arte para afundar o botão pintado (hoje só Home/Menu e +/−; giro/turbo/auto usam luz).
- `LevelSelector` / `LevelRow`: o menu atual usa OFF · 50% · 100% para som e vibração.
- `Switch` / `ToggleRow`: existem na folha de menu de referência
  (`assets/reference/menu-panel.png`), aqui reconstruídos sobre a paleta da marca.

## Índice

| Caminho | O que é |
| --- | --- |
| `Home.dc.html` | Tela inicial real (cards de jogos, saldo, bônus semanal) |
| `Fortune Circus.dc.html` | O jogo real — fonte de verdade de comportamento e matemática |
| `King Rico.dc.html` | Visualizador das animações do King Rico |
| `3D Library.html` | Modelos 3D dos símbolos e personagens |
| `MANUAL.md` | Manual do projeto: lições, pipeline, publicação |
| `styles.css` | Entrada única de CSS — só `@import`s |
| `tokens/` | Fontes, cores, tipo, espaço, efeitos, movimento |
| `components/core/` | `Button`, `IconButton`, `Panel`, `Switch`, `ToggleRow`, `LevelSelector`/`LevelRow`, `ValuePlaque` |
| `components/game/` | `ReelCell`, `ReelGrid`, `BetStepper`, `SpinButton`, `PressZone` |
| `components/brand/` | `Logo`, `Mascot` |
| `ui_kits/slot-game/` | Abre o jogo real + geometria travada e regras de comportamento |
| `guidelines/*.card.html` | Cartões: cores, tipo, espaço, marca, símbolos, luz, Happeach, King Rico, tabela, Home |
| `guidelines/asset-pipeline.md` | Como gerar assets (2D/3D/Meshy), custos e log |
| `guidelines/haptics.md` | Tabela de vibração |
| `assets/stage-off6.webp` / `stage-lit.webp` | Placa da máquina apagada / acesa (3x) |
| `assets/bleed/stage-bleed.webp` | Continuação do palco para telas altas |
| `assets/symbols-v7.webp` | Sprite de 12 quadros (10 símbolos, vazio, Happeach) |
| `assets/spin/` | Botão de giro (base, aceso, aro apagado) |
| `assets/fx/` | Cesta, pêssego, camadas da máquina e do topo |
| `assets/happeach/` | Quadros do Happeach (dança, salto, queda) |
| `assets/king-rico/fw6/` | Quadros do King Rico |
| `assets/models/` | GLB dos símbolos e do King Rico |
| `assets/fonts/` | Baloo 2, Rammetto One, Luckiest Guy |
| `assets/brand/`, `assets/icons/` | Logo, King Rico, moedas de ícone |
| `SKILL.md` | Empacotamento para uso como Agent Skill |
