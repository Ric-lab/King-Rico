# Peças da máquina Circus

Cinco imagens independentes geradas com GPT Image: base dos controles, moldura
da carga, visor do prêmio, superfície do rolo e moldura da janela. A máquina é
montada em camadas; os símbolos e os controles continuam independentes.

Cada um dos três rolos usa uma superfície contínua, sem emendas horizontais ou
molduras entre as linhas. As colunas têm a mesma largura. A primeira e a terceira
linha recebem perspectiva suave; o centro permanece plano. A moldura externa
usa nove fatias para manter o dourado fino, sem esticar seus cantos. Dois filetes
separam as colunas. O giro conserva a sequência, as notas e os efeitos nativos;
a sombra por célula foi substituída pela profundidade contínua da superfície.

A base é somente uma placa retangular de cantos arredondados. Os terminais da
carga são discretos e terminam acima dos botões; a janela vazia permanece branca.
O preenchimento usa 283 px e continua sincronizado com o pulso.

Os WebP preservam as dimensões das gerações PNG. A conversão só comprime o formato;
`ui/park/cabinet.css` normaliza as margens transparentes sem repintar as imagens.
Arquivos de versões anteriores são preservados, mas não entram na pré-carga atual.

| Peça em uso | Fonte (px) | Área útil x, y, largura, altura |
|---|---|---|
| `base-v2.webp` | 2084 × 754 | 40, 231, 2004, 275 |
| `gauge-v2.webp` | 911 × 1727 | 351, 12, 210, 1704 |
| `prize-v2.webp` | 2172 × 724 | 42, 107, 2089, 498 |
| `reel-paper-v2.webp` | 848 × 1855 | 71, 55, 706, 1740 |
| `reel-frame-v1.webp` | 1217 × 1293 | 25, 34, 1166, 1219 |

O visor do prêmio é maior e cobre a parte inferior do King Rico; há espaço livre entre o visor e a máquina. Os realces por
símbolo são halos elípticos; o banho dourado e o pulso escuro seguem a máscara
de cada rolo, sem pintar os cantos da janela ou os espaços entre colunas.

O visor tem 56 px de altura e apenas borda dourada. Cada coluna compartilha a
fase, a desaceleração e a parada dos seus símbolos. As três colunas param da
esquerda para a direita; bônus preservam posições já travadas. O resultado
confirmado, as linhas pagas e o crédito não dependem dessa apresentação.

A janela usa altura intermediária de 320 px e volta a mostrar as nove posições
inteiras. O ajuste da largura dos sprites mantém suas proporções; coordenadas
internas da fita e das paradas permanecem iguais. Moldura, controles, barras e
origens dos efeitos acompanham a nova altura. A carga usa 283 px de líquido.

As bases das barras encostam na área dos controles. As roletas pequena e grande
compartilham a paleta em `ui/park/wheel-palette.js`, sem alterar multiplicadores.

## Estado publicado — 01/11/2026

