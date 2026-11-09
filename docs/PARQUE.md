# Circus e parque

Na versão publicada em 05/11/2026 (`87244fe`), Circus é a tela inicial.
`/home` mantém compatibilidade com `/circus`. O parque usa `/park`, com
`Home.dc.html` como fonte, e reúne **Pênalti, Flying Clown e Bounce**.
**Basquete, Bubble Plinko e Race Horse** têm cards **Em breve**, sem ação nem cobrança.
Clown foi guardado: fontes e rodadas permanecem, mas não há rota pública.
Fingo conserva a rota direta fora do catálogo. Demais arquivados em ARQUIVADOS.md.

Tocar no contador do Circus, usar o controle de videogame no cabeçalho ou
arrastar o cenário para baixo abre o parque. O gesto ignora controles, gestos
horizontais e rodadas/modais ativos. Home volta ao Circus; Parque volta ao catálogo.
O anúncio de moedas fica no alto, antes das atrações. Google e carteira Firestore
reais são usados no build de produção; a prévia mantém moedas de teste isoladas.

A pintura da face e lateral apaga **instantaneamente**; o LED leva 40 ms e o
acendimento circular continua em 420 ms.
A mudança é visual, sem alterar a confirmação das apostas ou o saldo.

## Presente diário (prévia de 07/11/2026)

Na primeira abertura do dia, depois da conta e da tela de carregamento, abre
uma raspadinha. Funciona no Circus e nas rotas do parque, antes da escolha de
entrada. A grade 3×3 contém seis X vermelhos e três casas com o mesmo valor do
presente, em posições embaralhadas. Cada casa é raspável independentemente:
remover cerca de 36% de sua cobertura a revela. Ao encontrar os três valores,
as casas restantes são reveladas e PEGAR MOEDAS fica disponível. Os três valores
representam **um único prêmio diário**, não três créditos. REVELAR oferece a
alternativa de abrir todas as casas por botão/teclado.
Após os três acertos, a grade permanece legível por 650 ms; as casas se recolhem
ao centro e dão lugar a uma moeda grande, ao valor único e a PEGAR MOEDAS.
Durante essa transição o botão aguarda, sem efetuar crédito. Movimento reduzido
encurta a transição; falha de animação não impede revelar/receber.
PEGAR MOEDAS confirma o bônus existente no Firestore. Falha mantém
o cartão aberto para tentar de novo. Raspar sozinho não grava nem credita nada.

Mantida a sequência de 50, 100, 150, 200, 250, 500 e 1.000 moedas e o calendário
de São Paulo; faltar um dia reinicia a sequência. A transação existente limita
o recebimento a uma vez ao dia, inclusive entre abas e dispositivos. Recarregar
antes de receber reabre o cartão; após receber conserva o crédito e não reabre.
O saldo visual fica retido durante a confirmação; ao fechar, usa o voo e a
contagem compartilhados, com fallback em caso de erro de animação. O anúncio
de recarga continua separado. Não altera a matemática dos jogos.

**Exceção de teste na prévia:** por pedido do dono, cada abertura/recarga de
página reinicia apenas o presente da carteira fictícia. A raspadinha reaparece
e concede 50 moedas de teste ao receber; dentro da mesma visita não paga duas
vezes. Esse reinício vive somente em `prototypes/circus-preview/model.mjs`.
O cliente e o bônus diário reais conservam o limite de uma vez por dia.

## Voo do grande prêmio (prévia de 07/11/2026)

Na prévia v3, os prêmios monetários grandes (a partir de 20× a
aposta) passam a usar uma cena automática: avião chega da diagonal inferior
esquerda, King Rico salta da posição real da nuvem para a cabine e sobe como
piloto. O multiplicador e o valor crescem durante a subida; o resultado fica
em destaque antes da saída e do voo de moedas existente. Sem botão de parar.

Revisão de 08/11: embarque usa o método do `cheer` de KingRico.dc.html:
poses fw6 `crouch2 → cheerRise → cheer → cheerFall → land`, dissolução opaca
de 110 ms, transformações suaves a 22/s e pivô nos pés (97%). A pose visível
na nuvem é copiada antes da antecipação; não há desaparecimento na aproximação.
O pouso é amortecido na cabine, seguido de respiração sutil. Avião e pagamentos
preservados; implementação compartilhável em `ui/park/king-boarding.js`.
Na descida final, a pose passa para `pilotSide`: King Rico de perfil olhando
para a direita, com as mãos à frente e sem cetro. Essa mesma pose permanece
durante o voo, com pernas ocultadas pela frente da fuselagem. Arte gerada a
partir de `assets/brand/king-rico-turnaround.png` e do desenho oficial fw6.

