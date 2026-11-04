# Controles compartilhados

Fortune Wheel é a referência para gradiente dourado, aro escuro e profundidade dos controles. `controls.css` concentra a aparência; cada jogo mantém posicionamento, dimensões de ações e lógica.

- `kr-stepper`: aumentar/diminuir aposta. Diâmetro normal 54 unidades; `--kr-step-size:40px` nos seletores compactos do Neck e Fortune 33. Deixe espaço para o aro de 3 unidades e a sombra inferior de 5.
- `kr-button`: ação principal e confirmação, verde.
- `kr-button kr-button--red`: parar/encerrar, com a mesma forma e profundidade do verde.
- `kr-button kr-button--gold`: pegar prêmio e controles secundários dourados.

Reutilize as classes e ajuste apenas a geometria necessária. Não duplique gradientes, sombras e estados de toque em estilos locais. Preserve eventos, estados desabilitados, feedback e arte dos controles integrados à máquina Circus.

`header.css` e `interface.js` definem uma posição única para saldo, Home e menu. Cada tela usa `.kr-hud-row`; sua escala se baseia na mesma referência de 453×802 e compensa a escala da cena, inclusive no Fingo e 33. A arte dos ícones continua proporcional ao saldo, dentro de alvos de toque de 44 px separados por pelo menos 4 px. Steppers têm extensão transparente de toque. A Wheel recompõe os controles em telas baixas para manter escolhas de 44 px sem sobreposição. O build versiona CSS; o Hosting manda revalidá-lo.

A placa do saldo usa CSS e o asset da moeda. Ela cresce com o texto para acomodar `100.000.000,65`, com números de 19 unidades em todas as telas, sem redução por quantidade de dígitos. A escala geral de cada cena continua acompanhando o aparelho.

`RoundControls` (`ui/round-controls.js`) é a barra compartilhada do Neck e Flying Clown. Antes da rodada mostra o seletor de aposta e JOGAR; a primeira ação confirma a aposta e executa a primeira subida. Durante a rodada há apenas PEGAR (com o prêmio atual) e SUBIR, em duas colunas iguais. Aposta não é editável até terminar; retomada restaura diretamente os controles da rodada. Botões ficam desabilitados enquanto uma jogada está sendo confirmada ou animada.

`banner.js` e `banner.css`, incluídos pelo build em todas as páginas jogáveis, reservam uma faixa preta de 60 px com BANNER. `KingRicoViewport.height` desconta esse espaço para a escala das cenas; o cabeçalho mantém o mesmo alinhamento dentro da área restante. Menus, login e a simulação de anúncio usam portais no body e continuam cobrindo a janela inteira. É apenas um espaço de teste, sem SDK nem impressões de anúncio.

`wallet.js` e `WalletValue` compartilham a apresentação do saldo em todas as telas. Ganhos aguardam o fechamento do prêmio e começam a contar na chegada da primeira moeda; descontos contam para baixo sem voo. O contador mantém centavos e recebe o valor confirmado da conta, sem escrever saldos ou criar transações. `hold` mantém um prêmio visível antes da coleta, e `external`/`fly` evitam duplicar voos próprios dos jogos. Falhas de animação têm temporizadores independentes para concluir a apresentação. Restaurar a conta mostra o saldo salvo diretamente.


## Controles integrados do Circus

A família aprovada do Circus usa aro dourado fixo, separando face, lateral e
sombra. Auto/turbo são azuis; o spin acompanha a cor da carga. O spin mede
373 × 88 na cena 453 × 802 e afunda 8 unidades por translação; pressão de 55 ms
e retorno de 180 ms. Auto/turbo
movem apenas a face e distinguem ligado/desligado. Não usar escala, perspectiva,
deformação ou brilho animado para simular o clique desses três controles.

A montagem fica em `ui/park/cabinet.css`, a resposta de toque em
`ui/park/spin-tactility.js` e os SVGs atuais em `assets/machine/`. Aro e alvo
permanecem imóveis; cancelar restaura o estado, sem aposta. Os sons obedecem às
preferências existentes e não são repetidos pela fila de giro. Movimento reduzido
remove transições. Esta montagem específica não substitui `kr-button` nos demais
jogos. Veja [Design System](../DESIGN-SYSTEM.md) e
[peças ativas](../assets/machine/README.md).


### Revisão aprovada v54 — 02/11/2026

