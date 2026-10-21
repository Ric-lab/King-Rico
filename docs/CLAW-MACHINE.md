# Claw Machine — Happeach

Jogo da categoria Habilidade. Arraste no vidro para deslocar a garra nos dois eixos; setas do teclado também funcionam. A garra acompanha com inércia curta. A mira projetada no chão corresponde à posição enviada quando o jogador toca PEGAR.

## Primeira versão

Nove peças Happeach valem 1,2×, 1,5×, 2× ou 3×, distribuídas por uma rotação de layout visível antes de apostar. O centro recebe o valor da peça, incluindo a aposta; a borda devolve a aposta; fora da mira perde. Não há um sorteio oculto para fazer uma garra bem centralizada abrir durante a subida. A pontuação usa a maior distância horizontal entre a mira e o centro da peça, em coordenadas inteiras de 0 a 1.000: `max(0, 1000-floor(distância*1000/160))`. A partir de 700 pega; de 400 a 699 devolve; abaixo de 400 perde.

Esta é uma economia de moedas virtuais com habilidade predominante. Um jogador que acerta regularmente pode ganhar moedas: não foi projetada nem auditada como jogo de RTP fixo. Layout, pagamento e precisão estão declarados na interface; futuras mudanças de equilíbrio devem manter a correspondência entre a mira visível, os limites de captura e as regras.

## Saldo e retomada

`cloud/claw.cjs` calcula qualidade e prêmio. `cloud/store.mjs` debita a aposta e confirma o resultado/crédito em uma única transação, identificada pelo UUID da tentativa. Repetir esse UUID retorna o resultado imutável e o saldo atual, sem nova cobrança. Regras Firestore validam coordenadas, alvo, layout, qualidade, pagamento e alteração do perfil.

A animação só começa após a confirmação financeira. O saldo apresentado segura a revelação do prêmio até o modal; moedas voando são apresentação, sem outro crédito. O aparelho guarda apenas o ID da tentativa e se o modal já foi fechado, em `kingRico.claw.<uid>`. Após atualizar, `clawResult` lê a operação privada para mostrar o resultado confirmado. Não se importa saldo antigo do localStorage. Outras páginas continuam usando o mesmo saldo e sessão Google; o botão de recarga abaixo de uma moeda permanece disponível após a rodada encerrada.

Como no restante da arquitetura Spark do projeto, o navegador informa a interação. As regras validam a matemática e os limites, mas não provam que houve uma mão humana arrastando a garra. O jogo usa apenas moedas virtuais. Não há Cloud Functions nem requisito de Blaze.

## Visual e desempenho

Topo e controles reutilizam `ui/header.css`, `ui/controls.css` e `ui/game-menu.jsx`. O gabinete geométrico, vidro, gancho, cabo, trilho, dedos articulados, mira, luzes e animação são Three.js local da versão fixada no lockfile. O toque tem captura/cancelamento, e o jogo pausa no menu e em abas ocultas; redução de movimento desliga oscilações decorativas e encurta a captura.

`assets/models/happeach-claw.glb` deriva do Happeach existente `sym-peach-game.glb`: 15.182 vértices e 22.727 triângulos, 874.776 bytes, contra 132.134 vértices e 7.355.960 bytes do original. Texturas JPEG são preservadas byte a byte. `scripts/prepare-claw-model.py` reproduz a redução por agrupamento de vértices com separação por UV (requer NumPy apenas no preparo; não roda no build/publicação). Os modelos dos outros jogos não foram alterados. A capa da Home é uma captura da própria máquina renderizada.

## Verificação

- `npm test`: geometria de pontuação, limites entre pegar/borda/perder, prêmios, saldo compartilhado, idempotência e build.
- `npm run test:rules`: transações e regras reais, leitura privada do resultado e rejeição de qualidade/prêmio falsificados.
- `tests/claw_browser.py`: entrada pela Home, toque real/cancelamento, captura, borda, erro, atualização durante a subida, duas abas, replay, menu e celular estreito.
- Build de produção após integração e workflow Firebase existente na main.