Esta etapa **apresenta o resultado já confirmado**: ×20 significa prêmio total
de vinte apostas, sem multiplicar novamente esse prêmio nem sortear um extra.
`ui/park/bigwin-flight.js` não chama carteira/RNG. Mantém a continuação de auto,
Happeach e roleta após o recebimento visual; bloqueia outra rodada durante a
cena. Falha do asset ou timeout liberam a apresentação para o fluxo de crédito
existente. Crédito persistido não depende da animação.

Para revisar sem esperar um prêmio raro: na prévia, `/circus?demo=bigwin`
direciona o primeiro giro de cada abertura para uma trinca de diamantes (20×).
O dono ainda aperta Girar; são exclusivamente moedas de teste. A opção vive no
transporte fictício, fora do build financeiro de produção.

Revisão de proporções/altura (08/11): piloto ocupa 43% da largura do asset do
avião (antes 31%). O salto conserva essa proporção na chegada e começa levemente
maior, ancorado nos pés. Durante a aproximação, o King continua o ciclo de
comemoração desenhado, com impulso/ápice/queda/pouso, até o embarque.

A câmera é sugerida pelo movimento para baixo das nuvens e paralaxe das estrelas.
A altura final e a duração da subida dependem do multiplicador já confirmado:
prêmios menores ficam no céu; intermediários passam à estratosfera; maiores
alcançam espaço, estrelas, lua e curvatura azul do horizonte. Multiplicador
central ampliado, com alto contraste. O cenário não altera probabilidades nem
pagamentos. `/circus?demo=spacewin` demonstra 200× na prévia (primeiro giro),
enquanto `?demo=bigwin` continua demonstrando 20×.

### Cenário ilustrado do voo — prévia (08/11)
O atlas `flight-scenery-atlas.webp` substitui o fundo plano: céu luminoso e
nuvens pintadas à esquerda; espaço com lua e Terra à direita. Duas camadas de
`flight-cloud-bank.webp` descem em velocidades diferentes, com as próximas
mais rápidas; estrelas irregulares têm paralaxe suave. Centro limpo para ler
multiplicador e prêmio. Assets entram no preload do Circus. Apenas cenário;
avião, piloto e pagamento confirmado preservados. Revisão seguinte: nuvem
colorida da origem é ocultada junto do mascote após embarcar e restaurada ao
terminar/falhar. Voo de 6,8–9,8 s (conforme altitude), câmera mantém a aeronave
numa curva para o alto à direita, reduzindo de 100% para 42% da escala
de embarque; rastro parte da base esquerda e termina no centro da aeronave. A trajetória e
a inclinação do nariz derivam da mesma curva quadrática; rotação entra
suavemente após embarque, sem cortar a aeronave no canto. Contagem em moedas
é o foco único, sem multiplicador separado, com pulso suave e círculo dourado
luminoso (1,6 s, sem flash rápido; estático em movimento reduzido); valor final
permanece por 2,1 s. Movimento reduzido mantém leitura sem balanço/pulso.

## Ingressos e entrada

Uma trinca de ingressos no Circus dá **3 ingressos**. A prévia de 07/11/2026
usa oito combinações (v2 histórica; v3 balanceada em teste): pagam moedas ou ingressos, sendo três
horizontais, três verticais e duas diagonais. Um ou dois ingressos também podem
aparecer sem conceder entradas; não substituem células de prêmio ou Happeach.
As fitas incluem ingressos durante o giro, sem anunciar uma trinca antecipadamente.
O prêmio em moedas é recalculado pela grade efetivamente mostrada.
A chance de conceder ingressos e a quantidade de três permanecem iguais.
Pedidos antigos sem essa versão conservam as cinco combinações originais.
Esta revisão está somente na prévia: a auditoria em ECONOMIA.md encontrou
retorno elevado e precisa orientar o balanceamento antes de levar à produção.
A conta começa com zero
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
só então suspendem o conjunto em 3,6 s. Resultado exposto por 3,6 s e retorno
automático em 2,4 s. Sem confetes nessa sequência. Roletinhas só travam acesas
ao atingir o vermelho, pulsando como na chegada da carga até o içamento.
Com movimento reduzido, mantêm luz constante sem pulsar. Não há botão Aplicar: a máquina desce antes
do multiplicador atingir o mostrador. Erro de rede oferece Tentar novamente;
reabrir o resultado salvo também segue automaticamente, sem novo sorteio.
`ui/park/wheel-transition.js` controla apenas apresentação, sem alterar crédito.
A cena é recuperada ao recarregar; movimento reduzido troca as peças sem içamento. O fundo normal
do Circus e da Home usa o parque diurno em `assets/scenes/circus-daylight-v1.webp`.
A máquina usa peças separadas para visor, barras, base e rolos, com montagem em
`ui/park/cabinet.css`. Os três rolos usam fitas contínuas; os nove resultados
numéricos não são nove animações independentes. A janela conserva as nove posições
visíveis e uma curva suave nas linhas externas.

