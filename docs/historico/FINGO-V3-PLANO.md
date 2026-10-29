> **Registro histórico.** Preservado em 29/10/2026; não é instrução atual nem lista de tarefas pendentes. Consulte o [índice atual](../README.md). Caminhos e comandos abaixo refletem a época do registro.

# Fortune Fingo v3 — plano aprovado (executar na próxima sessão)

## Regra
- 1 aposta = 1 rodada. Toque no prêmio (topo) = escolher aposta (só antes do 1º giro).
- Início: sorteio único de 5 números, 1 por coluna (L 1–15, U 16–30, C 31–45, K 46–60, Y 61–75). Ficam fixos.
- 25 bolas. Cada bola: GIRAR → 5 canos sorteiam números da sua coluna; cano que mostra o número-alvo (ainda não marcado) fica dourado → tocar coluna → bola desce.
- Bola no cano dourado = marca o número. 5 marcados = FINGO!, paga aposta × multiplicador por bolas usadas. Acabou as 25 sem fechar = 0. Sem prêmio parcial.
- Sem poderes (fogo/mágico saem). Sem cartela 5×5.

## Economia (sim 150k rodadas)
- Por giro, cada coluna não marcada mostra o alvo com prob g ≈ 0,28. Tocou no dourado → cai nele com prob h = 0,40 (física guiada, como hoje).
- Tabela: ≤6 x25 · ≤8 x10 · ≤10 x5 · ≤12 x3 · ≤15 x1,8 · ≤18 x1,1 · ≤21 x0,6 · ≤25 x0,3.
- g=0,30/h=0,40 → RTP 1,07; g=0,25/h=0,40 → 0,73. Ajustar g ≈ 0,28 até RTP 0,95 (re-simular antes de fechar).

## Visual
- Topo: 5 bolas grandes coloridas (cores das letras L U C K Y) com o número dentro; marcada = acende + pulinho; 5 acesas = FINGO!.
- Plinko ocupa do topo até o rodapé. Física Matter.js com valores do original (já no arquivo).
- Bolas: render único com three.js → sprites PNG (verniz, reflexo fixo, faixa branca com número girando). Jogo segue 2D. Sem Meshy (geométrico = código). 0 créditos.
- Queda: sombra, rastro curto, brilho no pino tocado; cano dourado pulsando; bola "afunda" no cano; moedas voando ao saldo.
- Rodapé: só GIRAR + contador de bolas.

## Depois
- Card do Fingo na Home + publicar no GitHub (Ric-lab/King-Rico).
