# Fortune Cascata

Protótipo 05: uma chuva de 60 bolinhas passa por pinos físicos. O jogador move um coletor com o dedo. Três capturas consecutivas da mesma cor dão 3 pontos e abrem a reserva daquela cor, liberando uma avalanche de 12 bolinhas extras. Cada uma das três reservas abre uma vez: até 96 bolinhas na rodada.

A moldura e o coletor são assets novos gerados com GPT Image a pedido do usuário. Ouro, vidro, esmalte roxo e rubis compartilham a mesma direção de arte. Os arquivos originais e a procedência estão em `assets/cascade/`. As versões anteriores continuam em `/v1/`, `/v2/`, `/v3/` e `/v4/` no site privado.

## Rodada e carteira

- Cor e impulso inicial são reproduzíveis a partir da semente da rodada.
- Matter.js avança em passo fixo de 1/60 s. Bolinhas, pinos, paredes dos reservatórios e comportas colidem. A comporta gira fisicamente e muda o caminho das bolinhas; as reservas caem das posições em que aparecem no vidro.
- A combinação é automática. Três bolinhas seguidas da mesma cor pontuam +3 mesmo depois de a reserva daquela cor já ter sido aberta; a mesma reserva nunca libera outra avalanche.
- Uma captura vale 1 ponto. Prêmio = `floor(aposta × pontos / 25)` e inclui a aposta. Apostar 25 e fazer 32 pontos recebe 32 moedas, resultado líquido +7.
- A emissão principal dura aproximadamente 7 segundos. A rodada tem limite inicial de 14 segundos de simulação; uma comporta aberta garante até mais 6 segundos para a queda, respeitando o limite absoluto de 20 segundos. Bolinhas eventualmente presas são encerradas sem pontos.
- O ensaio não debita nem paga moedas. A economia é experimental, sujeita a avaliação por partidas humanas.
- Carteira exclusiva de demonstração: `king-rico-cascade-demo-v2`. Não importa saldos antigos nem usa Firebase. Google, Firestore, Home e os jogos oficiais não são alterados.
- Checkpoints atômicos incluem posições, velocidades, emissões, reservas abertas, bolinhas resolvidas, pontos e coletor. Atualizar retoma o checkpoint, incluindo uma avalanche em andamento. Cada bolinha resolve uma vez; o crédito e o encerramento são gravados juntos, impedindo duplicar o prêmio por recarga da página.

## Controle e detalhes

O swipe usa deltas do dedo em coordenadas reais da mesa. Reagarrar não faz o coletor saltar; inverter na borda responde imediatamente. Toques secundários são ignorados; `pointercancel` libera o gesto. Menu e aba oculta pausam a simulação.

Os três indicadores sob cada reservatório acompanham a combinação. A trinca acende a cor da comporta, solta a trava e libera as bolinhas de baixo para cima, com posições físicas contínuas. Capturas comprimem o coletor; contatos nos pinos produzem luz e notas curtas. Som e vibração obedecem ao menu compartilhado; efeitos respeitam redução de movimento.

## Executar e testar

```
node prototypes/fortune-impulso/cascade-state.test.mjs
node scripts/build-impulso.mjs
python -m http.server 5097 --directory work/fortune-impulso/dist
python prototypes/fortune-impulso/cascade-browser.py
python prototypes/fortune-impulso/cascade-resume-browser.py
```

Playwright/Chromium verificam toque real, bordas, cancelamento, rodada com avalanche, retomada, recebimento único, menu, ensaio e enquadramento em celular pequeno/desktop. `CASCADE_URL` altera a URL local. Capturas e logs ficam em `work/cascade/`.

## Bolinhas — versão 05

As bolinhas usam esferas Three.js de 32 × 24 segmentos com `MeshPhysicalMaterial`, camada de clearcoat, transmissão parcial, espessura e índice de refração de vidro. Três cartões de luz em um ambiente PMREM produzem reflexos limpos; a iluminação da cena foi equilibrada para preservar ouro, violeta e verde nas esferas pequenas.

O veio do pigmento é calculado no espaço da esfera e gira com a física em três eixos. Cada bolinha tem orientação própria; sombra suave sobre a mesa dá profundidade sem alterar seu raio de colisão. Os três pontos do coletor usam o mesmo material. Esferas e sombras são renderizadas por instâncias; a passagem de transmissão usa metade da resolução para limitar o custo no celular. Sem novas imagens, serviços ou dependências externas.

A verificação de navegador também captura erros de compilação WebGL no console. A validação visual inclui a esfera ampliada e o tamanho real no celular; não foi medida a taxa de quadros em um aparelho físico.