Spin, auto e turbo compartilham aro fixo e face rígida. O spin é vinho como a barra de aposta, com aro/letras dourados e pulso radial
na mesma paleta; as barras continuam arco-íris. Auto e turbo mantêm seu azul. O spin aprovado mede 373 × 88 na cena de referência 453 × 802.
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

Prévia 05/11: a descida é feedback essencial também com movimento reduzido:
1,1 s em linha reta, sem balanço, antes da viagem do multiplicador. No modo
normal mantém 2,4 s. Não restaurar a máquina instantaneamente nesse modo.

Prévia 05/11: roleta de 374 px no palco nativo. Ao sortear, multiplicador pulsa
no centro. O valor fica destacado no mesmo ponto durante a descida da máquina
e viaja dali ao prêmio; reduzido usa trajeto reto de 650 ms, sem saltos.

Revisão mais recente da prévia (05/11): centro verde cresce para cobrir o
disco; topo com elefante/nuvem e prêmio volta primeiro. O disco com o número
viaja até o prêmio e só após o impacto/contagem voltam as demais peças.
Esse retorno em etapas substitui a descida do conjunto inteiro antes do voo.

Prévia mais recente (05/11): disco segue para a direita e a máquina completa
entra pronta por esse lado, terminando no encontro do multiplicador com o prêmio.
Essa troca lateral (1,9 s normal/0,9 s reduzido) substitui a volta separada
de topo e rolos. Ingressos mantêm notas/contato e sequência um por vez, agora
em 620/400 ms por voo para encurtar levemente o intervalo das chegadas.

## Proposta visual do parque · 05/11/2026

Na prévia, o parque reutiliza a geometria/arte do HUD compartilhado dos jogos:
saldo à esquerda, Home e menu à direita, com alvos de 44 px. O cabeçalho rola
com a página; só o banner fica fixo. O menu se identifica como Parque.
As quatro capas compartilham o cenário diurno e a moldura; usam os personagens
atuais e a família `kr-button` em Jogar/Continuar. Pênalti usa
`clown-keeper-v3.webp` e bola de futebol. Fingo conserva plinko e cinco bolas.
Carteira, preço, ingressos, presentes e recarga mantêm os mesmos fluxos.
Plano e critérios em [PLANO-PARQUE.md](PLANO-PARQUE.md). Proposta ainda sem
aprovação estética e sem publicação oficial.


## Prévia: três atrações e continuidade das partidas (05/11/2026)

O parque da prévia reúne somente **Clown, Pênalti e Flying Clown**, em placas
horizontais maiores. O Fingo saiu do catálogo do parque; a rota e partidas salvas
continuam preservadas. Saldo/Home/menu mantêm o cabeçalho compartilhado.

A escolha de entrada aparece na primeira abertura de cada atração. Depois da
confirmação, terminar as dez bolas do Clown, errar no Pênalti, cair no Flying ou
receber um prêmio permite iniciar outra partida sem repetir o modal. Ao começar
a próxima, usa **1 ingresso**, se houver; caso contrário, **25 moedas**. Não há
nova cobrança entre jogadas da mesma partida. Sem ingresso e sem saldo suficiente,
a ação falha com aviso; não começa partida grátis nem fica tentando automaticamente.
A primeira tela informa a cobrança automática das partidas seguintes.

`ui/park/entry-flow.js` compartilha essa autorização entre prévia e cliente real.
A autorização não desconta: a transação original da primeira jogada é quem cobra,
com os mesmos IDs de operação e recuperação. Um passe ainda não utilizado ou
uma rodada já paga são retomados sem outra confirmação/cobrança. A autorização
da visita fica apenas em memória, sem importar qualquer saldo local.

Corrigido `cloud/store.mjs` no Flying para respeitar o débito zero da entrada
por ingresso, como as regras Firestore já exigiam. Prêmios, probabilidades e
validação das regras continuam iguais.

Regressão: `tests/park-entry.test.mjs`, `tests/park_repeat_browser.py`, teste de
Flying por ingresso em `tests/store.test.mjs` e `tests/integration.mjs`.


## Prévia: anúncio no alto e navegação compartilhada (05/11/2026)

