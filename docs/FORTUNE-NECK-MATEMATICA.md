# Fortune Neck: saque cedo e retorno esperado

Sacar no primeiro ou segundo andar é uma estratégia permitida. O risco da
primeira subida já impede que ela dê lucro garantido. O sorteio usa as mesmas
chances para todos; não consulta nome, UID, saldo ou sequência de vitórias para
escolher uma derrota.

Com uma aposta de **10 moedas**, sem contar bônus recebidos fora da rodada:

| Estratégia | Chance de chegar | Crédito ao sacar | Lucro se chegar | Perda se falhar | Média por rodada |
| --- | ---: | ---: | ---: | ---: | ---: |
| Sacar no primeiro andar | 80% | 11 | +1 | −10 | −1,20 |
| Sacar no segundo andar | 73,33% | 12 | +2 | −10 | −1,20 |

As 11 ou 12 moedas são o crédito total, com a aposta já descontada. No primeiro
andar, a conta é `80% × 1 − 20% × 10 = −1,20`. A chance de falhar na primeira
subida é informada na tabela de pagamentos do jogo.

Com 20% de falha por rodada independente, a distribuição geométrica dá uma
média de `80% / 20% = 4` vitórias antes de uma derrota. Quatro vitórias de
1 moeda e uma derrota de 10 somam −6 moedas. Isso não obriga o sorteio a
interromper uma sequência na quarta vitória: sequências mais longas continuam
possíveis. A perda é uma expectativa estatística, não uma garantia de que cada
pessoa ou janela de partidas terminará perdendo.

Para esse saque de 11 numa aposta de 10, o ponto de equilíbrio é uma chance de
falha de `1 / 11 ≈ 9,09%`. Acima disso o valor esperado já é negativo; não é
necessário acompanhar o histórico do jogador para penalizar a estratégia.

## Happeach e arredondamento

`npm run audit:neck` audita o motor de produção, sem contas reais ou alterações
de saldo. Ele mede as fronteiras dos sorteios na grade uniforme de 32 bits do
Web Crypto, inclui os pagamentos reais arredondados e a posição do Happeach.
Uma programação dinâmica compara sacar e subir em todos os andares, assumindo
que o jogador conhece a garantia após pagar a aposta. Assim, cobre uma
estratégia melhor que simplesmente escolher um andar fixo.

Na configuração auditada em 14/10/2026:

- A estratégia ótima com aposta de 10 retorna cerca de **90,04%** do apostado,
  considerando o Happeach: perda média de aproximadamente 1 moeda por rodada.
- O maior retorno ótimo entre todas as apostas permitidas é aproximadamente
  **92,53%**, com aposta de 1. Arredondamentos alteram o retorno das apostas pequenas.
- Todos os saques em andares fixos e todas as decisões ótimas de sacar/subir
  continuam com retorno esperado menor que 100%.

Não usar o parâmetro nominal de 88% como o retorno de qualquer estratégia:
garantia e arredondamentos mudam o resultado. Os testes incluem um motor com
pagamentos dobrados para verificar que a auditoria detecta lucro esperado positivo.

## Sair, voltar e limites da economia

A aposta e o resultado são gravados antes da animação. Fechar a página não
devolve a aposta perdida. Uma resposta interrompida usa a mesma operação;
recuperar essa operação não sorteia de novo nem cobra outra vez. Uma rodada
ativa conserva aposta, andar e garantia entre acessos. Trocar a aposta no meio
da rodada ou cobrar o mesmo prêmio novamente é rejeitado.

Os bônus diários adicionam moedas à mesma carteira: 50, 100, 150, 200, 250, 500
e 1.000 ao longo da sequência de sete dias. Eles somam 2.250 por ciclo e podem
compensar perdas de quem joga pouco. Portanto, retorno negativo no Neck não
implica saldo zero, principalmente com bônus e resultados dos outros jogos.

Esta auditoria pressupõe sorteios honestos do motor. Na arquitetura atual, o
navegador calcula os sorteios; as regras do Firestore protegem propriedade,
transições e pagamentos, mas não comprovam a aleatoriedade contra código
adulterado. Proteger contra essa adulteração exige uma fonte de resultados
confiável fora do navegador. Nenhuma perseguição individual ou sequência de
derrotas forçadas foi adicionada.
