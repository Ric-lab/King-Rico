# Economia de moedas — 22/10/2026

Versão `2026-10-23-guided-v6`. A meta é devolver aproximadamente 98 moedas por
100 apostadas ao longo de muitas rodadas, contando o valor total dos prêmios.
Isso representa uma perda esperada de 2% do volume apostado, não de 2% do saldo.
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
| Flying Clown | 98,000% | Parar em qualquer andar fixo |
| Pênalti | Até 98,000% | Chutes com qualidade máxima; precisão menor reduz o retorno |
| Fingo | 98,006% | Mirar sempre em um tubo dourado |
| Neck | Até 98,000% | Melhor política de sacar/subir, incluindo Happeach e arredondamentos, entre todas as apostas legais |
| Fortune 33 | 98% na política de referência | Cartas dirigidas para pedir abaixo de 28 e parar a partir de 28; decisões diferentes alteram o resultado |

O Neck retorna cerca de 93,20% ao sacar sempre no primeiro andar com aposta de
10. Não se deve confundir esse caso com a política ótima que considera a garantia.
No Clown, errar a mira pode reduzir o retorno. O 21 antigo e os protótipos
guardados Bounce, Claw e Race conservam sua matemática anterior.

## Ritmo de prêmios

A Wheel paga outro desenho da mesma cor em **×2**, com probabilidade de 29%;
desenho exato continua **×10**, com 4%. Somam 33% de rodadas com prêmio.
Escolher Fortune mantém **×25**, com 3,92%. Assim há uma opção de prêmios menores
e mais frequentes e outra mais rara.

O Circus mantém seus símbolos, cinco linhas e animações. O cálculo exato separa
73,554% de retorno do jogo base e 24,446% da Rodada Especial. A especial chega,
em média, a cada 68,48 giros e paga em média 16,74 vezes sua aposta de referência.
Cada Happeach guarda a aposta que o coletou; o prêmio usa a média dos cinco.
Coletar quatro com aposta pequena e aumentar apenas na ativação não multiplica
as quatro contribuições antigas. O sexto Happeach já pertence ao próximo ciclo.
Contadores antigos sem essa informação começam com a referência da aposta atual.

Fortune 33 paga **2,08×** incluindo a aposta nas novas mãos; empates devolvem a
aposta. Mãos antigas já abertas mantêm **2×**. O fator fica salvo e imutável na mão.
O baralho contém 52 cartas e quatro cópias de cada rank de 1 a 13. A distribuição é dirigida na abertura e permanece fixa. A banca reage à pontuação do jogador, podendo parar abaixo de 27 ou comprar acima de 27; em empate alto, preserva o empate. Mãos antigas conservam a política em 27.

## Auditoria reproduzível

`npm run audit:economy` usa o motor publicado e produz JSON com expectativas,
frequências, simulações e sessões. `npm run audit:neck` verifica todas as apostas,
todos os andares e uma política ótima consciente da garantia por programação dinâmica.
As fronteiras de sorteio são verificadas na grade de 32 bits do Web Crypto.

O Circus é calculado por máscaras de Happeach, probabilidades das linhas e
enumeração dos estados finais da especial, incluindo curinga, tela cheia e mínimo.
A simulação não substitui esse cálculo: jackpots raros fazem amostras grandes
oscilarem. Na amostra fixa de 500 mil giros, semente 472831, o retorno observado
foi 96,65%, com prêmio em 30,53% dos giros; isso não altera o RTP teórico de 98%.

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
