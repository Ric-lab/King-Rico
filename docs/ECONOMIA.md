# Circus v5 — candidato validado localmente (11/11/2026)

Pedido mais recente do dono substitui a escala e as chances fixas do v4 apenas
para novas rodadas v5. A versão oficial v4 e seus recibos continuam preservados.

Multiplicadores por ID estável do atlas:
`[2.5,0.4,0.8,1.2,5,0,10,15,20,25]` (capa, tambor, tenda, nuvem,
trevo, cedro inativo, moeda, coroa, diamante, King Rico). Cedro removido do
sorteio, da fita transitória e da tabela; arquivos de arte mantidos. O ID 5 não
foi renumerado; recibos antigos ainda podem exibi-lo.

Limites novos: Tony 1–25× a aposta, até o saldo disponível pós-aposta; Tucker
1–4 Happeach, até o disponível; Ray 5–50% do estoque, arredondado para inteiros
(mínimo 1 com estoque positivo; zero sem ingressos). Uma unidade ×50% arredonda
para 1. Cada sorteio usa normal truncada simétrica no intervalo EFETIVO, com
média no meio e desvio (máximo−mínimo)/8. Limites de recurso e orçamento são
aplicados antes da amostra, sem concentrar perdas no teto. Três parcelas do
Tony somam exatamente a perda; não há outro prêmio junto ao evento.

Controle persistente por jogador, separado do saldo disponível: `park.economy`
guarda apostas, créditos base/especial/extra da roleta, perdas do Tony, ingressos
emitidos e roubados pelo Ray. Ingressos são avaliados em 25 moedas. Recargas,
raspadinhas, presentes e prêmios de outras atrações não entram no retorno.
Orçamento de roubo = máximo(0, retorno acumulado anterior − 90% das apostas
incluindo a atual). Sem excedente, não sorteia vilão. Com excedente, probabilidade
condicional 50–85%, aumentando com pressão do retorno e saldo em apostas; a
escolha entre vilões respeita os recursos e limites. Tony/Ray não podem levar
mais que esse excedente; Tucker reduz proporcionalmente a reserva da cesta.
Frequência efetiva é resultado do controle, NÃO chances fixas de 5/2,5/2,5%.
Na auditoria final, Tony ficou em 0,059–0,113%, Tucker em 0,064–0,167% e Ray
em 0,049–0,115% de TODOS os giros. Com a tabela menor e a roleta financiada, o
excedente precisa de poucas perdas. O pedido de mais aparições não resultou em
maior frequência efetiva que a v4; aumentar chances fixas aqui faria o retorno
cair abaixo da meta. Não anunciar que os vilões ficaram mais frequentes.

Auditoria reproduzível: `node scripts/economy-audit.mjs --circus-v5 --spins=5000000 --bets=1,10,100,1000`.
Relatório e hashes: `circus-economy-v5-audit.json`; seed 472831, 20 milhões de
rodadas no total. Créditos extras da roleta entram apenas uma vez no histórico,
inclusive na carteira de teste. A roleta continua no décimo giro. Sua `prizeVersion:4` tem base = 4% da soma
das apostas efetivamente registradas no ciclo (`cycleWagerUnits`); o multiplicador
é aplicado a essa base e seu resultado INTEIRO é creditado no sorteio da roda,
pois essa base ainda não foi paga. O prêmio normal do décimo giro é sorteado e
pago normalmente, sem forçar outra grade vencedora. Todos os giros do ciclo,
incluindo perdas/vilões, contribuem; replay não contribui de novo. Fechar a roda
zera o acumulador, e alterá-lo isoladamente é proibido pelas regras. Uma roda
antiga v3 mantém base/crédito originais. No primeiro ciclo após migração não se
inventam apostas passadas: só contribuições registradas entram na base v5.

| Aposta | Giros | Moedas + ingressos emitidos − Tony | Também descontando Ray |
|---:|---:|---:|---:|
| 1 | 5.000.000 | 90,176344% | 89,997844% |
| 10 | 5.000.000 | 90,146887% | 89,988937% |
| 100 | 5.000.000 | 90,138050% | 89,980025% |
| 1000 | 5.000.000 | 90,156199% | 89,996197% |

**Brecha corrigida com autorização do dono (aposta continua livre):** a versão
intermediária que garantia um prêmio sobre a aposta do décimo giro retornava
300,704332% quando a pessoa apostava 1 nove vezes e 1000 na última. Foi rejeitada
e não foi publicada. A nova base de 4% das apostas acumuladas mantém o prêmio
normal separado e remove essa vantagem de concentração. Testes finais, seed
51421, 1.000.000 de giros por estratégia:

