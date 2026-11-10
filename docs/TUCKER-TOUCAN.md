# Tucker Toucan — proposta v1 (09/11/2026)

**Estado atual (09/11): integração oficial autorizada do conjunto completo.**
Sorteio real v4, três vilões e limites em [ECONOMIA.md](ECONOMIA.md).
As seções de demonstração abaixo registram o desenvolvimento anterior.


- [Corpo com os dois pés em preensão](concepts/tucker-toucan/body-v2.webp)
- [Cabeça para ícone, transparente](concepts/tucker-toucan/head-v1.webp)

Primeira direção em avaliação: tucano ágil/malandro, bico amarelo-alaranjado
com ponta ameixa, penas azul-noite, olhos âmbar com contorno turquesa,
garganta creme e colete verde-petróleo discreto com acabamento dourado.
Asas de ave, sem mãos humanas. Arte 2D com aparência de personagem 3D,
na família visual de King Rico/Tony Tiger; não é modelo 3D rigado.

Papel proposto pelo dono: passar voando sobre a cesta e levar alguns Happeach.
O dono não gostou ainda da arte, mas pediu experimentá-la no jogo antes de
refazer. V1 continua provisória. Corpo e cabeça foram copiados sem alteração
para assets/tucker para essa avaliação; não há aprovação da identidade final.

## Demonstração explícita na prévia

`/circus?demo=tucker` prepara 3 Happeach fictícios uma única vez por navegador.
O primeiro giro por toque mostra a trinca do rosto com círculos/linha vermelhos.
Tucker pousa na alça, leva a cesta inteira para fora da tela batendo as asas;
o espaço fica vazio antes do modal. Nesta amostra ele leva até 1 Happeach. Com a cesta vazia, aparece e leva a
cesta do mesmo jeito, mas o roubo é zero e o aviso diz que não houve perda.
Continuar devolve a cesta ao lugar com 2. A contagem é persistida no recibo da
carteira fictícia e não muda de novo ao repetir a requisição ou recarregar.

Essa escolha de 1 e a preparação de 3 são parâmetros de demonstração para
avaliar a cena, não regras econômicas aprovadas. Não há sorteio natural do
Tucker, integração do evento no Firestore real ou publicação no oficial.
Cabeça derivada do corpo para manter identidade. Originais PNG preservados
em generated_images; registro em guidelines/asset-pipeline.md.

A pose v2 substitui os pés afastados por dois pés próximos e curvados na mesma
altura. O ponto entre as duas garras se ancora no topo da alça e acompanha a
cesta durante o voo. Corpo v1 e cabeça v1 preservados; a identidade segue provisória.

## Integração real autorizada — 09/11/2026

A instrução posterior do dono autoriza levar o conjunto completo ao oficial.
Este estado substitui as restrições de demonstração acima: o sorteio natural
usa cliente v4, recibos atômicos e regras Firestore; cenas/arte mantidas.
Regras e limites atuais: docs/ECONOMIA.md, seção dos três vilões. Demos via
query string e carteira fictícia continuam exclusivas do build de prévia.
