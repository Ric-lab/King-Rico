# Claw Machine — Happeach

Jogo da categoria Habilidade. Arraste no vidro para deslocar a garra nos dois eixos; setas do teclado também funcionam. A garra acompanha com inércia curta e tem um balanço periódico visível. Depois de apontar, o jogador escolhe o instante de apertar PEGAR. A mira projetada no chão corresponde exatamente à posição enviada, incluindo o balanço: não há correção, encaixe automático ou barra que revele a faixa de captura antes do toque.

## Primeira versão

Nove peças Happeach valem 1,2×, 1,5×, 2× ou 3×, distribuídas por uma rotação de layout visível antes de apostar. O centro recebe o valor da peça, incluindo a aposta; a borda devolve a aposta; fora da mira perde. Não há um sorteio oculto para fazer uma garra bem centralizada abrir durante a subida. A pontuação usa a maior distância horizontal entre a mira e o centro da peça, em coordenadas inteiras de 0 a 1.000: `max(0, 1000-floor(distância*1000/160))`. A partir de 700 pega; de 400 a 699 devolve; abaixo de 400 perde.

Esta é uma economia de moedas virtuais com habilidade predominante. Um jogador que acerta regularmente pode ganhar moedas: não foi projetada nem auditada como jogo de RTP fixo. Layout, pagamento e precisão estão declarados na interface; futuras mudanças de equilíbrio devem manter a correspondência entre a mira visível, os limites de captura e as regras.

## Saldo e retomada

`cloud/claw.cjs` calcula qualidade e prêmio. `cloud/store.mjs` debita a aposta e confirma o resultado/crédito em uma única transação, identificada pelo UUID da tentativa. Repetir esse UUID retorna o resultado imutável e o saldo atual, sem nova cobrança. Regras Firestore validam coordenadas, alvo, layout, qualidade, pagamento e alteração do perfil.

A animação só começa após a confirmação financeira. O saldo apresentado segura a revelação do prêmio até o modal; moedas voando são apresentação, sem outro crédito. O aparelho guarda apenas o ID da tentativa e se o modal já foi fechado, em `kingRico.claw.<uid>`. Após atualizar, `clawResult` lê a operação privada para mostrar o resultado confirmado. Não se importa saldo antigo do localStorage. Outras páginas continuam usando o mesmo saldo e sessão Google; o botão de recarga abaixo de uma moeda permanece disponível após a rodada encerrada.

Como no restante da arquitetura Spark do projeto, o navegador informa a interação. As regras validam a matemática e os limites, mas não provam que houve uma mão humana arrastando a garra. O jogo usa apenas moedas virtuais. Não há Cloud Functions nem requisito de Blaze.

## Direção visual e referências

Revisão de 21/out/2026: a versão inicial tinha nove modelos pequenos sobrepostos em uma caixa geométrica, sem a arte de palco presente nos demais jogos. A barra de precisão entregava o resultado e reduzia a interação a ajustar até ficar verde. A nova direção é um brinquedo de circo: gabinete ilustrado, pelúcias reconhecíveis e timing da garra.

Benchmark de páginas oficiais e imagens de divulgação, sem afirmar teste jogável dos concorrentes:

