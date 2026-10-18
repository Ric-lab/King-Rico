# Referências aplicadas ao Impulso 02

Pesquisa de 18/10/2026. Foram consultados textos, material de autores e imagens de referência. Não foi feito um estudo quadro a quadro de gameplays completos. As decisões abaixo são hipóteses de design para testar com quem joga.

| Referência | O que informa esta revisão | Aplicação no jogo |
| --- | --- | --- |
| [Ryan, Rigby e Przybylski, 2006 — The Motivational Pull of Video Games](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf) | Nos estudos, percepção de competência e autonomia se associam ao prazer e à preferência por continuar. Controles intuitivos se relacionam a essas percepções. | Gesto proporcional e previsível, ensaio gratuito, precisão medida e dicas que identificam o erro real. Não há sorteio depois do lançamento. |
| [Riot — Clarity in League](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/) | Prioridade visual para o que afeta a jogada; coerência entre a região visível e a colisão; reduzir ruído. | Um alvo com três zonas concêntricas. Animação e prêmio usam exatamente o mesmo ponto de queda. Bola, centro e impacto recebem o maior contraste. |
| [Riot — Intro to Game Art](https://www.riotgames.com/en/artedu/intro-to-game-art) | Forma, cor e detalhe ajudam clareza, satisfação e identidade. | Palco com arte existente do Circus, base de veludo, metais arredondados, centro dourado e bola maior. Os elementos importantes mantêm silhuetas simples. |
| [Jonasson e Purho — Juice It or Lose It, GDC Europe 2012](https://www.gdcvault.com/play/1016789/Juice-It-or-Lose) | A apresentação demonstra como respostas visuais e sonoras enriquecem interações simples. Foi consultada a descrição oficial da sessão. | Compressão no contato, mola, pequeno rebote, halo, partículas, som por qualidade e moedas viajando ao saldo. Intensidade maior para o centro. Movimento reduzido desliga tremor e limita partículas. |
| [Justin Smith — entrevista sobre Desert Golfing](https://www.gamedeveloper.com/design/7-questions-for-i-desert-golfing-i-creator-justin-smith) e [Dunk Shot, Ketchapp](https://apps.apple.com/us/app/dunk-shot/id1301375510) | Referências para limitar a interação a um lançamento legível e permitir domínio de um gesto. | Arrastar, ajustar e soltar. Arco inicial visível; queda sem desvios inesperados. O treino repete o cenário para facilitar comparação. |
| [Hunicke, LeBlanc e Zubek — MDA](https://aaai.org/papers/ws04-04-001-mda-a-formal-approach-to-game-design-and-game-research/) | Partir da experiência desejada e investigar como as regras e o comportamento a produzem. | Experiência pretendida: entender o erro, ajustar o toque, sentir o impacto e decidir voluntariamente se continua. A aposta não substitui a qualidade do lançamento. |

## Decisões desta versão

- O alvo inicial é generoso. Nos saltos seguintes, muda de posição e encolhe de forma visível antes do gesto.
- Direção e comprimento do arrasto determinam a queda; a velocidade do dedo não interfere. É possível segurar e ajustar antes de soltar.
- A borda paga ×1,2, o anel intermediário ×1,8 e o centro ×3. São valores de protótipo, incluindo a aposta. A economia ainda precisa ser avaliada por partidas reais.
- O ponto exato de queda decide a zona. Não há aproximação secreta, resultado forçado ou perda artificial depois de um gesto correto.
- Errar dá uma informação acionável: mais ou menos força, ou ajuste para um lado. O ensaio não debita nem paga moedas.
- O acerto responde onde a bola encostou. A plataforma afunda e retorna, a bola comprime e rebate, e o prêmio recebe uma celebração compatível com a precisão.

## O que testar com o jogador

1. Depois de errar, ele sabe o que mudar no próximo gesto?
2. Em cinco a dez lançamentos, consegue melhorar a precisão?
3. Quer repetir um acerto no ensaio, mesmo sem ganhar moedas?
4. Consegue identificar centro, borda e prêmio sem abrir instruções?
5. Decide receber ou continuar por vontade própria, compreendendo o risco?

Os testes automatizados verificam física, entrada por toque, estados, pagamentos e persistência. A diversão e a qualidade estética dependem de teste humano; a literatura não valida automaticamente este protótipo.