| Estratégia | Retorno bruto | Também descontando Ray |
|---|---:|---:|
| Alternar 1/1000 | 90,090864% | 89,949900% |
| Nove apostas 1 + décima 1000 | 89,899573% | 89,897566% |

Reprodução: `node scripts/circus-control-sessions.mjs`; resultados em
`circus-economy-v5-stake-stress.jsonl`. O gate automatizado exige as duas
estratégias e as quatro apostas constantes entre 88,5–91,5% e abaixo de 100%.


A v4 foi reexecutada nas mesmas quatro apostas e cinco milhões por aposta;
retornos idênticos aos aprovados, relatório `circus-economy-audit.json`. O build
oficial continua usando recibos/versionamento; novo cliente v5 somente deverá
ser promovido quando todos os gates, inclusive o problema acima, fecharem.
Spark mantém sorteio no navegador: regras protegem limites, contabilidade e
replay, mas não atestam aleatoriedade num cliente adulterado.

---

# Economia — auditoria vigente do Circus (10/11/2026)

Esta seção substitui, para o Circus v4, as metas e tabelas históricas abaixo.
Meta autorizada: 90% ±1,5 considerando moedas base/especial + extra da roleta
− roubo do Tony + ingressos emitidos a 25 moedas cada. Créditos diários,
recargas e entradas/resgate de ingressos não entram no denominador.
Perdas de ingressos do Ray são divulgadas separadamente, sem escondê-las no RTP.

| Aposta | Giros | Retorno total | Após perdas de ingressos do Ray |
|---:|---:|---:|---:|
| 1 | 5,000,000 | 90.302045% | 90.147545% |
| 10 | 5,000,000 | 90.317389% | 90.175939% |
| 100 | 5,000,000 | 89.710473% | 89.562948% |
| 1000 | 5,000,000 | 89.437801% | 89.381376% |

Execução: `node scripts/economy-audit.mjs --circus-v4 --spins=5000000 --bets=1,10,100,1000`.
Seed 472831, banca inicial fictícia de 5 bilhões de moedas, sem reposição. Estado
de Happeach, banca de Happeach, ingressos e contador da roleta persistem entre
giros. O décimo giro e o extra da roleta usam o motor real; nenhum usuário real
ou Firestore de produção foi usado. Resultados, componentes e IC95% por lotes
em [circus-economy-audit.json](circus-economy-audit.json), com SHA-256 das fontes.
É estimativa de longo prazo na estratégia descrita, não promessa por sessão.

PAYS finais: `[8.576, 0.4, 0.8, 4.992, 1.92, 11.52, 17.28, 32, 43.52, 115.2]`.
Tambor 0,4 e tenda 0,8 preservados; os outros oito símbolos receberam a mesma
escala 1,28 sobre a base 64c4142, com precisão de três casas. Divisor de
ingressos: `bet / 40000`, teto 14% preservado. Isso torna as trincas que dão
ingressos menos frequentes; os ingressos avulsos decorativos não mudaram.

Vilões preservados: Tony 5%, Tucker 2,5%, Ray 2,5% nos giros elegíveis; décimo
reservado à roleta. Tony continua com até 1,5 aposta e teto de 5% pós-aposta.
As regras Firestore apenas acompanham esse limite já presente no motor e o
máximo da tabela (8 × 115,2 × 10 = 9216×); tetos v1/v2 continuam intactos.
`TARGET_COIN_RTP=.80` veio da base do Claude e é metadado, não controle do
sorteio. O critério de aceitação desta revisão é o total auditado de 88,5–91,5%.

A base 64c4142 foi auditada com os mesmos 5 milhões por aposta: 86,587764%,
86,223674%, 82,052235% e 74,740784%. Dados em
[circus-economy-before.json](circus-economy-before.json). Uma tentativa com divisor
20000 ainda deu 88,355373% na aposta 1000 e foi rejeitada, sem publicação.

## Registros anteriores — histórico

# Economia de moedas — Circus v3

Visual e pagamentos publicados em king-rico.web.app pelo commit 7e41b89 em
08/11/2026, com autorização explícita do dono. Esta entrega
ativa slotVersion 3 para novos giros; recibos antigos mantêm os pagamentos salvos.

## Perfil v3 — Circus (08/11/2026)

