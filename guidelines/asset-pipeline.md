# Pipeline de assets — Fortune Circus

Objetivo: acertar o design com o menor número de tentativas. Custo de referência (set/2026):
Meshy Pro US$20/mês = 1.000 créditos (~US$0,02/crédito). Imagem→3D ≈ 20–30 cr; image-to-image ≈ 5–10 cr;
remesh ≈ 5 cr. Alternativas (fal Hunyuan3D Pro ~US$0,68 c/ PBR+multiview; Replicate Hunyuan3D-2 ~US$0,09)
não compensam para nosso volume. Imagens 2D: preferir ChatGPT do usuário (já pago).

## 1. Checklist antes de gastar (obrigatório)
- [ ] Qual é o asset-fonte exato? Mostrar ao usuário e confirmar ("é este?").
- [ ] Qual técnica (tabela abaixo)? Se o usuário pedir outra, explicar o risco.
- [ ] A fonte tem luz/sombra/brilho pintados? Se sim, gerar versão ALBEDO primeiro.
- [ ] Preciso de vistas (frente/lado/costas)? Gerar todas num lote coerente.
- [ ] Estimativa: N créditos. Saldo atual: X. Avisar se > 25% do saldo.
- [ ] Critério de aceite: o que precisa bater com o original (silhueta, cor, detalhe).

## 2. Técnica por tipo de objeto
| Tipo | Técnica | Por quê |
|---|---|---|
| Geométrico simétrico (moeda, gema, ficha, botão) | Código (three.js procedural) + textura/relevo da arte | IA 3D achata, duplica, cria "papel alumínio" |
| Orgânico/personagem (King Rico, Happeach, frutas) | Meshy multi-image→3D com frente+lado+costas | Imagem única = costas inventadas |
| Fumaça, gás, nuvem, brilho, fogo | 2D (sprite/alpha) ou partículas | Não tem superfície; IA 3D vira pedra |
| Símbolo do rolo | 2D fiel ao Canva (remaster GPT Image 2) | Cor exata; leve no celular |

## 3. Receitas que funcionaram
- **Diamante**: geometria facetada em código + arte do Canva projetada (frente e verso espelhado). Estender a cor da borda na textura (sem transparência) para evitar faces pretas.
- **Moeda**: 1) gerar frente e verso no MESMO estilo (só muda coroa↔trevo), albedo sem luz; 2) medir perfil da borda na arte (fundo <66% r, rampa até 73,5%, anel até 90%, degrau, aro arredondado); 3) relevo gerado da máscara da arte, erodido ~2px para não criar halo.
- **Símbolos 2D**: image-to-image com o símbolo original como referência + prompt "faithful copy, only sharpen". Nunca descrever cores no prompt (a IA inventa).
- **Recorte**: remover halo branco = zerar alpha de pixels dessaturados perto da borda (faixa ~10% do tamanho).
- **GLB leve**: reescrever texturas para JPEG 1024 (símbolos) / 2048 (personagem) → 10–20 MB vira ~1–5 MB.

## 4. Erros que já custaram créditos (não repetir)
- Descrever cores no prompt de remaster → coroa saiu vermelha/roxa. Usar só "same colors as reference".
- Meshy de imagem única para moeda/trevo/gema → verso chato, formas duplicadas.
- Colar arte com luz pintada em geometria 3D → luz dupla, "estranha".
- Frente e verso pedidos separadamente → dourados diferentes. Pedir juntos, mesma referência.
- Suavizar malha do Meshy com metal polido → vira "derretido"; melhor corpo em código + só o relevo do Meshy.
- Usar o asset errado (Happeach antigo) → 30 cr perdidos. Sempre confirmar a fonte.
- Nuvem via 3D → impossível com casca; ficou 2D.
- Apagar luzes pintadas preenchendo o halo por código (inpaint por desfoque) → borra tecido e fio. Não mexer na arte: abafar por cima.
- Pedir "estenda as margens, mantenha o centro" ao gpt-image-2 → ele redesenha tudo (centro muda de lugar e escala). Para sangria, usar o resultado só como fundo e sobrepor a arte original com borda suave.

## 5. Quando corrigir o usuário
Dizer claramente, antes de gastar, se o pedido:
- usa a técnica errada para o tipo de objeto (tabela 2);
- parte de um asset com luz pintada ou baixa resolução;
- exigiria várias tentativas por falta de referência (pedir: vistas, imagem de referência, critério de aceite);
- custa mais do que o ganho visual (ex.: 3D para algo que só aparece de frente no rolo).
Formato: "Isso tende a falhar porque X. Para acertar preciso de Y. Custo estimado Z."

