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

## Versão aprovada — 02/11/2026

A prévia v54 foi aprovada para publicação oficial. Mantém a máquina e a economia
da v43, com spin colorido em camadas de CSS, letras LED, aro
`spin-rim-gold-v2.svg`, curso rígido de 8 unidades (55 ms / 180 ms). A pintura
apaga instantaneamente; o LED em 40 ms e o pulso acende em 420 ms. O Circus é
a Home e `/park` recebe o parque reorganizado. Google e Firestore nativos
continuam no build de produção; a carteira de teste da prévia não é incorporada.

O registro abaixo descreve a publicação anterior, não substitui os parâmetros
atuais. Confirme a entrega desta revisão no workflow associado ao commit.

## Publicação anterior — 01/11/2026

A prévia v43 foi integrada ao cliente nativo e publicada no commit
[`a738f8a`](https://github.com/Ric-lab/King-Rico/commit/a738f8af50602e7c855d55d83f8a6f9f1d5fff4f),
com [workflow concluído](https://github.com/Ric-lab/King-Rico/actions/runs/41357801533).
O site oficial foi conferido contra o build de produção; 13 arquivos afetados,
incluindo configuração Firebase, HTML, bundle e assets, coincidiram.

| Camada da v43 | Fonte |
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
Use a seção de versão aprovada, o CSS e o manifesto para identificar as peças atuais.

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


## Ajuste em prévia v44 — 02/11/2026

Pedido do autor após a publicação: devolver um pouco do brilho dourado ao aro e
acender as letras em amarelo como parte do pulso. `spin-rim-gold-v2.svg` conserva
o contorno e usa um degradê suave de ouro; `export-tactile-buttons.mjs` o reproduz.
A pré-carga aponta para essa versão. O aro fosco anterior fica no histórico.

A classe `.park-spin-label` reage ao `data-rim-off` nativo e ao toque segurado:
creme em repouso, amarelo com halo curto enquanto o pulso está ativo. Não há
relógio separado nem varredura de reflexo. Geometria, alvo, curso rígido e som
permanecem os mesmos. Movimento reduzido desativa a transição de cor.
Validado no navegador em três tamanhos, pressão/cancelamento, giro por toque
com uma única operação, assets e console. Esta seção descreve a prévia; não
altera o registro da publicação anterior.


## Cor da carga nas letras — prévia v45, 02/11/2026

O autor substituiu o amarelo fixo pela cor do líquido que vai cair. O toque e o
início do pulso preparam a cor da próxima carga; a confirmação usa o nível real
da resposta. Letras, halo e vertimento das duas barras compartilham `colorAt`
em `ui/park/motion.js`. A cor fica estável até terminar a carga. Não há outra
paleta ou sorteio, e a mudança não interfere no preenchimento ou na carteira.
Um traço creme de 0,4 unidade mantém o texto legível nas cores azul/violeta.
Repouso continua creme, com o aro dourado da v44 e o mesmo clique rígido.

Validação da v45: quatro cores conferidas em tela; cargas 1 e 7 exercitadas por
toque com coincidência entre letras e líquido nas duas barras, sem troca de cor
ao completar o vertimento. Cancelamento retorna ao creme, um toque gera uma
operação, três tamanhos sem overflow/assets faltantes, console limpo e movimento
reduzido respeitado. Resultado visual permanece para avaliação do autor.


## Face branca e inversão — prévia v46, 02/11/2026

Feedback do autor: a v45 ficou ruim. A alternativa mantém o aro dourado da v44,
mas elimina `spin-front-blue-v1.svg` da montagem e da pré-carga do spin. A face
é branca lisa em CSS, com lateral cinza-clara e texto separado. O arquivo azul
permanece preservado para histórico; não é a superfície desta prévia.

Relevo rígido de 8 unidades, pressão em 55 ms e retorno em 180 ms. Em repouso,
as letras têm a cor da próxima carga. Ao apertar, face colorida e texto branco
brilhante são revelados juntos por máscaras de 360 ms, do centro para os lados.
`data-spin-active` diferencia a rodada da animação de introdução. Cancelamento
volta ao branco; alvos e aro não se movem. Movimento reduzido troca sem transição.

Conferidos frames normal, intermediário e pressionado; simetria e sincronia das
duas máscaras; cor da face igual ao líquido; uma operação por toque e nenhuma
ao cancelar; três tamanhos, assets, console e movimento reduzido. A avaliação
estética continua com o autor. Não houve alteração do Firebase oficial.


## Expansão circular e lateral colorida — prévia v47, 02/11/2026

Correção solicitada pelo autor: a cor precisa estar nas letras primeiro, passar
para o botão em círculo e alcançar também a altura do relevo. Face, cópia branca
das letras e lateral usam `circle(0px at 50% 50%)` → `circle(190px at 50% 50%)`
em 420 ms. A lateral recebe a mesma cor com sombra de material, sem ficar cinza.

A próxima cor é preparada em repouso, após o fim da animação anterior. As
variáveis ficam no elemento estático da superfície para não serem apagadas
quando o controlador atualiza o estilo do alvo de toque. Isso evita mudar a cor
somente depois de iniciar a pintura. O contorno dourado e o relevo não mudaram.

Conferidos a abertura circular em frame intermediário, as três máscaras iguais,
o estado inicial sem forçar a introdução, a próxima cor nas letras antes do
segundo toque, a cor da carga real nas barras, cancelamento sem aposta, uma
operação por toque, três tamanhos, assets/console e movimento reduzido. Somente
na prévia para avaliação do autor; Firebase oficial preservado.


## Roxo inicial e transição entre cores — prévia v48, 02/11/2026

O autor retirou a face branca. A base começa no roxo inicial da paleta do
líquido (`rgb(142,36,255)`), com letras brancas. Cada carga revela a próxima cor
em círculo sobre a anterior, incluindo a lateral sombreada. A cor confirmada
permanece após o giro; a cobertura circular só é retirada após atualizar a
base. Cancelar sem confirmar preserva a cor anterior. O nível já salvo define
a cor ao reabrir, sem novo dado financeiro ou importação de saldo local.

Relevo, aro, alvos, auto/turbo, fonte sobreposta e máscara de 420 ms mantidos.
A superfície não usa branco nem como base nem como estado intermediário; branco
fica apenas nas letras. A proposta com face branca das v46/v47 é histórica.

Validação v48: estado inicial roxo, duas cargas consecutivas mantendo as cores
confirmadas na face e na lateral, retomada com a última cor, cancelamento
preservando a base anterior, três máscaras circulares iguais, uma operação por
toque, alvos fixos, três tamanhos, movimento reduzido e assets/console sem erros.


## Letras legíveis no verde e amarelo — prévia v49, 02/11/2026

Feedback do autor: KING RICO desaparecia nas cores mais claras. O contorno das
duas camadas de texto passa de 0,4 unidade translúcida para 2 unidades sólidas
em `#24324a`, pintado antes do preenchimento branco. Sombra inferior curta e
brilho de apenas 2 unidades substituem o halo branco de 8 unidades, preservando
a borda escura durante o pulso. Cores do botão, altura, máscara e ações iguais.

Conferida toda a paleta em tela, verde e amarelo em repouso/pressionado, três
tamanhos sem overflow, alvos fixos e assets/console sem falhas. Ajuste restrito
à apresentação das letras, ainda na prévia para avaliação do autor.


## Amarelo quente — prévia v50, 02/11/2026

Feedback do autor: o amarelo parecia verde. O ponto de 70% da paleta muda de
`#e4ff00` para `#ffda24` (`rgb(255,218,36)`). O mesmo ponto é atualizado na cor
do botão/vertimento (`motion.js`), no gradiente do líquido (`park.css`) e na
miniatura das barras (`cabinet.css`). As interpolações vizinhas acompanham a
paleta. Texto, contorno, relevo e movimento circular permanecem iguais.

Conferidos verde/amarelo/laranja no navegador, amarelo igual entre face e
gradiente/vertimento das barras, letras em repouso e pressionadas, três tamanhos
e assets/console sem falhas. Apenas na prévia para avaliação do autor.


## Núcleo das letras como LED — prévia v51, 02/11/2026

Pedido do autor: o branco interno deve parecer LED apagado/aceso. A camada
normal passa a `#b8c3ce`, fosca e sem halo; a camada acesa mantém branco puro
com halos de apenas 2 e 4 unidades. As duas preservam o contorno escuro de 2
unidades para leitura no verde e amarelo. A revelação segue a máscara circular
já existente. Não há novo asset, fonte, animação independente ou mudança nas
ações do botão. Cor da face, amarelo quente, altura e lateral preservados.

Conferidos os dois estados no roxo, verde e amarelo, acendimento circular,
contorno preservado durante o toque, alvos fixos, três tamanhos e assets/console
sem falhas. Ainda é uma prévia para avaliação visual do autor.


## Face e lateral em meia-luz — prévia v52, 02/11/2026

Pedido do autor: escurecer o botão, além das letras. Face e lateral recebem uma
camada neutra de `#08060e` a 34%, limitada ao contorno arredondado e colocada
sob o vertimento circular e o texto. A nova cor acesa cobre essa camada junto
ao LED. Quando o pulso fecha, a última cor permanece na base em meia-luz.

Não há filtro global: aro, letras acesas e cor do líquido permanecem íntegros.
Curso rígido, alvos e máscara de 420 ms são preservados. Apenas apresentação
na prévia; não muda apostas, pagamentos nem o Firebase oficial.

Conferidos repouso/aceso no roxo, verde e amarelo. A amostragem dos frames
confirma a face mais escura em repouso e a cor viva durante o pulso; letras e
contorno permanecem nítidos. Três tamanhos, alvos fixos e assets/console sem
falhas. Avaliação estética continua com o autor.


## Desligamento rápido e Circus como Home — prévia v53, 02/11/2026

O apagar das três camadas luminosas passa de 420 para 40 ms; o acendimento
circular conserva 420 ms. A translação mecânica e o relevo permanecem iguais.
Ingressos abrem `/park`, assim como o swipe para baixo no cenário, protegido
contra gestos em controles e navegação durante rodada/prêmio/menu/roleta.
Raiz, atalho PWA e Home passam a abrir o Circus; o parque fica em tela própria.
Nenhum asset ou comportamento financeiro foi trocado por essa navegação.

Verificação: build/adaptadores; navegador com Google Auth/Firestore emulados,
entrada pelo ingresso, swipe vertical, exclusão de gesto horizontal e sobre o
spin, presente diário, mesma conta/saldo entre telas, roleta retomada, Fingo
rápido e assets dos demais jogos. Prévia também conferida em três tamanhos.
Essa seção descreve a prévia; ainda não foi publicada no Firebase oficial.


## LED luminoso e desligamento imediato — prévia v54

A camada acesa das letras recebe núcleo branco com halos de 1/4/8 unidades,
conservando o contorno escuro. Face e lateral agora apagam sem transição; só o
LED mantém a saída de 40 ms. O pulso radial continua em 420 ms, sem mudança no
relevo, no alvo ou nos pagamentos. Parque redesenhado com foco na escolha das
quatro atrações; seus assets são reutilizados sem cenários duplicados.

A navegação também aceita swipe lento no palco completo, sem exigir uma
velocidade mínima. Gestos sobre controles continuam excluídos.

Validação v54 concluída: 46 verificações de build/adaptadores; navegador com
Google Auth/Firestore emulados, navegação por ingresso e swipe, mesma conta e
saldo, presente diário, roleta retomada, Fingo e demais jogos sem assets
ausentes. Prévia conferida em três tamanhos e LED no roxo, verde e amarelo.
O palco aceita gestos lentos e a perda de captura de outro elemento não apaga
o gesto atual. Ainda não há publicação da v54 no Firebase oficial.

Prévia de 04/11/2026: a base do spin acompanha a carga confirmada também ao
voltar ao roxo após aplicar a roleta, sem conservar a faixa vermelha anterior.
Relevo traseiro de 4 px separado da face; recolhe ao pressionar. Frente de
8 px, aro fixo, cores radiais e sons preservados.

A cavidade do spin é neutra e escura até o fundo. A traseira elevada começa
abaixo do limite interno do aro dourado (7/78 da altura), para a moldura não
ocultar sua espessura. Face acomodada na abertura, profundidades 4/8 px mantidas.

Revisão da prévia após rejeição do encaixe: corpo contínuo sob a face,
4 px atrás, 2 px nos lados e 8 px à frente. Sem faixa traseira móvel separada.
Pressão acomoda a face ao contorno do corpo; aro e alvo não se movem.

Encaixe lateral atual da prévia: corpo a 8 px das laterais do alvo, face a
10 px em repouso e 8 px pressionada. Corpo alcança o aro sem vão lateral
aberto; raio da face 20 px (22 px ao pressionar), acompanhando a moldura.

Correção atual da prévia: a face fica ACIMA do encaixe traseiro, não abaixo.
Face em repouso: inset 8/10/13 px, deslocamento vertical -4 px; pressionada:
inset 8/8/9 px e deslocamento zero. Aro atrás da peça elevada; sombra de
contato externa acompanha o clique. A faixa superior rebaixada foi rejeitada.

Estado aprovado em 04/11/2026: face elevada e encaixe lateral acima descritos
autorizados pelo dono para publicação oficial, junto aos sons dos ingressos.
As tentativas anteriores permanecem apenas como histórico, não como padrão.

Prévia 05/11: `spin-rim-iridescent-v1.svg` substitui só o acabamento dourado
do spin por nacarado rosa/violeta/azul. Mesmo viewBox 357×78, abertura e
contornos do aro anterior; geometria, profundidade e clique preservados.

Prévia 05/11: aro `spin-rim-iridescent-v2.svg` intensifica rosa, violeta,
ciano e reflexos claros. Mesma geometria; v1 preservada como tentativa suave.

Prévia 05/11: `spin-rim-iridescent-v3.svg` acrescenta amarelo/laranja à v2,
sem mudar recorte, espessura ou funcionamento do spin. Versões anteriores guardadas.

Prévia 05/11: luz iridescente circula em 40 s por volta, recortada pela
transparência do aro v3. A geometria não gira: só a cor percorre o contorno.
Arte v3 permanece como base/fallback; movimento reduzido mantém acabamento fixo.

Prévia 05/11: paleta móvel equilibrada em 12 matizes, espaçados a cada 30°
no círculo cromático, com saturação/luminosidade equivalentes. Inclui verdes
e vermelhos antes pouco representados; mantém ciclo de 40 s e recorte v3.
