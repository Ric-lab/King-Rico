# Plano de melhorias — Fortune Circus (a partir dos 3 vídeos de referência)

Detalhes de cada observação: `guidelines/benchmark-video1.md` · quadros em `screenshots/v1-*`, `v2-*`, `v3-*`.

## Etapa 1 — Jogo normal (feedback de giro e prêmio)

| # | Melhoria | O que vi na referência | Hoje no Fortune Circus | Custo |
|---|---|---|---|---|
| 1 | **Barra de mensagem com estados** | Vermelha com dica; vermelha "Win" para prêmio pequeno; **verde** para prêmio maior que a aposta | Texto de dica simples, sem estado de prêmio | 0 créditos |
| 2 | **Valor contando dentro da barra** | Sobe de 0 até o total em ~1,3 s (rápido no início, freia no fim) e fica ~1,3 s parado | Valor aparece no modal | 0 |
| 3 | **Modal só para prêmio grande** | Sem modal em prêmio comum; o jogo segue fluido | Modal em todo prêmio | 0 |
| 4 | **Linhas premiadas acendem juntas, resto escurece** | Todas as linhas acendem ao mesmo tempo; símbolos que perderam ficam ~50% escuros | Linhas piscam, sem escurecer o resto | 0 |
| 5 | **Valor em cima do símbolo do meio da linha** | Depois da contagem, cada linha mostra seu valor no centro | Não existe | 0 |
| 6 | **Mascote reage a toda vitória** | Troca de pose e comemora enquanto o valor conta | King Rico reage só em alguns casos | 0 (poses já existem) |
| 7 | **Moldura e botão com brilho no toque** | Moldura pisca dourado e o botão solta faíscas ao girar | Botão afunda; sem brilho na moldura | 0 |

Regras propostas:
- Prêmio < aposta → barra vermelha "Ganhou" + King Rico **Feliz**.
- Prêmio ≥ aposta → barra **verde** contando + King Rico **Comemorar**.
- Prêmio ≥ 5× aposta → além disso, **modal** (como hoje) + moedas voando para o saldo.
- Vários giros seguidos sem prêmio → King Rico **Triste** (só depois de uma sequência, nunca em todo giro perdido).

## Etapa 2 — Rodada Especial (clímax)

| # | Melhoria | O que vi na referência | Hoje | Custo |
|---|---|---|---|---|
| 8 | **Anúncio de entrada** | Envelope "?" cai sobre os rolos (~0,8 s) antes do bônus | Cesta já vai ao centro — reforçar com destaque na entrada | 0 |
| 9 | **Cenário de rodada** | Halo dourado radial atrás do mascote + selo fixo "x10" durante toda a rodada | Cenário igual ao normal | ~10 créditos (halo/selo) ou feito em código |
| 10 | **Grade da rodada** | Casas vazias em bege com brilho e partículas; cada símbolo trava com destaque | Casas vazias simples | 0 |
| 11 | **Clímax com tela cheia** | Grade toda dourada, barra verde contando, mascote de braços para cima a contagem inteira | Modal de prêmio | 0 |
| 12 | **Saída da rodada** | Total parado ~2,5 s, depois cada linha com seu valor, só então volta ao normal | Volta direto | 0 |

## Ordem de execução
1. Etapa 1, itens 1–4 (barra, contagem, modal, escurecer) → você testa.
2. Etapa 1, itens 5–7 (valor na linha, reações, brilho) → você testa.
3. Etapa 2 inteira → você testa.

## O que NÃO copiar
- Tema, símbolos, mascote e textos da referência — só o **ritmo e o tipo de feedback**.
- Velocidade alta da referência: para o público 60+, manter os tempos um pouco mais longos e textos grandes.