## 6. Log
| Data | Asset | Técnica | Créditos | Resultado |
|---|---|---|---|---|
| set/2026 | 10 símbolos 2D remaster | Meshy image-to-image | ~90 | Aprovado |
| set/2026 | 10 símbolos 3D (imagem única) | Meshy image→3D | ~300 | Orgânicos ok; moeda/gema/trevo falharam |
| set/2026 | King Rico 3D | Meshy multi-view + rig | ~80 | Aprovado |
| set/2026 | Diamante | Código + arte projetada | 0 | Aprovado |
| set/2026 | Moeda | Várias tentativas → código + relevo da arte | ~150 | Aprovado na última |
| set/2026 | Happeach 3D | Meshy imagem única (asset errado) | ~30 | Descartado |
| set/2026 | Happeach vistas lado+costas | Meshy image-to-image (1 lote, mesma ref.) | ~14 | Coerentes |
| set/2026 | Happeach 3D | Meshy multi-view (frente+lado+costas) | ~40 | Ver biblioteca |
| out/2026 | King Rico vistas c/ coroa+capa (frente/lado/costas) | Meshy image-to-image, 1 lote, mesmas 3 refs | ~145 | Coerentes; broche das costas removido à mão |
| out/2026 | 64 WebP faltantes (jogo publicado referenciava .webp que nunca subiram ao repo) | PNG aprovado → WebP q0,86, mesma resolução (código) | 0 | 63 MB → 5,7 MB; 0 referências quebradas |
| out/2026 | Ícone e splash do app Android (provisórios) | Recorte do King Rico mestre + fundo roxo (código, `app/scripts/icons.py`) | 0 | Legível a 48 px; arte final pendente |
| out/2026 | Palco com sangria (bleed) para todos os formatos de tela | Meshy gpt-image-2 via GitHub Actions, 1 tentativa | 12 | Não estendeu: redesenhou a cena (máquina menor, chão de madeira). Serviu como fundo: arte original por cima, recortada pela forma da máquina (máscara SVG) |
| out/2026 | Palco vazio (só o fundo, sem máquina/personagem/nuvem) | Meshy gpt-image-2 com o palco anterior como referência | 12 | Aprovado: mesmo enquadramento, centro vazio; virou assets/bleed/stage-bleed.webp |
| out/2026 | Cor A (roxo-magenta festivo) + mapa de lâmpadas (60) das artes do cenário | Código (`app/scripts/stage_art.py`), arte original preservada | 0 | Aprovado. Apagar a luz pintada na própria arte borrava o tecido; a meia luz é um "abafador" desenhado pelo jogo |
| out/2026 | Estrelas: 2 da placa do topo removidas; 4 dos pilares viram luzes | Código (`stage_art.py`: preenchimento com o vermelho liso do lóbulo; mapa `star`) | 0 | Aprovado |
| Saldo atual (Meshy, 09/out) | | | 915 | O log anterior dizia 1808; o saldo real antes das gerações de out/2026 era 939 |


## Lição — animação de personagem (out/2026)
- **Falhou:** Meshy auto-rig + clipes humanoides (mocap) no King Rico → pele "gelatina", partes se misturam. Pesos rígidos (1 osso por vértice) também ficou ruim (degraus/quebras).
- **Por quê:** corpo de mascote cartoon (cabeça/orelhas/tromba/barriga grandes) não tem proporção humana; skinning automático + mocap humano não serve.
- **Regra:** personagem de UI/menu no estilo toy = **2D em camadas (estilo Spine)** a partir da arte oficial, com trocas de olhos/boca para expressões. 3D com rig só se feito à mão por animador (Blender).
- Custo desperdiçado nessa tentativa: ~30 créditos (rig + 8 clipes).

