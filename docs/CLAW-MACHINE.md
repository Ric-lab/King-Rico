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

## Visual e desempenho

Topo e controles reutilizam `ui/header.css`, `ui/controls.css` e `ui/game-menu.jsx`. `assets/claw/cabinet.webp`, `happeach-plush.webp` e `happeach-royal.webp` são novas artes GPT Imagem baseadas nos assets oficiais, exportadas para WebP, somando aproximadamente 300 KB. O personagem não foi substituído por um mascote genérico. A peça de 3× usa a variante real também durante a captura, na saída e no modal.

A composição é 2,5D: gabinete ilustrado + garra metálica, trilhos articulados, piso, sombras e pelúcias em sprites no Three.js local. A câmera ortográfica e o espaçamento em profundidade preservam a leitura das três fileiras. O trilho fica acima dos rostos; sua altura acompanha a profundidade para manter a apresentação de palco. A posição do brinquedo na matemática permanece a mesma, sem mudança nas regras Firestore ou pagamentos.

Sequência de 4,2 s: antecipação → descida → aperto com compressão da pelúcia → subida com balanço → percurso até a saída → queda e acomodação na boca da máquina → modal. A captura de borda escorrega e volta ao piso. Luzes acompanham aperto e subida; sons mecânicos curtos respeitam o volume configurado. O balanço da mira é parte da habilidade; reduzir movimento elimina respiração/efeitos decorativos e acelera a apresentação, preservando essa posição jogável. Menu e aba oculta pausam o relógio. O prêmio nunca depende da animação nem do FPS.

O antigo `assets/models/happeach-claw.glb` foi preservado, mas não é mais carregado por este jogo. Os modelos dos outros jogos permanecem intactos. A capa da Home mostra uma captura da nova máquina, com as pelúcias reais da versão jogável.

## Verificação

- `npm test`: geometria de pontuação, limites entre pegar/borda/perder, prêmios, saldo compartilhado, idempotência e build.
- `npm run test:rules`: transações e regras reais, leitura privada do resultado e rejeição de qualidade/prêmio falsificados.
- `tests/claw_browser.py`: entrada pela Home, toque real/cancelamento, captura, borda, erro, atualização durante a subida, duas abas, replay, pausa do balanço no menu, correspondência entre a mira visível e a operação, entrega completa da pelúcia e celular estreito.
- Build de produção após integração e workflow Firebase existente na main.