O botão **+1.000 moedas / Ver anúncio de 30s** fica logo após o cabeçalho,
antes do título e das atrações. Simulação, confirmação do crédito e viagem de
moedas continuam no mesmo fluxo.

O cabeçalho compartilhado inclui **Home · Parque · configurações**, nessa ordem.
O novo atalho usa ícone de tenda e aponta para `/park` em todas as telas com HUD.
É fixo como opção de navegação; na página do parque o cabeçalho continua rolando
normalmente, deixando apenas o banner preso ao alto.

Clown, Pênalti, Flying e a rota preservada do Fingo mostram um contador de
ingressos logo abaixo do saldo de moedas. O contador acompanha o estado confirmado
do parque e destaca a mudança sem atrasar ou simular a cobrança. No Circus,
permanece o contador original, sincronizado com a viagem/som dos ingressos.

Os três botões conservam alvos de 44 px. Se o saldo longo ocupar o espaço dos
botões em uma tela estreita, eles passam juntos para a linha inferior; os
números não encolhem. Navegação não cancela nem reembolsa rodadas salvas.


Prévia 05/11, refinamento após feedback: o contador das atrações ficou maior,
com margens internas e intervalo entre ícone/valor ampliados. Parque passa a
usar controle de videogame sobre a moldura original de Home, com tamanho,
escala e pressionamento iguais. Casinha de Home preservada. A tenda anterior
é uma tentativa substituída. Não muda cobranças nem navegação.


## Catálogo e Bounce reativado (05/11/2026)

Autorizado pelo dono: guardar Clown, criar três cards Em breve e reativar o Bounce
preservado. Não foram criados jogos de basquete, bolhas ou cavalos nesta entrega.
As quatro novas ilustrações são vetores geométricos leves em `ui/park/covers/`.

Bounce conserva Three.js local, física, sons, plataformas e multiplicadores.
Recebe o cabeçalho compartilhado, contador e entrada do parque: 1 ingresso ou
25 moedas. O passe é autorizado primeiro e consumido atomicamente no início;
land/collect/fall não cobram nova entrada. Repetir o pedido ou recarregar não
paga/cobra duas vezes; rodadas antigas mantêm aposta original. A confirmação
se repete apenas ao abrir uma nova visita, como nas outras atrações.

Publicação confirmada: workflow 42062162492 (verificar/publicar aprovados),
regras REST e Hosting. Conferência no site oficial: projeto king-rico sem
emuladores, catálogo correto, Bounce 3D carregado, Clown 404 e assets 200.