- 2026-10-09 · Botão de giro (KING RICO) · Meshy image-to-image gpt-image-2, ref = recorte do botão original (spin-ref.png) · 3 tarefas, 36 cr (915→879). Base: fiel, ok de 1ª. Energizada 1ª gerada da ref original: moldura com outra espessura, não encaixa (descartada). Energizada 2ª gerada DO RESULTADO base: mesma caixa exata, encaixa pixel a pixel. Lição: estado 2 sempre a partir do resultado do estado 1. Fundo magenta sólido + chroma key = recorte limpo. Texto por código.
- 2026-10-09 · Moldura apagada · Meshy image-to-image gpt-image-2 sobre recorte da moldura · 12 cr (879→867) · FALHOU: Meshy redesenhou o enquadramento (colunas mais finas, lâmpadas em outras posições), não encaixa para troca acesa/apagada. Feito por código a partir da arte original (vermelho ×0,4, lâmpadas → vidro fosco), alinhado pixel a pixel, 0 cr. Lição: "versão apagada" de arte existente = processamento de pixel, não geração.
- 2026-10-09 · Pilar da moldura aceso/apagado · Meshy gpt-image-2 · 2 tarefas, 24 cr (867→843) · OK. Receita: recortar SÓ o pilar, centralizado em fundo magenta 1024×1536 (aspect 2:3); 1ª = "faithful copy" trocando estrelas por lâmpadas; 2ª = gerada DO RESULTADO da 1ª, "only change the lighting: OFF". As duas saíram no mesmo enquadramento → recorte pela mesma caixa, encaixa direto. Pilar direito = espelho do esquerdo (+5 px). Lição: objeto isolado no fundo chapado mantém posição; quadro inteiro a IA reenquadra.
- 2026-10-09 · Palco inteiro aceso/apagado · Meshy gpt-image-2, aspect 9:16 · 2 tarefas, 24 cr (843→819) · OK. 1ª: "faithful copy" da tela inteira trocando estrelas por lâmpadas → mesmo layout (sobreposição sem fantasma). 2ª: gerada DO RESULTADO da 1ª, "only change: frame OFF" → encaixe exato. No jogo: stage-lit.webp é o fundo; stage-off.webp por cima, some de baixo para cima no toque. Substitui o remendo de pilares (descartado). Lição: com aspect certo + "identical composition", o Meshy mantém o quadro inteiro; nada de remendo por código.
- 2026-10-09 · Topo da moldura apagado (machine-front3-off) · Meshy gpt-image-2 a partir do próprio machine-front3 em fundo magenta · 12 cr · OK. Motivo: o topo é camada separada (fica na frente do King Rico) e continuava aceso sobre o palco apagado = emenda. Regra: TODA camada da moldura precisa do par aceso/apagado, trocado pela mesma máscara.
- 2026-10-09 · Slot machine INTEIRA (1 imagem: topo+laterais+base+botão) acesa/apagada · Meshy gpt-image-2 · 2 tarefas, 24 cr (795→759; ~12 cr de uma tentativa de tela cheia antes) · OK. Receita: ref = palco+topo; pedir "keep ONLY the slot machine, everything else flat magenta, remove stars"; apagada gerada DO RESULTADO aceso → encaixa 100%. Fundo = stage-bleed-src (palco vazio). Atenção: a IA deixou a grade ~20 px mais alta (y 195–606 vs 215–605): o jogo tem que seguir a geometria da imagem nova, não o contrário.