Perfil em `cloud/circus-profile.cjs`, oito linhas preservadas. Multiplicadores
abaixo são sobre a **aposta total**, incluindo seu valor devolvido; não são lucro.

| Símbolo | Prêmio por trinca / aposta total |
| --- | ---: |
| Bumbo | 0,6× |
| Tenda | 1× |
| Trevo | 1,6× |
| Nuvem | 2,5× |
| Capa | 4× |
| Cetro | 5× |
| Moeda | 8× |
| Coroa | 15× |
| Diamante | 20× |
| King Rico / curinga | 50× |

Os prêmios das linhas são somados e tela cheia preserva ×10. Máximo teórico v3:
8 × 50 × 10 = 4.000 apostas; versões 1/2 mantêm 1.665/2.664 e tabelas antigas.
Sorteio normal conserva os pesos dos dez ícones. Happeach tem chance 0,005 por
posição antes do limite de duas; sua especial usa a média das apostas salvas e
mínimo de 20× nessa referência. Nenhum ajuste por lucro, saldo ou histórico.
Ingressos avulsos/trincas e roleta atual foram preservados.

### Quando aparece o voo

Grande prêmio a partir de 20×; Mega a partir de 35×; Super a partir de 50×.
Sempre dividir o prêmio pela aposta daquela rodada — na especial, a aposta
média salva. Valor absoluto não classifica: 1.200 com aposta 1.000 é retorno
normal; 20 com aposta 1 já é Grande Prêmio. Retornos menores contam na barra,
sem avião; não apresentar prêmio abaixo da aposta como lucro.

### Amostra reproduzível

`node -e "console.log(require('./scripts/circus-lines-audit.cjs').audit(3,5000000,17843))"`
Resultado em [circus-v3-audit.json](circus-v3-audit.json): cinco milhões de giros,
aposta fixa de 10, semente 17843. Retorno em moedas **95,313%**: base 56,078%,
especial Happeach 21,762%, extra da roleta 17,474%. Intervalo amostral aproximado
por lotes de 10 mil: 94,843%–95,784%; não é prova teórica de RTP.
42,599% dos giros pagaram algo na base; 16,017% tiveram crédito total maior que
a aposta. Cerca de 0,979% das apresentações elegíveis foram Grande/Mega/Super
(aproximadamente uma a cada 102 giros, contando especiais).

**Limites:** aposta constante; não inclui resgate dos ingressos, anúncios,
raspadinha/recargas nem estratégias de mudar a aposta perto da roleta. O valor
fixo da entrada do parque e o progresso por número de giros precisam de auditoria
própria antes de alegar um RTP global ou promover a economia para produção.

### Referência Fortune Tiger

Ficha PG Soft: https://www.pgsoft.com/uploads/Games/Pdf/Fortune_Tiger_Gameinformation_EN.pdf
Tabela transcrita com aposta por linha e total:
https://casinoreview.click/rules/fortune-tiger/ . Faixas de Big/Mega/Super na
ficha também indexada em https://www.scribd.com/document/718306517/Fortune-Tiger-Gameinformation-EN .
Coeficientes por linha: laranja 3, fogos 5, envelope 8, bolsa 10, ornamento 25,
lingote 100, curinga 250. Como há cinco linhas, isso equivale respectivamente a
0,6×, 1×, 1,6×, 2×, 5×, 20× e 50× da aposta total. A ficha informa RTP de 96,81%
na configuração de referência e prêmios por categoria 20/35/50×. Pesos e
probabilidades proprietárias não foram inferidos da tabela. O Circus usa nosso
perfil e simulação, sem anunciar que reproduz a matemática do Tiger.

## Referência histórica anterior (29/10/2026)

Versão `2026-10-28-fingo-free-v11`. A meta é devolver aproximadamente 98 moedas por
100 apostadas ao longo de muitas rodadas, contando o valor total dos prêmios.
Quando o retorno é 98%, isso representa uma perda esperada de 2% do volume apostado, não de 2% do saldo. O Fingo usa agora prêmio fixo de 2×: sua amostra por estratégia aparece abaixo e não deve ser anunciada como RTP de 98%.
Não significa ganhar 98% das partidas nem perder obrigatoriamente em cada sessão.
Bônus diários e recargas são entradas externas e ficam fora dessa conta.

As chances não consultam nome, saldo, lucro acumulado ou sequência de resultados.
Não há ajuste para punir quem ganhou nem derrotas agendadas para corrigir uma sessão.
O ajuste histórico que existia no Clown foi removido.

