> **Amostra histórica de balanceamento.** O texto e os dados refletem a revisão descrita, não o estado de todas as revisões posteriores. Para o motor atual, consulte [Economia](ECONOMIA.md).

# Balanceamento de sessões — 26/10/2026

Comparação do motor de `0c3c12e` com `2026-10-26-session-v8`.
Oito jogos auditados; pagamentos ajustados apenas em Circus, Wheel e Fingo.
O objetivo é dar valor ao acerto comum e reduzir a concentração dos pagamentos,
sem depender de derrotas programadas nem mudar chances conforme o histórico.

## Resultados de sessões curtas

1.000 sessões por caso, semente 197803, saldo inicial 1.000, aposta 10 e até
20 rodadas completas; sem bônus, recargas ou anúncios. Valores arredondados.
“Lucro” significa prêmio total maior que a aposta. Devolver a aposta não conta
como lucro. No Fingo, uma rodada é uma cartela completa, com até 30 bolas.

| Caso | Rodadas com lucro: antes → depois | Qualquer retorno: antes → depois | Saldo final mediano: antes → depois |
| --- | ---: | ---: | ---: |
| Circus | 14,7% → 28,4% | 29,4% → 28,4% | 930 → 933 |
| Wheel, símbolo comum | 33,1% → 39,0% | 33,1% → 39,0% | 980 → 980 |
| Fingo, mira dourada | 21,1% → 40,3% | 28,1% → 50,0% | 990 → 989 |
| Fingo, tubo aleatório | 6,8% → 30,3% | 9,6% → 38,7% | 850 → 939 |

No Circus, os acertos de bumbos que apenas devolviam a aposta passam a 1,2×.
O total de giros premiados fica ligeiramente menor; a proporção de ganhos reais
cresce. A especial continua chegando em média a cada 68 giros. Começando uma
coleção vazia, boa parte de seu valor ainda está pendente após apenas 20 giros:
o retorno em caixa dessa sessão não deve ser confundido com o RTP teórico.

Na Wheel, ×2 fica mais frequente e ×10 menos frequente. Fortune ×25 é preservado.
No Fingo, a cartela completa aparece mais vezes, com a tabela de prêmios reduzida
para compensar. Mirar fora do dourado continua pior, mas a penalidade cai de 40%
para 15%. O 50× passa a ser alcançável na quinta bola. Cartelas antigas mantêm
sua versão até o fim, inclusive quando retomadas em outra página ou aparelho.

Os três mantêm 98% de retorno teórico nas condições descritas em
[ECONOMIA.md](ECONOMIA.md). Os outros cinco mantêm os pagamentos anteriores.
O Clown ganha rótulos corretos para retorno parcial e devolução de aposta.
Recarga de 1.000 e recompensa diária são preservadas.

## Reprodução e limites

```sh
npm run audit:sessions -- --compare-ref 0c3c12e
npm run audit:economy
```

Os [dados completos](economia-sessoes.json) incluem aposta 50, políticas diferentes,
mira de Pênalti menos precisa e limite de 100 ações além das sessões de 20 rodadas.
Ações são decisões, não segundos: uma cartela do Fingo exige bem mais ações que
um giro. A rodada iniciada pode ultrapassar o limite de ações, para contabilizar
seu resultado completo. As políticas e sementes ficam no script.

São simulações do motor, não evidência de retenção, receita de anúncios ou prazer
real. Não garantem uma sessão vencedora e não provam a estratégia ótima em todos
os jogos. O próximo feedback deve observar clareza dos resultados, duração real,
incômodo das esperas e vontade de jogar novamente. Mudanças futuras devem comparar
esses pontos com esta referência, sem forçar o saldo individual para uma meta.

## Validação desta revisão

152 testes de código; regras reais do Firestore emulado com repetições,
duas abas/aparelhos, todas as faixas modernas do Fingo, cartelas antigas e
um único tubo dourado em cada coluna. Os grupos de navegador dos oito jogos
públicos foram executados, incluindo saldo, login salvo, recarga, retomada e
controles por toque. O painel do Fingo foi conferido em 375, 390 e 453 pixels,
inclusive na aposta máxima.

Para a revisão pública, com os emuladores em execução e o build de emulador:
`python3 tests/browser.py --public-only`. O modo completo também inclui testes
antigos de Claw/Race/Bridge; seus acessos pela Home não representam a Home atual,
na qual esses protótipos estão guardados. Nesta revisão, seus cenários de interface
ficam fora do escopo; o motor e as transações continuam cobertos pelos testes.

Limitação: o teste extra de animação `neck_motion_browser.py` não passou nesta
VM: não conseguiu observar o contato antes da queda na janela entre frames.
O código visual do Neck não foi modificado. Apostas, perda, garantia, retomada
e saldo compartilhado do Neck passaram nos grupos funcionais e nas regras.
A suíte integral de navegador, portanto, não está sendo declarada aprovada.
