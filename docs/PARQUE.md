# Circus e parque

Na versão aprovada em 02/11/2026 (prévia v54), Circus é a tela inicial. O endereço principal e o atalho
instalado apontam para `/circus`; `/home` mantém compatibilidade com a mesma
tela. O parque passa a `/park`, mantendo `Home.dc.html` como fonte por
compatibilidade. Reúne Clown, Pênalti, Flying Clown e Fingo rápido. Wheel, Neck,
33 e protótipos preservam seus endereços. A entrega oficial usa o workflow
Firebase existente, com Google e carteira Firestore reais.

Tocar no contador de ingressos ou deslizar para baixo sobre o cenário do Circus
abre o parque. `ui/park/navigation.js` exige gesto vertical deliberado e ignora
controles, cancelamentos, gestos horizontais, rodadas e modais ativos. A Home dos
jogos volta ao Circus; o link PARQUE e o fechamento da escolha de entrada voltam
a `/park`. A tela do parque tem volta explícita para o Circus, presente diário,
recarga e os quatro jogos; não repete a capa de entrada da slot.

A pintura da face e lateral apaga **instantaneamente**; o LED leva 40 ms e o
acendimento circular continua em 420 ms.
A mudança é visual, sem alterar a confirmação das apostas ou o saldo.

## Ingressos e entrada

Uma trinca de ingressos no Circus dá **3 ingressos**. Na prévia de 04/11/2026,
a trinca pode sair em qualquer uma das cinco linhas de pagamento (três horizontais
e duas diagonais), sorteada após
a concessão. O prêmio em moedas é recalculado pela grade efetivamente mostrada.
A chance de conceder ingressos e a quantidade de três permanecem iguais. A conta começa com zero
ingressos; nenhum saldo ou ingresso da prévia local é importado.

Na prévia, cada ingresso toca uma única nota ao incrementar o contador:
dó (523,25 Hz), mi (659,25 Hz) e sol (783,99 Hz), formando uma frase de três notas distintas de um acorde maior. Uma voz
triangular filtrada, ataque de ganho 0,48, corpo em 0,30 e cauda baixa após
240 ms; durações de 0,9, 1,0 e 1,15 segundo. Não usa a dupla camada metálica da
tentativa anterior. Moedas e outros efeitos permanecem iguais. Respeita
volume/silêncio do menu; falha de áudio não interrompe a contagem.

O incremento, a nota e o impacto usam o mesmo contato na linha de tempo do
voo, com o ingresso ainda visível no centro do contador. A absorção/fade vem
depois, nos 20% finais. Cada ingresso voa sozinho, e o próximo só parte ao terminar a absorção do
anterior. As chegadas ficam separadas por 700 ms (450 ms no modo reduzido),
permitindo associar uma nota a cada item. O contexto de áudio é
preparado antes do voo, e o ataque da nota leva 6 ms. Não disparar o som só
no `animation.finished`, quando o ingresso já desapareceu.



Cada partida do parque custa **1 ingresso ou 25 moedas**. Escolher a forma de
entrada apenas autoriza: a cobrança acontece na primeira jogada confirmada.
Recarregar a página conserva a partida e não cobra uma segunda entrada.
Rodadas antigas já pagas mantêm aposta e versão originais.

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

Na versão oficial, a apresentação conserva o líquido sincronizado com o pulso,
a união das roletas, o multiplicador viajando ao prêmio e as moedas ao saldo.
Na prévia de 04/11, a roleta substitui a máquina no próprio palco: cabos e travessa
suspendem o conjunto, mantendo HUD e cenário. Não há modal, véu ou desfoque.
Atualização da prévia em 05/11: cordas descem por 2 s, assentam por 0,5 s e
só então suspendem o conjunto em 3,6 s. Resultado exposto por 4,5 s e retorno
automático em 2,4 s. Sem confetes nessa sequência. Roletinhas só travam acesas
ao atingir o vermelho, permanecendo assim até o içamento/fechamento do bônus. Não há botão Aplicar: a máquina desce antes
do multiplicador atingir o mostrador. Erro de rede oferece Tentar novamente;
reabrir o resultado salvo também segue automaticamente, sem novo sorteio.
`ui/park/wheel-transition.js` controla apenas apresentação, sem alterar crédito.
A cena é recuperada ao recarregar; movimento reduzido troca as peças sem içamento. O fundo normal
do Circus e da Home usa o parque diurno em `assets/scenes/circus-daylight-v1.webp`.
A máquina usa peças separadas para visor, barras, base e rolos, com montagem em
`ui/park/cabinet.css`. Os três rolos usam fitas contínuas; os nove resultados
numéricos não são nove animações independentes. A janela conserva as nove posições
visíveis e uma curva suave nas linhas externas.

Spin, auto e turbo compartilham aro fixo e face rígida. O spin acompanha a cor
das barras com luz radial; auto e turbo mantêm seu azul. O spin aprovado mede 373 × 88 na cena de referência 453 × 802.
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

## Prévia: animações e modo de movimento reduzido (04/11/2026)

`build:preview` inclui uma única interface do parque no cliente de teste; remove
o script nativo duplicado das páginas geradas. Isso evita duas sequências de
enchimento e controladores concorrentes para a roleta. O build de produção
continua carregando sua interface nativa normalmente.

Os movimentos que explicam o resultado permanecem perceptíveis quando o aparelho
pede redução de movimento: líquido sobe sem oscilar em 450 ms, ingresso viaja
em linha reta sem giro em 450 ms e a roleta faz no máximo uma volta em 900 ms.
Confetes, saltos do líquido e a grande transição de entrada ficam suprimidos.
No modo normal, a apresentação original é preservada. Falha de áudio/animação
não desfaz recebimento confirmado.

Regressão focada: após `npm run build:preview` e servidor estático local,
`KING_RICO_TEST_URL=http://127.0.0.1:4178 python3 tests/preview_motion_browser.py`.
O teste recusa carteira real, executa giros pelo botão e cobre os dois modos.
