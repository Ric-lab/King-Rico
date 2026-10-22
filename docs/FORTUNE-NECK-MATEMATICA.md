# Fortune Neck: saque cedo e retorno esperado

Sacar no primeiro ou segundo andar é uma estratégia permitida. O risco da
primeira subida já impede que ela dê lucro garantido. O sorteio usa as mesmas
chances para todos; não consulta nome, UID, saldo ou sequência de vitórias para
escolher uma derrota.

Com uma aposta de **10 moedas**, sem contar bônus recebidos fora da rodada:

| Estratégia | Chance de chegar | Crédito ao sacar | Lucro se chegar | Perda se falhar | Média por rodada |
| --- | ---: | ---: | ---: | ---: | ---: |
| Sacar no primeiro andar | 84,73% | 11 | +1 | −10 | −0,68 |
| Sacar no segundo andar | 77,67% | 12 | +2 | −10 | −0,68 |

As 11 ou 12 moedas são o crédito total, com a aposta já descontada. No primeiro
andar, a conta é aproximadamente `84,73% × 1 − 15,27% × 10 = −0,68`.
A chance de falhar na primeira subida é informada na tabela de pagamentos.
As partidas são independentes; uma sequência de vitórias não força a próxima
jogada a perder. A perda é uma expectativa estatística.

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

Na configuração auditada em 22/10/2026:

- A estratégia ótima com aposta de 10 retorna cerca de **95,36%** do apostado,
  considerando o Happeach: perda média de aproximadamente 0,46 moeda por rodada.
- O maior retorno ótimo entre todas as apostas permitidas é aproximadamente
  **98,00%**, com aposta de 1. Arredondamentos alteram o retorno das apostas pequenas.
- Todos os saques em andares fixos e todas as decisões ótimas de sacar/subir
  continuam com retorno esperado menor que 100%.

Não usar o parâmetro nominal de 93,20% como o retorno de qualquer estratégia:
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
