# Fortune Pênalti no Firebase Spark

O build publica `Fortune Penalty.dc.html`, `penalty3d.js` e o Three.js local já fixado no lockfile. A entrada pela Home usa o mesmo cliente Firebase e menu de Circus, Wheel, Neck e Fingo. A sessão Google existente é reutilizada.

No site com Firebase habilitado, o Pênalti lê somente o jogador do Firestore. Não importa saldo, aposta ou rodada antigos do localStorage. O campo opcional `penaltyRound` permite atualizar contas existentes sem migração: `{id, betUnits, step, ladderVersion: 2}` para novas rodadas; as antigas continuam sem `ladderVersion`. A aposta fica em centésimos de moeda, e o índice em `settings.penaltyBetIdx`.

Cada chute grava o resultado e o próximo degrau em uma transação antes da animação. O primeiro chute debita a aposta; os seguintes não debitam novamente. Erro encerra a rodada. Coletar ou acertar o décimo chute (quinto nas rodadas antigas) credita o prêmio na mesma transação, antes do modal e das moedas animadas. Atualizar a página retoma o degrau confirmado ou o saldo já liquidado.

O primeiro chute usa o UUID da rodada como ID da operação. Repetir o pedido devolve a operação imutável, inclusive após uma derrota imediata. Os demais pedidos usam o mecanismo existente de operações pendentes por conta: ID salvo antes do envio, recuperação após perda de resposta e rejeição de payload diferente com o mesmo ID. Transações validam ID, degrau e aposta atuais, inclusive entre abas. A recarga continua disponível abaixo de 1 moeda, preservando as rodadas em aberto.

A nova sequência é x1,5, x3, x5, x7, x10, x15, x20, x25, x50 e x100.
As dez placas aparecem em duas fileiras de cinco; o movimento da goleira progride
pela duração da tabela da rodada. A primeira chance de um chute com qualidade
máxima é `0,98 / 1,5`; as seguintes são a razão entre multiplicadores consecutivos.
A probabilidade teórica de alcançar x100 com qualidade máxima em todos os chutes
é 0,98%, e o retorno teórico em cada ponto de coleta permanece 98%. Chutes com
qualidade menor reduzem o retorno; não se trata de uma garantia por sessão.

Rodadas já abertas sem versão mantêm x1,2, x1,8, x3, x5 e x10 e encerram no quinto
gol. Motor, tela e regras usam a versão salva, sem reavaliar apostas antigas.
As regras impedem trocar a tabela no meio da rodada. Após encerrá-la, a próxima
aposta usa as dez etapas. Repetições recuperam a operação imutável original.

A mira e a força calculam uma qualidade entre 0 e 1.000; fora do gol, ela é zero.
O motor compartilhado sorteia o resultado com Web Crypto, e a cena anima esse
resultado confirmado. Como nos outros jogos Spark, sorteio e habilidade são
calculados no navegador: as regras validam posse, transições e valores, sem
servidor de sorteio confiável. São moedas virtuais sem dinheiro real.

Validação: `npm test`, `npm run test:integration` (regras reais emuladas e Chromium, incluindo os cinco jogos) e, por último, `npm run build:production`. O workflow `.github/workflows/firebase-hosting.yml` permanece responsável por testar, publicar regras pela API REST existente e publicar Hosting. Não há Cloud Functions, alteração de plano ou faturamento.
