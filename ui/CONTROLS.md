# Controles compartilhados

Fortune Wheel é a referência para gradiente dourado, aro escuro e profundidade dos controles. `controls.css` concentra a aparência; cada jogo mantém posicionamento, dimensões de ações e lógica.

- `kr-stepper`: aumentar/diminuir aposta. Diâmetro normal 54 unidades; `--kr-step-size:40px` nos seletores compactos do Neck e Fortune 33. Deixe espaço para o aro de 3 unidades e a sombra inferior de 5.
- `kr-button`: ação principal e confirmação, verde.
- `kr-button kr-button--red`: parar/encerrar, com a mesma forma e profundidade do verde.
- `kr-button kr-button--gold`: pegar prêmio e controles secundários dourados.

Reutilize as classes e ajuste apenas a geometria necessária. Não duplique gradientes, sombras e estados de toque em estilos locais. Preserve eventos, estados desabilitados, feedback e arte dos controles integrados à máquina Circus.

`header.css` define uma posição única para saldo, Home e menu: `--kr-hud-top:14px` na cena de 453×802. A Home acompanha a mesma escala; o cabeçalho do 21/33 compensa sua cena de 810 unidades. Ajuste esse valor compartilhado, sem sobrescrever a posição em cada jogo. O build coloca a revisão do conteúdo nos links dos estilos, e o Hosting manda revalidar CSS, para não misturar uma página nova com um tema antigo do cache.

`RoundControls` (`ui/round-controls.js`) é a barra compartilhada do Neck e Flying Clown. Antes da rodada mostra o seletor de aposta e JOGAR; a primeira ação confirma a aposta e executa a primeira subida. Durante a rodada há apenas PEGAR (com o prêmio atual) e SUBIR, em duas colunas iguais. Aposta não é editável até terminar; retomada restaura diretamente os controles da rodada. Botões ficam desabilitados enquanto uma jogada está sendo confirmada ou animada.

`banner.js` e `banner.css`, incluídos pelo build em todas as páginas jogáveis, reservam uma faixa preta de 60 px com BANNER. `KingRicoViewport.height` desconta esse espaço para a escala das cenas; o cabeçalho mantém o mesmo alinhamento dentro da área restante. Menus, login e a simulação de anúncio usam portais no body e continuam cobrindo a janela inteira. É apenas um espaço de teste, sem SDK nem impressões de anúncio.

`wallet.js` e `WalletValue` compartilham a apresentação do saldo em todas as telas. Ganhos aguardam o fechamento do prêmio e começam a contar na chegada da primeira moeda; descontos contam para baixo sem voo. O contador mantém centavos e recebe o valor confirmado da conta, sem escrever saldos ou criar transações. `hold` mantém um prêmio visível antes da coleta, e `external`/`fly` evitam duplicar voos próprios dos jogos. Falhas de animação têm temporizadores independentes para concluir a apresentação. Restaurar a conta mostra o saldo salvo diretamente.