### Referências da revisão do voo (08/11/2026 · prévia)
Aviator: página da SPRIBE (https://www.spribe.co/games/aviator), referência de
curva crescente; imagens públicas da interface e gameplay mobile listado em
https://vimeo.com/672791246. Fortune Tiger: ficha oficial da PG Soft
(https://www.pgsoft.com/uploads/Games/Pdf/Fortune_Tiger_Gameinformation_EN.pdf)
e imagem https://gamblerid.com/storage/files/shares/slots/fortune-tiger/big-win.jpg.
Aplicação: trajetória visual contínua e prêmio central único em ouro, iluminação
radial subordinada ao número. Não foi localizada a gravação antiga do dono;
imagens/resultados públicos consultados, sem afirmar que o vídeo foi assistido.
Nenhum asset ou código dessas referências foi incorporado ao produto; avião e
King continuam os nossos. A cena revela pagamento confirmado, sem crash/aposta extra.

### Hélice em voo — prévia (08/11/2026)
Pás originais de `bonus-plane.webp` renderizadas em camada independente,
com `plane-propeller-mask.svg`; `plane-body-mask.svg` retira as pás das duas
camadas fixas sem alterar o arquivo-fonte. Giro de 110 ms no eixo do motor,
cópia defasada e disco translúcido sugerem desfoque; cubo dourado fixo à frente.
Todo o conjunto acompanha posição/rotação/escala do avião. Movimento reduzido
usa disco/pás difusas estáticos. Sem novo som, trajetória ou pagamento.

### Economia v3 nesta entrega (08/11)
Perfil compartilhado `cloud/circus-profile.cjs`: tabela em docs/ECONOMIA.md.
Novos giros da produção e da prévia usam slotVersion 3. Store/regras
aceitam recibos v3, preservando v1/v2. Happeach v3: chance 0,005 por
posição e especial mínima 20× na aposta média guardada. Dez giros/roleta e
quantidade de ingressos preservados; sem RTP global anunciado.
Voo apenas a partir de 20×, Mega em 35× e Super em 50×. Aposta de referência
é passada explicitamente à apresentação e à animação do número; não comparar
especial com a aposta atual do jogador. Demos continuam 20× e 200×: o espaço
agora usa tela cheia de nuvens (2,5 × 8 × 10), não tenda da tabela antiga.

### Estabilidade do voo espacial (08/11)
Fundo recortado por overflow, sem máscara de opacidade no contêiner inteiro;
camadas de céu/espaço isoladas e opacas durante a contagem. Arte decodificada
antes de usar. Hélice mantém o giro com transformação 2D; círculo luminoso
oscila suavemente entre 78% e 100%, sem filtro variável sobre o prêmio inteiro.
Destaque mantido sem pulsar grandes áreas de brilho sobre o fundo escuro.

## Tony Tiger — prévia v4 (09/11/2026)

Apenas a prévia pede slotVersion 4. Produção continua pedindo v3; não promover
sem avaliação do dono. Tony é exclusivo: três rostos em uma das oito linhas,
sem moedas, ingressos, Happeach ou especial junto. Não ocorre no décimo giro.
Chance de 1% em giros elegíveis, independente de ganhos anteriores; exige
saldo pós-aposta suficiente para três parcelas de pelo menos um centavo.
Roubo adicional = mínimo entre uma aposta e 5% do saldo após apostar, em
centavos inteiros. Total é salvo atomicamente no recibo do giro uma única vez.

Apresentação: linha/círculos vermelhos, 700 ms de antecipação, três contatos
separados por 1550 ms. Contato dispara três cortes pretos maiores, som, háptico, balanço
curto e redução animada no saldo. O fundo dos rolos recebe desfoque breve;
saldo e mostrador do prêmio continuam nítidos. Cada parcela aparece em vermelho
no mostrador original do prêmio aos pés do King, sem cartão extra. Movimento reduzido elimina o balanço.
Modal após o terceiro impacto mostra somente o total roubado e Continuar.
Auto é interrompido. Erro de animação, recarga ou repetição de requisição não
altera o desconto confirmado; recarga mostra o saldo real sem nova cobrança.

Demo exclusiva da carteira fictícia: `/circus?demo=tony`, primeiro giro por toque.
Core e regras já preparados para v4, mas regras NÃO publicadas nesta entrega.

## Tucker Toucan — demonstração visual (09/11/2026)

Prévia explícita `/circus?demo=tucker`, sem sorteio natural. Arte v1 provisória;
dono pediu testar mesmo sem gostar ainda. Trinca na linha central, sinalização
vermelha; ave pousa na alça, bate asas separadas do corpo e leva uma cópia da
cesta com seus itens/contador. Original fica invisível, deixando o espaço vazio
por 700 ms após a saída. Modal informa perda; Continuar restaura a cesta com
contagem atualizada. O modal reaproveita a apresentação aprovada do Tony.

Amostra: prepara 3 Happeach só uma vez, leva até 1 e preserva a proporção da banca
de apostas dos restantes. Cobra apenas a aposta normal, sem roubar moedas ou
ingressos. Recibo idempotente e restauração da carteira fictícia testados.
Persistência dessa demonstração existe só em prototypes/circus-preview;
cliente real, regras, geração natural e economia oficial permanecem iguais.

Ajuste Tucker (09/11): com zero Happeach, a trinca e a sequência completa
continuam disponíveis; roubo/contagem/banca permanecem zero, sem divisão por
zero. Modal informa que nenhum Happeach foi perdido. Pose de preensão v2 usa
ambos os pés juntos e ancora o centro das garras no topo da alça, sem deslocar
o personagem para a esquerda apenas para enquadrar a ponta da asa.

## Ray Raccoon — demonstração visual (09/11/2026)

`/circus?demo=ray`, primeiro giro por toque. Trinca diagonal com sinalização
vermelha; guaxinim de máscara aparece diretamente atrás do contador e foge
à esquerda levando o asset completo da placa. Sem passos ou bilhete avulso.
O lugar fica vazio até o modal/Continuar; a placa volta com até 1 ingresso a
menos. A contagem anterior acompanha a placa durante a fuga. Zero ingressos não bloqueia a cena.
Arte e quantidade em avaliação. Recibo salvo/deduplicado só na carteira
fictícia; sem alteração de Firestore/cliente real ou sorteio natural. Ver
[RAY-RACCOON.md](RAY-RACCOON.md). Não promover ao oficial por conta própria.

## Fundo do Circus — escolha 3 (09/11/2026)

Dono escolheu a opção 3, parque verde/azul com tendas laterais e gramado aberto,
sem caminhos. Integrada na prévia como circus-park-lawn-v1.webp, com preload
no manifesto do Circus. A imagem antiga permanece disponível para o parque;
a revisão não troca os cenários dos demais jogos nem reposiciona controles.