A face branca das v46/v47 foi superada. O spin começa roxo com letras brancas,
conservando o relevo de 8 unidades, pressão de 55 ms e retorno de 180 ms. A
próxima cor do líquido avança em círculo sobre a atual em 420 ms, na face e na
lateral. O texto fica separado e recebe brilho curto durante o pulso. As duas camadas
de letras têm contorno sólido azul-escuro de 2 unidades
(`#24324a`) e sombra inferior curta. O contorno é pintado antes do preenchimento
para preservar o corpo das letras; não usar halo branco amplo sobre verde ou
amarelo, pois apaga as bordas.

`--park-spin-base-color` conserva a cor atual, enquanto `--park-spin-pulse-color`
prepara a próxima. A confirmação da carga mantém a cobertura circular até a
nova cor estar na base (`data-color-pending`), sem depender do fim do giro para
conservar o resultado visual. Cancelamento restaura a cor anterior, e movimento
reduzido desativa transições. Retomar usa o nível salvo da barra; a cor não é
saldo nem uma transação nova. Aro dourado, alvos e auto/turbo preservados.
Esta revisão foi aprovada para publicação pelo workflow Firebase existente.
As notas v50–v53 abaixo registram a evolução; o comportamento final é o da v54.

Na v50, o amarelo da paleta passa a `#ffda24` (`rgb(255,218,36)`), retirando o
tom verde-limão. Botão, vertimento, gradiente do líquido e miniatura das barras
acompanham o mesmo tom. Contorno das letras e transição circular preservados.

Na v51, o interior das letras imita LED apagado/aceso. A camada de repouso é
branco acinzentado fosco (`#b8c3ce`) com sombra de encaixe, sem halo. A camada
acesa é branca (`#fff`), com halos curtos de 2 e 4 unidades. O contorno escuro
permanece igual. A máscara circular revela a luz junto ao pulso, sem outro
relógio ou troca de fontes; cancelamento e retorno apagam o núcleo luminoso.

Na v52, face e lateral também têm estado apagado: pseudo-elementos internos
com sombra neutra a 34%, recortados pelo contorno arredondado. Ficam abaixo da
pintura radial e das letras. O círculo revela a cor viva junto ao LED; ao fechar,
a base conserva a cor confirmada em meia-luz. Não aplicar `filter` ao botão
inteiro, pois escureceria as letras acesas e o aro dourado.

Na v53, a luz apaga em 40 ms e acende em 420 ms. O movimento mecânico de retorno
mantém 180 ms. `ui/park/navigation.js` cuida do clique nos ingressos e do swipe
para baixo no cenário: cancela toque múltiplo, gesto horizontal/para cima,
interrupção e início em controles. Não abre o parque durante partida, prêmio,
menu ou roleta. A navegação não escreve saldo, ingressos ou registros do jogo.

Na v54, o desligamento da pintura da face e lateral é instantâneo (`transition:
none` em repouso). O LED conserva 40 ms para apagar e recebe núcleo branco com
bloom frio curto; o contorno sólido continua no topo para manter leitura. O
acendimento circular de 420 ms e o retorno mecânico de 180 ms não mudam.

`ui/park/park-home.css` concentra a apresentação da tela do parque. Cards inteiros
são links, com ação JOGAR/CONTINUAR; a condição vem da rodada salva. O preço é
único e usa o valor do parque. Não repetir instruções e preços em cada card.

O swipe do parque aceita movimentos lentos; não impor prazo de velocidade ao
público piloto. Em toque, preservar a captura implícita do elemento de origem;
em mouse, perda de captura cancela apenas o gesto que pertence ao palco.

Na prévia de 04/11/2026, spin, auto e turbo do Circus usam o mesmo método
`click(down)` para os sons de pressão e soltura, respeitando volume e silêncio.

Prévia de 04/11/2026: a base do spin acompanha a carga confirmada também ao
voltar ao roxo após aplicar a roleta, sem conservar a faixa vermelha anterior.
Relevo traseiro de 4 px separado da face; recolhe ao pressionar. Frente de
8 px, aro fixo, cores radiais e sons preservados.

A cavidade do spin é neutra e escura até o fundo. A traseira elevada começa
abaixo do limite interno do aro dourado (7/78 da altura), para a moldura não
ocultar sua espessura. Face acomodada na abertura, profundidades 4/8 px mantidas.