A tabela abaixo descreve as versões anteriores à integração do [parque](PARQUE.md).
O Circus com ingressos, prêmio no décimo giro e roleta multiplicadora altera o
retorno total; **98% não descreve esse conjunto**. O Fingo rápido tem dez bolas;
a amostra de trinta bolas abaixo não estima seu retorno. As rodadas já pagas
continuam com suas versões originais.

| Jogo | Retorno de referência | Condição |
| --- | ---: | --- |
| Circus / Machine | 98,000% teórico | Aposta constante; inclui linhas, telas cheias, mínimo e Rodada Especial |
| Wheel | 98,000% | Qualquer um dos 13 desenhos escolhidos |
| Clown | 98,000% | Dez arremessos válidos; alvo muda frequência e tamanho dos prêmios |
| Flying Clown | Até 98,000% | Melhor política de pegar/subir, incluindo Happeach |
| Pênalti | Até 98,000% | Chutes com qualidade máxima; precisão menor reduz o retorno |
| Fingo 5×5 | 96,94% observado | 20 mil cartelas, política de cobertura física; amostra, sem prova de estratégia ótima |
| Neck | Até 98,000% | Melhor política de sacar/subir, incluindo Happeach e arredondamentos, entre todas as apostas legais |
| Fortune 33 | 98% na política de referência | Cartas dirigidas para pedir abaixo de 28 e parar a partir de 28; decisões diferentes alteram o resultado |

O Neck retorna cerca de 93,20% ao sacar sempre no primeiro andar com aposta de
10. Não se deve confundir esse caso com a política ótima que considera a garantia.
Flying e Neck compartilham `cloud/ladder.cjs`: Happeach aparece em 1/8 das rodadas;
ao alcançá-lo, o prêmio inteiro daquele andar fica guardado e uma queda posterior
paga esse valor, sem somar ao prêmio de pegar. Depois da garantia, a chance de
avançar recebe fator 0,85. Não há influência do histórico. A localização sorteada
é 6–20 no Neck e 2–7 no Flying, respeitando suas tabelas e durações próprias.
O Flying mantém dez balões e pagamentos em centavos; o Neck mantém 33 andares e
seu arredondamento de prêmio em décimos. As bases calibradas são respectivamente
0,935419176 e 0,9320338677939342. Sacar sempre no primeiro balão do Flying retorna
93,54%; a política ótima com a garantia chega a 98%. Rodadas Flying antigas sem
`ladderVersion:2` continuam sem proteção e com as chances já contratadas.
No Clown, errar a mira pode reduzir o retorno. O 21 antigo e os protótipos
guardados Bounce, Claw e Race conservam sua matemática anterior.

## Ritmo de prêmios

### Auditoria do Circus com parque (07/11/2026, somente prévia)

`node scripts/circus-lines-audit.cjs` simula 100 mil giros de aposta 10 por
versão, com semente 17843. Inclui Happeach, prêmio garantido no décimo giro e
extra da roleta; exclui o valor de uso dos ingressos. Resultado reproduzível
em [circus-lines-audit.json](circus-lines-audit.json):

| Versão | Retorno em moedas | Giros com prêmio-base |
| --- | ---: | ---: |
| Parque atual, cinco combinações | 141,22% | 33,03% |
| Prévia `slotVersion:2`, oito combinações | 189,92% | 42,29% |

São estimativas dessa amostra, não provas de RTP. Nenhum peso, multiplicador
ou bônus foi recalibrado nesta revisão. A prévia acrescenta colunas e ingressos
avulsos; a produção conserva a versão anterior. **Não promover esta mudança à
main antes de revisar o retorno do conjunto.** Os percentuais históricos abaixo
não descrevem o Circus com parque.

A Wheel paga outro desenho da mesma cor em **×2**, com probabilidade de 36,5%;
desenho exato continua **×10**, com 2,5%. Somam 39% de rodadas com prêmio.
Escolher Fortune mantém **×25**, com 3,92%. Assim há uma opção de prêmios menores
e mais frequentes e outra mais rara.

O Circus mantém seus símbolos, cinco linhas e animações. O cálculo exato separa
73,304% de retorno do jogo base e 24,696% da Rodada Especial. A especial chega,
em média, a cada 68,01 giros e paga em média 16,79 vezes sua aposta de referência.
A linha de bumbos agora paga 1,2× em vez de apenas devolver a aposta. O peso
do curinga e a frequência de Happeach compensam a mudança, preservando 98%
a longo prazo. Isso melhora o valor do acerto comum, sem prometer mais acertos.
Cada Happeach guarda a aposta que o coletou; o prêmio usa a média dos cinco.
Coletar quatro com aposta pequena e aumentar apenas na ativação não multiplica
as quatro contribuições antigas. O sexto Happeach já pertence ao próximo ciclo.
Contadores antigos sem essa informação começam com a referência da aposta atual.