A prévia v43 foi integrada ao cliente nativo e publicada no commit
[`a738f8a`](https://github.com/Ric-lab/King-Rico/commit/a738f8af50602e7c855d55d83f8a6f9f1d5fff4f),
com [workflow concluído](https://github.com/Ric-lab/King-Rico/actions/runs/41357801533).
O site oficial foi conferido contra o build de produção; 13 arquivos afetados,
incluindo configuração Firebase, HTML, bundle e assets, coincidiram.

| Camada atual | Fonte |
|---|---|
| Face azul do spin e aro fixo fosco | `spin-front-blue-v1.svg`, `spin-rim-matte-v1.svg` |
| Faces de auto e turbo | `auto-socket-face-v6.svg`, `turbo-socket-face-v6.svg` |
| Encaixes fixos e barra | `auto-socket-rim-v3.svg`, `turbo-socket-rim-v3.svg`, `base-controls-v4.svg` |
| Contador de ingressos e símbolo | `ticket-wallet-v2.webp`, `ticket-symbol-v1.webp` |
| Rolos e moldura | `reel-paper-v2.webp`, `reel-frame-v1.webp` |
| Visor e barras | `prize-v2.webp`, `gauge-v2.webp` |
| Geometria e clique | `ui/park/cabinet.css`, `ui/park/spin-tactility.js` |
| Fita contínua e paleta da roleta | `ui/park/reel-tape.js`, `ui/park/wheel-palette.js` |

Spin: 373 × 88, x = 40, topo efetivo 667 e base 755 na cena 453 × 802.
Face rígida com curso de 3 px, pressão de 34 ms e retorno de 160 ms; aro e alvo
fixos. Auto/turbo também usam translação. A pintura é reproduzida por
`scripts/export-tactile-buttons.mjs`. Não restaurar relevo de 10/14/18 px,
faces verdes ou deformações de tentativas anteriores.

A publicação usa Google e Firestore reais. Testes locais cobriram código,
regras/transações e navegador emulado, inclusive retomada da roleta, crédito
único, Fingo rápido e assets dos demais jogos. A carteira fictícia do servidor
de prévia não foi incorporada ao site oficial.

## Histórico de experimentação

As seções seguintes descrevem cada tentativa **na época da prévia**. Frases como
“somente na prévia” são registros daquele momento; não definem o estado atual.
Versões intermediárias rejeitadas não devem ser reaplicadas como especificação.
Use a tabela acima, o CSS e o manifesto para identificar as peças atuais.

## Acabamento da prévia privada — 01/11/2026

- `auto-v1.webp` e `turbo-v1.webp`: botões isolados de 256 × 256, com alpha,
  recriados a partir do estilo dos botões originais. Não recortam mais o palco.
- `ticket-wallet-v1.webp` e `ticket-symbol-v1.webp`: ingresso de 560 × 264,
  respectivamente com espaço para o contador e com estrela central para os rolos.
  Os quatro exports vêm da geração GPT Image
  `exec-394f3fba-47a1-466e-853a-632997b91c4f.png`; limites de exportação foram
  conferidos no alpha, sem repintar as peças.
- `gauge-shade-mask.webp`: alpha real da moldura da barra, excluindo o vidro.
  O escurecimento não cobre céu ou áreas transparentes. Símbolos não premiados
  usam redução de luminosidade, preservando sua opacidade e silhueta.
- O plano numérico continua 3 × 3, mas a apresentação usa três fitas contínuas
  em `ui/park/reel-tape.js`. Cada índice guarda o mesmo símbolo durante todo o
  percurso. O passo é de 128 px; os três símbolos já confirmados ficam adjacentes
  antes do primeiro frame. Um único relógio e uma parada controlam cada coluna.
  Janelas travadas do bônus permanecem opacas sobre a fita, sem alterar o plano.
- Ingresso e contador Happeach têm a base alinhada ao visor do prêmio. A sombra
  externa da cesta foi removida. KING RICO, auto e turbo deprimem apenas a face
  visual, conservando o alvo de toque e restaurando o estado ao cancelar.

Esta seção documenta a prévia em validação; não comprova publicação no Firebase.

## Camadas de pressão — prévia de 01/11/2026

`scripts/export-button-layers.mjs` gera SVGs com os pixels da arte aprovada
embutidos e recortes complementares. Não redesenha cor, material ou ícones.
`button-round-rim-v1.svg` é o aro comum de auto e turbo; `auto-face-v1.svg` e
`turbo-face-v1.svg` contêm só os miolos. O KING RICO usa `spin-rim-v1.svg` e as
variantes acesa/apagada de `spin-face-*-v1.svg` para preservar a iluminação.

Os aros e as aberturas ficam fixos. Os miolos repousam elevados e afundam dentro
da abertura, com retorno ao soltar ou cancelar. O ingresso lateral tem largura
visual de 98 px (antes 112), conservando a área de toque e a base alinhada.

O escurecimento atual das barras usa o alpha integral de `gauge-v2.webp`, cobrindo
também vidro e líquido. A máscara antiga que excluía o vidro fica preservada como
arte da versão anterior; não é usada no escurecimento atual.

O aro compartilhado atual é `button-round-rim-v2.svg`: ouro liso vetorial, com
bisel contínuo, sem a textura pontilhada da versão anterior. O miolo verde do
KING RICO repousa em −4,5 px e pressiona até +2,5 px, com o aro imóvel. O ingresso
usa a mesma margem externa de 5 px da cesta, mantendo sua largura visual de 98 px.

## Contornos e encaixes — prévia privada v32

O KING RICO usa `spin-*-v2.svg` e `spin-aperture-v2.svg`. O contorno em
`spin-green-contour-v2.json` acompanha a área verde comum às artes acesa e
apagada: a verificação de pixels dourados dentro do miolo passou de 2.874/2.937
para zero. O miolo repousa em −6 px e pressiona até +4 px; aro e abertura ficam
imóveis. `scripts/export-button-layers.mjs` reproduz esses recortes.

Auto e turbo usam `control-panel-rim-v1.svg`, uma moldura compartilhada lisa,
e `auto-panel-face-v1.svg`/`turbo-panel-face-v1.svg`. As peças de 44 × 36 px
encaixam nas pontas da barra, preservando as ações e o miolo móvel.

`ticket-wallet-v2.webp` mantém o estilo do ingresso, com estrela menor e mais
respiro no canhoto. O contador exibe somente o número; a identificação acessível
continua presente. A largura visual e o alinhamento com o prêmio permanecem.

A inspeção no navegador cobriu três larguras, pressão/cancelamento, molduras
fixas, carregamento dos assets e uma rodada com auto e turbo, sem débito repetido.
Estas mudanças pertencem à prévia privada; não alteram a versão oficial.

## Botões integrados e curso maior — prévia privada v33

O usuário rejeitou as peças retangulares da v32. Auto e turbo agora usam pares
`*-end-rim-v1.svg`/`*-end-face-v1.svg`: contornos espelhados acompanham as pontas
arredondadas da barra, com miolo roxo e ícone creme. Medem 52 × 46 px no palco;
os aros continuam fixos e a face se move ao pressionar.

O KING RICO ganhou uma lateral verde contínua atrás da face original. Em repouso
ela fica 18 px acima do encaixe; pressionada vai a +2 px, dobrando o curso de
10 para 20 px. O contorno da arte mantém a face sem pixels dourados. A área
clicável inclui o topo elevado, sem mover o aro ou a âncora do botão.

Verificados no navegador: três larguras, ausência de assets quebrados, pressão e
cancelamento, molduras estáveis e acionamento de auto/turbo com uma única rodada.
Esta revisão atualiza apenas a prévia privada; aprovação visual permanece com o autor.

## Perspectiva e alojamentos — prévia privada v34

O topo verde conserva a arte original, agora em um plano com `rotateX(27deg)` e
perspectiva de 210 px, com a parte traseira visualmente mais estreita. O curso
entre −16 e +2 px é de 18 px. `spin-sidewall-perspective-v1.svg` acompanha o
contorno projetado e sua extrusão, sem deixar uma placa verde plana em volta do
topo. A lateral recolhe ao pressionar; o aro dourado e a área de toque ficam fixos.

`base-controls-v3.svg` substitui a apresentação da barra por uma peça com
alojamentos integrados. Auto/turbo usam `*-socket-face-v2.svg`, as respectivas
máscaras e apenas um lábio interno `*-socket-rim-v2.svg`; não sobrepõem outra
moldura dourada à da barra. Os dois encaixes ficam a 6 px das extremidades e
4 px do alto. Valor da aposta, +/−, ações e estados permanecem preservados.

`scripts/export-cabinet-controls.mjs` gera a barra, os encaixes e a máscara da
lateral usando a mesma geometria. A projeção acompanha os valores do CSS.
Conferidos aparência normal/pressionada, três larguras de tela, encaixes
simétricos, carregamento dos assets, cancelamento e acionamento real por toque.
Uma rodada com auto/turbo confirmou uma operação e o resultado salvo. Apenas
a prévia privada recebe esta alteração; o site oficial permanece intacto.

## Retorno ao spin frontal — prévia privada v35

Feedback do autor: a face anterior à inclinação era melhor; o encaixe de auto e
turbo da v34 foi aceito. O spin volta à arte frontal, sem perspectiva ou redução
do texto, elevado 18 px e pressionando até zero. `spin-sidewall-straight-v2.svg`
acompanha a extrusão vertical; `spin-rim-v3.svg` usa o mesmo contorno da face para
o aro dourado fixo. O exportador mantém as geometrias reproduzíveis.

Auto e turbo preservam barra, alojamentos e posições. Os miolos sobem de −1,2
para −3,2 px, com lateral mais visível e retorno ao cancelar. O play do auto foi
movido 3 px à esquerda em `auto-socket-face-v3.svg`. O turbo não mudou de asset.

Verificados três tamanhos de tela, assets, pressão e cancelamento dos três
botões, estabilidade dos aros e uma rodada com auto/turbo sem operação repetida.
Somente a prévia privada recebe esta revisão.

## Vista superior dos controles — prévia privada v36

O spin conserva a face frontal e o aro da v35; altura e curso caem para 14 px.
A extrusão correspondente é `spin-sidewall-straight-v3.svg`.

Auto e turbo recebem miolos azul-turquesa `*-socket-face-v4.svg`, com bisel em
toda a volta, visto de cima. A pressão deixa de deslocar a imagem verticalmente:
a escala uniforme passa de 1,025 para 0,965, com origem no centro. A sombra é
centrada e os alojamentos continuam imóveis. O play mantém o ajuste de centro.
`base-controls-v4.svg` e `*-socket-rim-v3.svg` adequam apenas o interior dos
alojamentos à cor azul, preservando posições e restante da barra.

Conferidos três tamanhos de tela, os estados pressionado/solto, cancelamento,
assets e uma rodada com auto/turbo. Alteração exclusiva da prévia privada.

## Relevo em todo o contorno e contraste — prévia privada v37

O spin passa a ter aproximadamente 10 px de relevo frontal, 6 px nas laterais
e 2 px atrás, sem perspectiva ou rotação. A face frontal é centralizada com
escala `(0.964, 0.869)` e deslocamento de −6 px; sua lateral usa o contorno da
abertura original. Ao pressionar, a face assenta no aro fixo. A máscara de
extrusão vertical da v36 permanece como histórico, sem uso nesta apresentação.

Auto e turbo agora têm lateral e miolo em camadas separadas. A casca usa o
contorno do alojamento; os miolos `*-socket-face-v5.svg` deixam relevo visível
por toda a volta. Ao apertar, o miolo preenche o alojamento e o bisel recolhe.
O estado apagado fica azul escuro e o aceso turquesa claro, conservando posição,
play centralizado, aro fixo e ações existentes. Revisão apenas na prévia privada.

## Face original e clique frontal — prévia privada v39

A tentativa v38 foi rejeitada pelo autor antes da publicação. A v39 retoma a
face verde inteira e o aro dourado original (`spin-rim-v2.svg`), retirando a peça
verde adicional. A face repousa centralizada, sem perspectiva, compressão do
texto, rotação ou deslocamento vertical. Os arquivos `spin-face-*-v3.svg`
preservam os pixels da arte original e preenchem o encaixe sem margens internas.

Ao pressionar, a face recua 2 px por toda a volta, com escala uniforme de 0,99.
`spin-cavity-front-v1.svg` e `spin-shadow-front-v1.svg` revelam o encaixe e sua
sombra interna. O aro e o alvo de toque ficam fixos. Soltar/cancelar restaura a
face. Formato, cores, iluminação da partida e auto/turbo são preservados.

Conferidos três tamanhos de tela, imagens, alinhamento frontal, pressão,
cancelamento e uma rodada por toque com uma operação e resultado salvo.
Alteração exclusiva da prévia privada; aprovação estética permanece com o autor.

## Botão tátil — prévia privada v40

O autor pediu liberdade para buscar um clique satisfatório, próximo de um botão
mecânico. `spin-raised-v1.webp` e `spin-depressed-v1.webp` são dois estados reais
de volume, gerados com GPT Image a partir da arte verde original. O mestre é
`exec-453cdb98-473b-4c06-b83b-7c5f15e28f40.png`; as duas faixas foram recortadas
e normalizadas ao mesmo encaixe, com alpha, em 1071 × 234. Juntas pesam ~47 KB.
O aro dourado permanece separado e fixo.

`ui/park/spin-tactility.js` controla apenas o retorno visual de 190 ms, com pequena
resposta de mola. Novo toque interrompe esse retorno; movimento reduzido o
desativa. O controlador nativo mantém o acionamento da aposta. O som do spin
tem corpo grave ao apertar e um estalo curto ao soltar, usando o volume existente;
a vibração também segue as preferências atuais. A liberação não repete o som de
apertar na fila da rodada. Auto/turbo e matemática permanecem preservados.

Conferidos três tamanhos, estados das imagens, segurar/cancelar sem aposta,
retorno da mola, som desligado, movimento reduzido e áudio sintetizado sem
amostras inválidas ou saturação. Toque completo confirma uma operação e um par
de sons; toque durante a rodada não repete a aposta. Somente na prévia privada;
a sensação tátil e o resultado estético ainda dependem do teste do autor.

## Peça rígida e iluminação estável — prévia privada v41

Feedback do autor: o efeito macio era interessante, mas a preferência é por um
botão sólido; a iluminação variável parecia falsa. `spin-solid-v1.webp` substitui
a troca entre dois volumes por uma peça de face plana e acabamento acetinado.
O mestre GPT Image é `exec-1beda0fd-7fe3-47ab-9e85-bf3c18ed0683.png`, gerado a
partir do miolo anterior e exportado ao mesmo encaixe de 1071 × 234.

A peça inteira recua uniformemente até escala 0,972 e retorna em 110 ms, sem
deformação, overshoot ou mudança de textura. O verde, o aro dourado e o texto
mantêm a iluminação; foram retirados o brilho que varria as letras, as trocas
de luminosidade do botão e as lâmpadas antigas sobre ele. O pulso e a carga das
barras continuam funcionando. O som tem ataque e cauda mais curtos, de clique
mecânico; volume, vibração e movimento reduzido conservam suas preferências.

Conferidos três tamanhos, imagem única, iluminação/texto constantes, retorno
sem deformação, cancelamento sem aposta e um toque com uma operação e um par
de sons. Áudio renderizado sem saturação e som desligado respeitado. Somente
na prévia privada; a avaliação estética permanece com o autor.

## Clique por deslocamento e família azul — prévia privada v42

O autor pediu pesquisa externa e relatou reflexos artificiais também no aro.
Referências consultadas em 01/11/2026:

- [Josh W. Comeau — Building a Magical 3D Button](https://www.joshwcomeau.com/animation/3d-button/):
  separar face, lateral e sombra e deslocar a face por `transform`; pressão mais
  rápida que retorno. A referência exemplifica 34 ms para pressionar.
- [NN/g — Response Times](https://www.nngroup.com/articles/response-times-3-important-limits/):
  feedback imediato reforça a percepção de manipulação direta.

A adaptação usa curso rígido de 3 px, pressão de 34 ms e retorno de 160 ms,
sem escala, deformação ou overshoot. O alvo e o aro ficam fixos; lateral e sombra
são partes separadas. O comportamento respeita movimento reduzido e as ações
nativas. Auto/turbo também usam deslocamento rígido, preservando seus encaixes.

A escolha de azul é direção visual deste projeto, não uma conclusão científica
das fontes: une os três controles e contrasta com a barra vermelha/dourada.
`scripts/export-tactile-buttons.mjs` compartilha a pintura entre
`spin-front-blue-v1.svg` e `*-socket-face-v6.svg`. `spin-rim-matte-v1.svg` é ouro
fosco com contornos discretos, sem reflexos brancos ou brilho animado.

Conferidos três tamanhos, iluminação constante, curso sem deformação, pressão e
cancelamento dos três controles, preferências de som/movimento e uma rodada
por toque com uma operação e resultado salvo. Alteração apenas na prévia privada;
avaliação estética e tátil continuam com o autor.

## Spin ampliado — prévia privada v43

O botão passa de 357 × 78 para 373 × 88 px, centralizado em x = 226,5.
O topo sobe de 677 para 667 px e a base permanece em 755 px. Os encaixes internos
acompanham a nova altura; cor, clique e som são preservados. Conferidos três
tamanhos de tela, respiro abaixo da barra e pressão/cancelamento. Só na prévia.