- 2026-10-13 · Fortune Neck fundo savana + tronco + galho · Meshy text-to-image gpt-image-2, 3 tarefas em 1 lote (prompt de estilo comum; tronco/galho em fundo magenta p/ chroma key) · ~36 cr (687→~651) · OK de 1ª. Fundo: imagem 9:16 no pé da coluna + céu estendido em código; tronco: recorte + costura cruzada p/ repetir.
- 2026-10-13 · Fortune Neck céu dia→pôr do sol→noite→espaço · Meshy text-to-image gpt-image-2, 2 tarefas (savana de dia + espaço com planetas, 9:16) · ~24 cr · OK de 1ª. Montagem em código: dia no pé, espaço no topo, faixa do meio = degradê azul→laranja→rosa→roxo→marinho + nuvens, estrelas e lua desenhadas; bordas das imagens com fade (assets/neck/bg-sky.webp 890×5200).
- 2026-10-13 · Fortune Neck: pedras do campo removidas (atrás da girafa) · Meshy image-to-image gpt-image-2 "faithful copy, remove all rocks" · ~12 cr · OK de 1ª.
- 2026-10-13 · Fortune Hoop: cesta (tabela de circo dourada + aro + rede) e bola · Meshy text-to-image gpt-image-2, 2 tarefas em 1 lote (mesmo prompt de estilo, fundo magenta) · ~24 cr (saldo 630 antes) · OK de 1ª. Chroma key + recorte em código; camada da frente (aro+rede) separada por máscara elíptica p/ a bola passar por dentro. assets/hoop/.
- 2026-10-13 · Fortune Hoop: cesta com pedestal (poste listrado + base) e quadra no palco · Meshy image-to-image gpt-image-2; pedestal gerado DO RESULTADO da cesta (mesma arte), quadra a partir do stage-bleed · 2 tarefas ~24 cr · OK de 1ª. O triângulo branco da lona saiu magenta e sumiu no chroma key: preenchido em código (só entre as bordas da lona). Lição: em fundo magenta, evitar partes brancas/rosadas no objeto ou pedir fundo verde.
- 2026-10-14 · Fortune Penalty: girafa goleira (3 poses numa imagem só: mergulho esq / em pé / mergulho dir) + campo no palco · Meshy image-to-image gpt-image-2, ref = girafa.webp em fundo VERDE (orelhas rosadas) · 2 tarefas ~24 cr · OK de 1ª. Poses separadas por componentes conexos (as luvas quase encostam). Gol, rede, traves e bola = código.
- 2026-10-14 · Fortune Penalty: bola de futebol · Meshy text-to-image gpt-image-2, albedo plano em fundo verde; brilho/sombra em código por cima (não gira com a bola) · 1 tarefa ~12 cr · OK de 1ª. Gol e rede em perspectiva = canvas em código (0 cr).
- 2026-10-14 · Penalty: poses novas da goleira (mergulho lateral deitado + pulo p/ cima), ref keeper-c em fundo verde · 1 tarefa ~12 cr · OK de 1ª. Lição: as poses "voando de frente" da 1ª geração não servem p/ defesa; pedir "lateral dive, body horizontal like a plank". Direita = espelho em código.
- 2026-10-16 · Fortune Bounce: fundo (céu ao entardecer + lona do circo no horizonte + nuvens embaixo, "entrando no circo") e faixa de floresta lateral (fundo magenta, recorte por chroma) · Meshy image-to-image gpt-image-2 com ref stage-bleed · 2 tarefas ~12 cr · OK de 1ª. Plateia procedural em código ficou feia → trocada por asset.
- 2026-10-16 · Fortune Bounce: plateia lateral (arquibancada de circo, fundo verde → chroma) · Meshy image-to-image gpt-image-2 ref stage-bleed · ~6 cr · OK de 1ª.
- 2026-10-16 · Fortune Bounce: lava (textura top-down) + penhasco vulcânico lateral (verde→chroma) · Meshy image-to-image gpt-image-2 ref stage-bleed · ~12 cr · OK de 1ª. Lava tornada tileável em código (blend de quadrantes).
- 2026-10-16 · Fortune Bounce: margem do rio de lava (pedra orgânica estilo nether, sem blocos) + topo da pedra de pular (vista de cima) · Meshy image-to-image gpt-image-2 ref cliff-raw · ~12 cr · OK de 1ª. Penhasco reto (cliff) descartado.
- 2026-10-16 · Fortune Bounce: chão de pedra plano das laterais (top-down, tileável) · Meshy image-to-image ref stone-raw · ~6 cr · OK de 1ª.
- 2026-10-18 · Capas da Home (Wheel, Neck, Penalty, Bounce, Fingo) · Meshy image-to-image gpt-image-2, ref = capa do Fortune Circus (estilo) + print do jogo (conteúdo), 16:9 com assunto no terço central (funciona quadrado e banner) · 5 tarefas ~30 cr · todas OK de 1ª.
- 2026-10-18 · Wheel: capa refeita só com 3 cores (verde/vermelho/creme) + fundo do jogo (mesmo palco da capa, sem a roda, 9:16) · Meshy image-to-image ref = capa · 2 tarefas ~12 cr · OK de 1ª.
- 2026-10-19 · Fortune Clown: rosto-alvo do palhaço (6 buracos) · Meshy image-to-image gpt-image-2 ref stage-bleed · ~6 cr · OK de 1ª.
- 2026-10-19 · Fortune Clown v2: palhaço alegre colorido (óculos-alvo, buracos violeta com brilhos, sem olho vazado) · Meshy image-to-image ref clown-raw · ~6 cr · OK de 1ª. Lição: buraco preto em olho = assustador; usar interior colorido.
