# Haptics — Fortune Circus

Uma tabela só (`HAPTIC` em Fortune Circus.dc.html). Web não controla força, só duração: intensidade = ms do pulso.
Nível 50% no menu = metade da duração.

| Evento | Padrão (ms) | Por quê |
|---|---|---|
| Toque em UI (menu, +/−, OK do prêmio) | 8 | confirma o toque, quase imperceptível |
| Botões físicos da arte ao afundar (girar, turbo, auto, home, menu) | 14 | "clique" de botão de máquina |
| Parada de cada rolo | 5 | tec mecânico leve |
| Última parada (C1) | 11 | fecha a jogada |
| Suspense do C1 (auto) | 10·70·10·70·14 | batida de coração subindo |
| Prêmio pequeno | 18 | |
| Prêmio médio (≥4× aposta) | 22·50·22 | |
| Grande prêmio (≥12×) | 40·60·40·60·90 | |
| Tela cheia | 60·40·60·40·60·40·140 | clímax |
| Happeach cai no rolo / pousa na dança / entra na cesta | 12 / 14 / 16 | sobe a cada etapa |
| Cesta cheia → Rodada Especial | 40·60·40·60·90 | |
| Happeach "aperta" o botão | 26·40·16 | impacto |
| Símbolo trava na Rodada Especial | 10 | |
| Saldo insuficiente | 18·70·18 | "não" duplo |

**Onde NÃO vibra:** enquanto os rolos giram (nada contínuo), contagem do prêmio, chuva de moedas,
partida do giro (o aperto já vibrou), paradas de rolo no auto / giros grátis / Rodada Especial
(o jogador não tocou — vira ruído), soltar o botão, menu aberto (jogo pausado), mais de 1 pulso a cada 35 ms.

**iPhone:** Safari não tem API de vibração. No iOS 18+ usamos o truque do interruptor do sistema — só um
toque leve e só quando o jogador toca (botões). Eventos do jogo (prêmio, Happeach) não vibram no iPhone.
