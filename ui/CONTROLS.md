# Controles compartilhados

Fortune Wheel é a referência para gradiente dourado, aro escuro e profundidade dos controles. `controls.css` concentra a aparência; cada jogo mantém posicionamento, dimensões de ações e lógica.

- `kr-stepper`: aumentar/diminuir aposta. Diâmetro normal 54 unidades; `--kr-step-size:40px` nos seletores compactos do Neck e Fortune 33. Deixe espaço para o aro de 3 unidades e a sombra inferior de 5.
- `kr-button`: ação principal e confirmação, verde.
- `kr-button kr-button--red`: parar/encerrar, com a mesma forma e profundidade do verde.
- `kr-button kr-button--gold`: pegar prêmio e controles secundários dourados.

Reutilize as classes e ajuste apenas a geometria necessária. Não duplique gradientes, sombras e estados de toque em estilos locais. Preserve eventos, estados desabilitados, feedback e arte dos controles integrados à máquina Circus.

`header.css` e `interface.js` definem uma posição única para saldo, Home e menu. Cada tela usa `.kr-hud-row`; sua escala se baseia na mesma referência de 453×802 e compensa a escala da cena, inclusive no Fingo e 33. A arte dos ícones continua proporcional ao saldo, dentro de alvos de toque de 44 px separados por pelo menos 4 px. Steppers têm extensão transparente de toque. A Wheel recompõe os controles em telas baixas para manter escolhas de 44 px sem sobreposição. O build versiona CSS; o Hosting manda revalidá-lo.

A placa do saldo usa CSS e o asset da moeda. Ela cresce com o texto para acomodar `100.000.000,65`, com números de 19 unidades em todas as telas, sem redução por quantidade de dígitos. A escala geral de cada cena continua acompanhando o aparelho.

`RoundControls` (`ui/round-controls.js`) é a barra compartilhada do Neck e Flying Clown. Antes da rodada mostra o seletor de aposta e JOGAR; a primeira ação confirma a aposta e executa a primeira subida. Durante a rodada há apenas PEGAR (com o prêmio atual) e SUBIR, em duas colunas iguais. Aposta não é editável até terminar; retomada restaura diretamente os controles da rodada. Botões ficam desabilitados enquanto uma jogada está sendo confirmada ou animada.

`banner.js` e `banner.css`, incluídos pelo build em todas as páginas jogáveis, reservam uma faixa preta de 60 px com BANNER. `KingRicoViewport.height` desconta esse espaço para a escala das cenas; o cabeçalho mantém o mesmo alinhamento dentro da área restante. Menus, login e a simulação de anúncio usam portais no body e continuam cobrindo a janela inteira. É apenas um espaço de teste, sem SDK nem impressões de anúncio.

`wallet.js` e `WalletValue` compartilham a apresentação do saldo em todas as telas. Ganhos aguardam o fechamento do prêmio e começam a contar na chegada da primeira moeda; descontos contam para baixo sem voo. O contador mantém centavos e recebe o valor confirmado da conta, sem escrever saldos ou criar transações. `hold` mantém um prêmio visível antes da coleta, e `external`/`fly` evitam duplicar voos próprios dos jogos. Falhas de animação têm temporizadores independentes para concluir a apresentação. Restaurar a conta mostra o saldo salvo diretamente.