Fortune 33 paga **2,08×** incluindo a aposta nas novas mãos; empates devolvem a
aposta. Mãos antigas já abertas mantêm seu fator salvo (ou **2×** quando ainda não havia fator). O fator fica salvo e imutável na mão.
O baralho contém 52 cartas e quatro cópias de cada rank de 1 a 13. A distribuição é dirigida na abertura e permanece fixa. A banca reage à pontuação do jogador, podendo parar abaixo de 27 ou comprar acima de 27; em empate alto, preserva o empate. Mãos antigas conservam a política em 27.

O Fingo atual usa cartela 5×5 com **coringa King Rico no centro** e vence com
linha, coluna ou diagonal completa. Uma aposta dá até 30 lançamentos e paga
**2×** por qualquer quina, incluindo a aposta. Números já marcados não contam de
novo. O sorteio oferece pelo menos uma opção útil; cada coluna tem probabilidade
base de 0,16 de número útil antes dessa garantia.

Nas novas cartelas (`cardVersion:2`, `payoutVersion:3`), o destino é sorteado
uniformemente entre 64 quedas físicas da entrada escolhida. Qualquer dourado
atingido marca seu próprio número, sem um sorteio separado que vete o acerto.
A animação reproduz uma trajetória correspondente ao resultado salvo.

A [auditoria física registrada](fingo-physical-audit.json), com 20 mil partidas
por política e semente 90431, observou:

| Política de referência | Retorno observado | Partidas com quina |
|---|---:|---:|
| Cobertura física | 96,94% | 48,47% |
| Linhas adiantadas | 93,53% | 46,765% |
| Primeiro dourado | 87,55% | 43,775% |
| Entrada aleatória | 21,60% | 10,80% |

São amostras de estratégias específicas, sem prova de RTP teórico ou de política
ótima. A entrada aleatória é um controle da auditoria, não representa a escolha
orientada da interface. O relatório `fingo-card-audit.json` registra o motor
anterior e não deve ser usado como retorno atual. Reproduza a revisão atual com
`node scripts/fingo-card-audit.mjs`; veja [o fluxo e a validação](FINGO-CARTELA.md).
Não há ajuste pelo saldo, lucro ou sequência do jogador.

Cartelas salvas com `cardVersion:1`, sem versão ou com pagamentos antigos mantêm
suas regras até encerrar; não recebem a matemática nova no meio da aposta.
As regras verificam o número alcançado, a marcação, a quina e o pagamento.

Tabela apenas de cartelas já pagas na versão 2 (novas pagam sempre 2×):

| Bola da quina | Prêmio total / aposta |
| --- | ---: |
| 5 | 50× |
| 6–7 | 15× |
| 8–9 | 8× |
| 10–12 | 5× |
| 13–15 | 3,5× |
| 16–18 | 2,5× |
| 19–21 | 2× |
| 22–24 | 1,5× |
| 25–27 | 1,2× |
| 28–30 | 1× |

No Clown, retornos abaixo da aposta aparecem como “RETORNO PARCIAL” e a devolução
como “APOSTA DEVOLVIDA”. Seus valores e probabilidades não mudaram.
A revisão física do Fingo não alterou a matemática dos outros jogos.

## Auditoria reproduzível

`npm run audit:sessions -- --compare-ref 0c3c12e` compara os oito jogos em sessões
curtas com o código anterior. Veja [o relatório de sessões](BALANCEAMENTO-DE-SESSOES.md).
Recargas de 1.000, bônus diário e tempo do anúncio não mudaram.

`npm run audit:economy` usa o motor publicado e produz JSON com expectativas,
frequências, simulações e sessões. `npm run audit:neck` verifica todas as apostas,
todos os andares e uma política ótima consciente da garantia por programação dinâmica.
`node scripts/flying-audit.mjs` aplica a mesma auditoria ao Flying, incluindo a garantia conhecida e todas as apostas.
As fronteiras de sorteio são verificadas na grade de 32 bits do Web Crypto.

