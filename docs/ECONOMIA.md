# Economia de moedas — 27/10/2026

Versão `2026-10-27-fingo-double-v10`. A meta é devolver aproximadamente 98 moedas por
100 apostadas ao longo de muitas rodadas, contando o valor total dos prêmios.
Quando o retorno é 98%, isso representa uma perda esperada de 2% do volume apostado, não de 2% do saldo. O Fingo usa agora prêmio fixo de 2×: sua amostra por estratégia aparece abaixo e não deve ser anunciada como RTP de 98%.
Não significa ganhar 98% das partidas nem perder obrigatoriamente em cada sessão.
Bônus diários e recargas são entradas externas e ficam fora dessa conta.

As chances não consultam nome, saldo, lucro acumulado ou sequência de resultados.
Não há ajuste para punir quem ganhou nem derrotas agendadas para corrigir uma sessão.
O ajuste histórico que existia no Clown foi removido.

| Jogo | Retorno de referência | Condição |
| --- | ---: | --- |
| Circus / Machine | 98,000% teórico | Aposta constante; inclui linhas, telas cheias, mínimo e Rodada Especial |
| Wheel | 98,000% | Qualquer um dos 13 desenhos escolhidos |
| Clown | 98,000% | Dez arremessos válidos; alvo muda frequência e tamanho dos prêmios |
| Flying Clown | Até 98,000% | Melhor política de pegar/subir, incluindo Happeach |
| Pênalti | Até 98,000% | Chutes com qualidade máxima; precisão menor reduz o retorno |
| Fingo 5×5 | 102,08% observado | 20 mil cartelas, política que prioriza linhas adiantadas; não é prova de RTP teórico |
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

O Fingo agora usa cartela 5×5, sem casa livre, e vence com cinco números de uma
linha, coluna ou diagonal. Uma aposta continua valendo até 30 lançamentos. Os
cinco tubos são sorteados antes da consulta à cartela; a consulta não sorteia de
novo. A chance fixa de alcançar um tubo útil é 0,27 ao mirar no dourado, com fator
0,85 fora dele. O sorteio oferece números úteis de colunas diferentes; cada
marcação pode contribuir para linhas diferentes. Novas cartelas (`payoutVersion:3`) pagam 2× a aposta por qualquer quina, incluindo a aposta no prêmio total. Não há redução por bolas usadas. As chances de marcação foram mantidas nesta alteração.

A simulação de 20 mil cartelas, semente 90431, observou retorno de 102,08% e quina
em 51,04% usando uma política que prioriza linhas adiantadas. Escolher o primeiro
dourado observou 97,92% e 48,96%; escolher tubos aleatoriamente observou 17,48%
e 8,74%. São amostras do motor, não prova de estratégia ótima ou RTP teórico.
Não há ajuste de chance pelo saldo, pelo lucro ou pela sequência do jogador.
Reproduza com `node scripts/fingo-card-audit.mjs`.

`cardVersion:1` identifica a cartela nova. As cinco bases salvas geram seus 25
números de forma determinística; as marcas são índices de casas. As regras
verificam o número alcançado, uma única marca válida, a quina e o pagamento.
Cartelas antigas sem `cardVersion` mantêm os cinco alvos, chances e tabela já
contratados até encerrar. `payoutVersion:2` mantém a tabela mais recente; cartelas
anteriores a ela mantêm a tabela original. Veja [o fluxo e a validação](FINGO-CARTELA.md).

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
Os outros sete jogos mantêm sua matemática nesta revisão da cartela.

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
