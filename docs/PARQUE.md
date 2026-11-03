# Circus e parque

> Estado desta branch (03/11/2026): Circus usa nove tambores independentes,
> fita ordenada com `HEIGHT=146`, papel por casa e profundidade Three.js.
> Os registros anteriores de três colunas descrevem a versão oficial anterior.
> Fontes, execução e limites da carteira de teste: [Prévia completa](PREVIA-CIRCUS.md).
> Esta revisão está apenas no GitHub; não foi publicada no Firebase.

Na versão aprovada em 02/11/2026 (prévia v54), Circus é a tela inicial. O endereço principal e o atalho
instalado apontam para `/circus`; `/home` mantém compatibilidade com a mesma
tela. O parque passa a `/park`, mantendo `Home.dc.html` como fonte por
compatibilidade. Reúne Clown, Pênalti, Flying Clown e Fingo rápido. Wheel, Neck,
33 e protótipos preservam seus endereços. A entrega oficial usa o workflow
Firebase existente, com Google e carteira Firestore reais.

Tocar no contador de ingressos ou deslizar para baixo sobre o cenário do Circus
abre o parque. `ui/park/navigation.js` exige gesto vertical deliberado e ignora
controles, cancelamentos, gestos horizontais, rodadas e modais ativos. A Home dos
jogos volta ao Circus; o fechamento da escolha de entrada volta a `/park`.
A tela do parque tem volta explícita para o Circus, presente diário,
recarga e os quatro jogos; não repete a capa de entrada da slot.

A pintura da face e lateral apaga **instantaneamente**; o LED leva 40 ms e o
acendimento circular continua em 420 ms.
A mudança é visual, sem alterar a confirmação das apostas ou o saldo.

## Ingressos e entrada

Uma trinca de ingressos no Circus dá **3 ingressos**. A conta começa com zero
ingressos; nenhum saldo ou ingresso da prévia local é importado.

Cada partida do parque custa **1 ingresso ou 25 moedas**. Escolher a forma de
entrada apenas autoriza: a cobrança acontece na primeira jogada confirmada.
Recarregar a página conserva a partida e não cobra uma segunda entrada.
Rodadas antigas já pagas mantêm aposta e versão originais.

Na prévia de 03/11/2026, a escolha de entrada abre depois do carregamento e
antes de liberar os controles de qualquer atração. Gestos feitos sem entrada
são descartados: confirmar ingresso/moedas nunca executa uma jogada anterior.
Uma entrada já autorizada ou rodada salva é retomada sem nova escolha.
O rodapé “PARQUE · ENTRADA INCLUÍDA” foi removido; a aposta fixa continua sem
controles de ajuste. Esta revisão ainda não foi publicada no Firebase oficial.

O Fingo rápido mantém tabuleiro, cartela 5×5, coringa central e física do Fingo.
A nova partida oferece **10 bolas**, com prêmio total de **2×** por quina.
Cartelas antigas conservam suas 30 bolas e pagamentos.

## Roleta bônus do Circus

Cada giro pago carrega as duas barras. No décimo, uma rodada com prêmio real
abre a roleta. O prêmio-base pertence àquela rodada; a roleta credita somente a
diferença entre o total multiplicado e a base já confirmada.

O sorteio, a aplicação visual e o fechamento são etapas recuperáveis. A mesma
operação não credita duas vezes, inclusive em outro aparelho. Reabrir uma roleta
já sorteada apresenta o mesmo multiplicador. Falha de animação não desfaz crédito.

A apresentação conserva o líquido sincronizado com o pulso, a união das roletas,
o multiplicador viajando ao prêmio e as moedas viajando ao saldo. O fundo normal
do Circus e da Home usa o parque diurno em `assets/scenes/circus-daylight-v1.webp`.
A máquina usa peças separadas para visor, barras, base e rolos, com montagem em
`ui/park/cabinet.css`. Os três rolos usam fitas contínuas; os nove resultados
numéricos não são nove animações independentes. A janela conserva as nove posições
visíveis e uma curva suave nas linhas externas.

Spin, auto e turbo compartilham azul-turquesa, aro fixo e face rígida que afunda
por translação. O spin aprovado mede 373 × 88 na cena de referência 453 × 802.
A roleta aceita botão e gesto e compartilha sua paleta arco-íris com as roletas
pequenas das barras. O multiplicador viaja em dourado até o prêmio antes das
moedas irem ao saldo. Detalhes de geometria e estados no
[Design System](../DESIGN-SYSTEM.md); peças ativas e tentativas anteriores no
[registro da máquina](../assets/machine/README.md).

## Persistência e publicação

`cloud/park.cjs` implementa as transições. `cloud/store.mjs` grava carteira,
registro do parque e operação imutável na mesma transação Firestore. As regras
validam a relação entre esses registros. O registro imutável valida o envelope
completo uma vez; carteira e parque exigem sua criação na mesma transação e
rejeitam um ID já existente. Não há Cloud Functions nem plano Blaze.

`ui/park/` contém somente a apresentação integrada ao cliente Google/Firestore.
As moedas de teste e o servidor da prévia não fazem parte do build publicado.

Verificações relevantes: `tests/integration.mjs`, `tests/adapters.test.cjs`,
`tests/build.test.mjs`, `tests/reel-tape.test.cjs` e `tests/park_browser.py`. O navegador usa os emuladores;
`KING_RICO_TEST_URL` seleciona o Hosting local. Gere produção após essa validação,
e confirme os jobs do workflow existente antes de considerar a entrega publicada.


Na v54, o parque foi simplificado: título e ingressos identificados, custo da
partida numa linha, quatro cards com assets dos jogos e JOGAR/CONTINUAR, recarga
separada abaixo. Sem cenários repetidos ou frases promocionais. A aparência fica
em `ui/park/park-home.css`; economia e confirmação da entrada continuam iguais.