O Circus é calculado por máscaras de Happeach, probabilidades das linhas e
enumeração dos estados finais da especial, incluindo curinga, tela cheia e mínimo.
A simulação não substitui esse cálculo: jackpots raros fazem amostras grandes
oscilarem. Amostras finitas podem oscilar em torno do RTP teórico de 98%.
Sessões curtas que começam sem Happeach acumulado ainda têm parte do valor
na coleção incompleta; seu retorno em caixa não representa o RTP de longo prazo.

No 33 v2, a distribuição seleciona o resultado de referência com 8% de empates,
`(0,98 − 0,08) / 2,08` de vitórias e o restante de derrotas, preparando um baralho
compatível com esse duelo. O jogador continua livre para pedir ou parar em outro
ponto, alterando o resultado; as cartas reveladas nunca são substituídas. A
política da banca depende da pontuação do jogador e do risco de estourar em empate.
`npm run audit:economy` simula os limiares de parada; não representa prova de
estratégia ótima para todas as decisões possíveis.

Também são simuladas 2 mil sessões de até 100 rodadas, começando com 1.000 e
apostando 10, sem recargas. Os percentis e a proporção de sessões que terminam acima do saldo inicial
são emitidos pelo comando para cada versão do motor. A perda esperada permite sessões vencedoras.

Os testes verificam arredondamentos, pagamentos, contribuição dos Happeach,
replay, duas abas/dispositivos e retomada de mãos antigas nas regras reais do
Firestore emulado. O build de produção e a publicação usam o workflow existente.

O Firebase continua no Spark: o navegador calcula o sorteio; as regras verificam
as transições e os pagamentos, mas não comprovam a honestidade de um cliente
adulterado. A auditoria pressupõe o motor original e moedas virtuais.

## Tony v4 — somente prévia (09/11/2026)

Tabela de símbolos v3 preservada. V4 adiciona evento exclusivo do Tony em 1%
dos giros elegíveis (fora do décimo; saldo suficiente para três parcelas).
Desconto adicional de até uma aposta, limitado a 5% do saldo pós-aposta.
Sem prêmio, Happeach ou ingresso simultâneo. A aposta normal continua sendo
cobrada; as três patadas dividem apenas o roubo adicional, salvo no mesmo recibo.

Simulação reproduzível: `require('./scripts/circus-lines-audit.cjs').audit(4,1000000,17843)`.
Dados em circus-tony-preview-audit.json: 9.004 eventos em um milhão de giros,
retorno líquido em moedas de 93,997%, intervalo por lotes ~92,919–95,076%.
Inclui roleta/Happeach e subtrai roubo; aposta fixa 10, saldo alto fixo para testar
o teto de uma aposta. Exclui utilidade/resgate de ingressos, presentes, recargas
e estratégias de variar aposta. Não é RTP teórico/global nem garante uma sessão.
Oficial continua v3; esta amostra não autoriza promoção à main.

## Integração oficial dos três vilões — 09/11/2026

Autorizada a publicação do conjunto da prévia. Cliente Circus v4: faixa fixa
de 1% total dividida igualmente entre Tony, Tucker e Ray (aprox. 0,333% cada)
fora do décimo giro. Sem ajuste por histórico, perdas ou comportamento.
Tony só dispara com saldo para três parcelas; mantém teto de uma aposta e 5%
do saldo pós-aposta. Tucker leva até 1 Happeach e remove a fração correspondente
da banca de Happeach, arredondada em centavos. Ray leva até 1 ingresso.
Com zero recurso, Tucker/Ray fazem a cena com perda zero. Todos são exclusivos:
só a trinca vermelha, aposta normal, sem prêmio ou bônus simultâneo. Não
interrompem o décimo giro/roleta. As versões antigas conservam seus resultados.

Recibo, saldo, Happeach e ingressos são gravados atomicamente nas mesmas
transações/IDs existentes; regras verificam valores, grade e recurso afetado.
Apresentação nunca realiza o débito. Demos forçadas permanecem só na prévia.

Simulação fixa de 1.000.000 de giros (seed 17843, aposta 10, saldo alto para o teto do Tony): retorno líquido em moedas de 92.741%; intervalo por lotes [91.770%, 93.712%].
Inclui roleta e Happeach, subtrai Tony, exclui resgate/utilidade de ingressos,
presentes/recargas e estratégias de mudar aposta. Não é retorno garantido nem
RTP global. Dados: docs/circus-villains-audit.json. Antigos relatórios v3 e
Tony isolado continuam históricos; tabela de multiplicadores v3 preservada.
