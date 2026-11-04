# Pesquisa — jogos de arremesso (Fortune Hoop) · 13/out/2026

## Arcade de swipe (Swipe Basketball, Basketball Shooting, Five Hoops)
- Funciona: gesto único "pegar a bola e lançar na cesta"; sequência de acertos (combo) como gancho; cesta que se afasta a cada acerto; física/efeitos fortes no acerto.
- Não funciona: arremessos longos "quase impossíveis" frustram; usuários não descobrem como passar para o próximo arremesso (precisa ser automático); moedas sem uso = recompensa vazia.

## Cassino com tema basquete (Pop-a-Shot LuckyTap, Ultimate Hoops LuckyTap, Shootin' Hoops)
- Jogo de revelação instantânea: escolhe a aposta, a bola voa, errou = 0, acertou = prêmio. Habilidade não decide.
- Valores de prêmio escritos nas bolas/placas e mudam junto com a aposta; placar no topo soma o ganho.
- Visual: luz roxa, bola grande na linha de lance livre, placas com borda dourada — casa com o nosso design system.
- Multiplicador aleatório extra e "lance livre bônus" como evento especial.

## Decisões para o Fortune Hoop
1. Mira = escolha de risco (perto/meio/longe), acerto sorteado e honesto (RTP 95%). Já implementado.
2. Próximo arremesso automático: bola volta sozinha (já). Nunca pedir toque extra.
3. Prêmio em moedas visível NA placa de cada cesta (valor da aposta × mult.), não só o "x". A fazer.
4. Sequência visível e grande (3 seguidas = x2). Já; reforçar com efeito no aro dourado.
5. Erro "no aro" com quique crível (frustra menos que bola que nem chega). Já.
6. Cesta longe não pode parecer impossível visualmente: a bola sempre chega perto do aro.
