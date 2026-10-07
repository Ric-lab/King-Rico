# Fortune Circus — Relatório de testes (QA)

Data: 2026-10-04 · Build: Fortune Circus.dc.html

## Como foi testado
- **Lógica em tempo real:** script automatizado rodando dentro do jogo aberto (aba visível), acionando o botão como o jogador.
- **Matemática:** simulação Monte Carlo com as regras exatas do jogo (500 mil giros) + verificação dentro do próprio jogo (40 mil giros usando `pick()`/`evaluate()` reais).

## Resultados
| Item | Resultado |
|---|---|
| 25 giros manuais seguidos | ✅ sem travar |
| Botão escuro durante o giro | ✅ 25/25 |
| Toque duplo durante o giro | ✅ ignorado |
| Saldo (aposta − prêmio) | ✅ bate em todos os giros |
| Happeach → cesta 3→5 → Rodada Especial | ✅ abriu; pagou o mínimo 10x |
| Rodada Especial nunca paga zero | ✅ |
| Automático liga/desliga | ✅ |
| Menu aberto pausa tudo (rolos, saldo, efeitos) e retoma | ✅ |
| Taxa de vitória (jogo real, 40k giros) | ✅ 24,0% |
| Retorno jogo normal (jogo real) | ✅ 75,9% |
| Retorno total (simulação 500k) | ✅ ≈ 98% |
| Rodada Especial | ✅ ≈ 1 a cada 70 giros, média ≈ 16x |

## Bugs encontrados e corrigidos neste teste
1. **Botão acendia durante o voo das moedas** após um prêmio → agora fica escuro até a última moeda chegar.
2. **Laço de redimensionamento** (o jogo recalculava o tamanho sem parar ao abrir em algumas janelas) → corrigido; só atualiza quando o tamanho muda de fato.
3. **Travamento ao abrir com 3D** (endereço padrão): os dois módulos 3D (moedas e Happeach) carregavam juntos logo na abertura e bloqueavam a página → agora carregam depois da primeira pintura, em tempo ocioso, um de cada vez; até ficarem prontos o jogo usa as versões 2D. Happeach do jogo usa GLB próprio com textura 1024 px.
   - Verificado no navegador interno, endereço padrão: página responde durante todo o carregamento; moedas 3D e Happeach 3D prontos em ~12 s.

## Não verificável neste ambiente
- **Fluidez (fps) e ritmo visual das animações**: a prévia interna roda a ~6 fps e a aba do usuário estava em segundo plano (0 fps). Os tempos do jogo usam relógio real, então a lógica não depende do fps, mas a suavidade precisa ser conferida num celular.

## Pendências antes de publicar
- Conferir fluidez em celular real (Android e iPhone).
- Recarga de saldo: trocar por "assista e ganhe" ou bônus por tempo.
- Tutorial de primeira vez ("junte 5 pêssegos").
- PWA (manifesto, ícones, service worker) + login Google.
