# Haptics — Fortune Circus

Uma tabela só (`HAPTIC` em Fortune Circus.dc.html).

**Força:** no app Android o jogo usa o plugin nativo `FcHaptics` (`app/android/.../FcHapticsPlugin.java`), que vibra
com a força máxima do motor (amplitude 255); o nível 50% do menu = metade da força. No navegador só existe
`navigator.vibrate`, que controla apenas a duração (força padrão do aparelho); lá o 50% = metade da duração, nunca abaixo de 15 ms.

**Piso de duração (out/2026):** a primeira versão usava pulsos de 5–18 ms e no teste em celular real a vibração ficou
fraca: motores de celular quase não giram abaixo de ~20 ms. Nenhum pulso fica abaixo de 18 ms.

| Evento | Padrão (ms) | Por quê |
|---|---|---|
| Toque em UI (menu, +/−, OK do prêmio) | 22 | confirma o toque |
| Botões físicos da arte ao afundar (girar, turbo, auto, home, menu) | 35 | "clique" de botão de máquina |
| Parada de cada rolo | 18 | tec mecânico leve |
| Última parada (C1) | 35 | fecha a jogada |
| Suspense do C1 (auto) | 25·70·25·70·35 | batida de coração subindo |
| Prêmio pequeno | 45 | |
| Prêmio médio (≥4× aposta) | 45·60·45 | |
| Grande prêmio (≥12×) | 70·70·70·70·130 | |
| Tela cheia | 90·50·90·50·90·50·220 | clímax |
| Happeach cai no rolo / pousa na dança / entra na cesta | 28 / 32 / 38 | sobe a cada etapa |
| Cesta cheia → Rodada Especial | 70·70·70·70·130 | |
| Happeach "aperta" o botão | 55·40·35 | impacto |
| Símbolo trava na Rodada Especial | 25 | |
| Saldo insuficiente | 40·80·40 | "não" duplo |

**Onde NÃO vibra:** enquanto os rolos giram (nada contínuo), contagem do prêmio, chuva de moedas,
partida do giro (o aperto já vibrou), paradas de rolo no auto / giros grátis / Rodada Especial
(o jogador não tocou — vira ruído), soltar o botão, menu aberto (jogo pausado), mais de 1 pulso a cada 35 ms.

**iPhone:** Safari não tem API de vibração. No iOS 18+ usamos o truque do interruptor do sistema — só um
toque leve e só quando o jogador toca (botões). Eventos do jogo (prêmio, Happeach) não vibram no iPhone.