- [Clawbert / HyperBeard](https://hyperbeard.com/game/clawbert/): brinquedos com personalidade, hierarquia centrada na captura e distinção de peças raras. Aplicação: rosto do Happeach grande e peça de 3× com coroa/capa próprias. Não foram copiadas artes ou acrescentados os temporizadores de incubação.
- [Claw Stars / Appxplore](https://appxplore.com/index.php/games/mobile-games/claw-stars): a captura faz parte de um universo e os prêmios têm identidade. Aplicação: a atração pertence ao circo King Rico, com Happeach no letreiro e no brinquedo. Coleção persistente e sistemas sociais não fazem parte desta versão.
- Fortune Circus, do próprio projeto: molduras renderizadas, luz como resposta ao toque, ação verde e prêmio em modal. Aplicação: composição de arte com o mecanismo vivo por cima, mantendo o cabeçalho e controles comuns.

## Máquina 3D e movimento

Após feedback do autor, a abordagem com sprites e gabinete ilustrado foi substituída por uma cena 3D única. O gabinete tem frente, laterais, vidro, dobradiças, fechadura, trilhos, carrinho com roldanas, cabo, dedos articulados e controles em volume. O botão verde da própria máquina também aceita toque; o botão principal e o cabeçalho continuam padronizados. A câmera mostra frente e lateral.

Nove modelos do Happeach repousam dentro de uma caixa com paredes e piso. O modelo `happeach-toy.glb` deriva do original oficial: 22.400 vértices, 28.745 triângulos, cerca de 1,1 MB. A redução usa meshoptimizer para preservar as ilhas UV. A antiga redução por agrupamento espacial misturava cores nas costuras e foi descartada nesta versão. As texturas do modelo não foram repintadas; o acabamento dos brinquedos usa iluminação difusa Lambert, sem mapas de metal ou brilho, e a estrutura metálica mantém os materiais PBR. Os modelos usados por outros jogos não foram alterados.

`games/claw/physics.mjs` usa Cannon ES local, com versão fixada no lockfile, para gravidade, apoio, contato entre os prêmios e queda no poço de entrega. Os corpos são compostos por esferas; não há simulação de tecido. A preensão usa um vínculo no ponto agarrado: a peça gira pelo próprio peso e colide com as outras ao sair. Os dedos visíveis acompanham a articulação; não se afirma uma simulação de atrito de tecido entre cada dedo e a pelúcia. A precisão já confirmada determina se o vínculo sustenta a peça ou a solta na subida.

A saída é um buraco no piso, ligado a um poço e bandeja. A peça vencedora é solta sobre esse poço e cai por gravidade. O evento de entrega acompanha a posição do corpo. A mesma peça permanece na cena durante a captura, percurso e queda. O modal não cria um segundo objeto na boca da máquina.

O mundo usa passos fixos de 1/90 s, com testes a 60, 30 e poucos frames por segundo. O pixel ratio é limitado e a resolução se ajusta quando quadros ficam lentos; a sombra usa 512 px. O limite de avanço por quadro cobre 250 ms para evitar que a animação se alongue demais sob renderização lenta. Menu e aba oculta pausam movimento e física; redução de movimento acelera a apresentação e reduz luzes decorativas. A simulação de apresentação não decide pagamentos nem cria outra transação. A boca de saída foi ampliada após um teste encontrar uma captura fora do centro presa na borda; há teste de regressão com 18 variações de layout, peça e preensão.

## Correspondência da mira

`games/claw/layout.cjs` prepara a distribuição inicial. Após o assentamento, a mira usa as posições reais dos corpos físicos. `encodeAim` transforma a distância real à peça para o sistema local aceito pelas regras; `decodeAim` permite interpretar operações antigas. Não há encaixe automático. Durante uma tentativa normal a animação parte da posição congelada na tela e mantém o mesmo mundo que o jogador estava mirando. Os pagamentos, formato das operações e regras Firestore foram preservados.

As imagens geradas anteriormente permanecem para modais e compatibilidade. A capa da Home é uma captura da máquina 3D atual.

## Verificação

- `npm test`: geometria de pontuação, limites entre pegar/borda/perder, prêmios, saldo compartilhado, idempotência e build.
- `npm run test:rules`: transações e regras reais, leitura privada do resultado e rejeição de qualidade/prêmio falsificados.
- `tests/claw_browser.py`: entrada pela Home, toque real/cancelamento, captura, borda, erro, atualização durante a subida, duas abas, replay, queda física pela saída, pausa do balanço no menu, correspondência entre a mira visível e a operação, entrega completa da pelúcia e celular estreito.
- Build de produção após integração e workflow Firebase existente na main.

## Feedback registrado

O autor considerou a revisão ilustrada ainda pouco verossímil: prêmios alinhados e arrumação excessiva. A correção seguinte trata composição e causalidade física (pilha, oclusão, contato, mecanismo), sem tratar aprovação funcional como aprovação estética.
