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
- 2026-10-20 · Flying Clown: palhaço corpo inteiro pendurado (ref = cabeça do Fortune Clown) · Meshy image-to-image gpt-image-2 · ~6 cr · OK de 1ª. Balões = código.
- 2026-10-20 · Flying Clown: 6 balões (grade, fundo verde) + fundo lona vista de baixo · Meshy image-to-image · ~12 cr · OK de 1ª.
- 2026-10-21 · Fortune Fingo: fundo do circo 9:16 (ref = capa, sem tabuleiro) + tabuleiro aceso (moldura dourada, feltro vazio, fundo magenta) + tabuleiro apagado gerado DO RESULTADO aceso + 5 bolas de bingo sem número (fundo verde) · Meshy image-to-image gpt-image-2 · 4 tarefas, 48 cr (303→255) · todas OK de 1ª; aceso/apagado encaixam (bbox ±3 px). Pinos, bola e números continuam em código. Lição: a 1ª versão com moldura/feltro em CSS ficou feia — arte do jogo sempre gerada da capa.

- 2026-10-22 · Capas Home Neck e Fortune 33 · GPT Image com referências das capas Machine/Wheel/Fingo e dos assets oficiais, uma geração por capa. Neck preserva girafa/colete/maçãs e troca a savana pelo interior do circo; 33 usa cartas 10/13/10 com King Rico e diamantes. Originais em `/workspace/generated_images/`; WebP 800×800 q86 em `assets/brand/cover-neck-circus.webp` e `cover-33.webp`. Capa anterior do Neck preservada. Critério: reconhecimento em miniatura e coerência de materiais, cortinas vermelhas/roxas e lâmpadas douradas com as capas existentes. Sem consumo de créditos Meshy; valor monetário do GPT Image não informado pela ferramenta.

- 2026-10-23 · Fortune Wheel: aro dourado e ponteira articulada · GPT Imagens, uma geração com a Wheel `3f60cb3` como referência; sem uso de créditos Meshy, custo da ferramenta não informado. Atlas 2D transparente com material coerente nas duas peças, codificado em WebP sem perdas. Arte em `assets/wheel/gold-atlas.webp`; recortes e encaixe por CSS, lâmpadas animadas preservadas. Aceite visual do autor ainda pendente.

- 2026-10-23 · Ícones instaláveis do site · Arte oficial existente `assets/brand/king-rico-hero.png`, preservada, exportada em PNG 192/512 e Apple Touch 180 por redimensionamento de empacotamento; sem redesenho ou geração. Arquivos em `assets/app/`. Custo: 0 créditos. Critério: reconhecer King Rico no atalho e fornecer tamanhos válidos para Chrome/Android e Safari/iOS.

- 2026-10-23 · Fortune Wheel: separador dourado entre a aposta e a barra de força · Uma geração GPT Imagens com referências `assets/wheel/gold-atlas.webp` e captura da Wheel atual. Aro fino frontal em fundo transparente; material dourado e iluminação coerentes com o aro externo e a ponteira. Original preservado em `/workspace/generated_images/exec-e8c82dcc-834d-4209-a654-4ef8cbd59104.png`, exportação 376×376 (3× na tela) em WebP sem perdas em `assets/wheel/hub-ring.webp`. Encaixe de 110px por CSS; barra de força e escolha central preservadas. Sem créditos Meshy; custo monetário da ferramenta não informado. Aceite visual do autor pendente.

- 2026-10-23 · Capas com foco, novo ícone e abertura · 8 gerações GPT Imagens autorizadas pelo pedido de revisão: 6 capas (Machine, Wheel, Neck, Flying Clown, Fingo e 33), 1 ícone e 1 ilustração de abertura. Referências: artes atuais, King Rico oficial e Pênalti como exemplo de hierarquia. Pênalti e Clown preservados. Exportações WebP 640×640 nas capas, 768×1366 na abertura; PNG 192/512/180 no ícone. Critério: assunto reconhecível a 160 px, cenário subordinado e espaço para o rótulo da Home. Originais preservados em `/workspace/generated_images/`: Machine `exec-1681061b-5337-4f1d-a79a-9fa80092add8.png`, Fingo `exec-71c0d105-4df2-4b91-b69f-a749b4dc9368.png`, 33 `exec-184f4b62-7be3-4b50-9a01-2737b9852d9e.png`, Wheel `exec-09c398c8-7eae-46b4-b07a-e79fb2076e7f.png`, Neck `exec-55e062ad-36c2-4fdb-a4ed-59b05e3af7ab.png`, Flying `exec-ee12029d-d5ed-4ca1-9bb2-9963e8e6efb0.png`, ícone `exec-af3b26dd-585c-4e8c-bf3c-ab2ba8f9853d.png`, abertura `exec-a588afb2-baef-44e6-b416-15b5e6217d81.png`. Sem créditos Meshy; custo GPT Imagens não exposto pela ferramenta. Direção em `docs/DIRECAO-DAS-CAPAS.md`; aceite visual do autor pendente.

- 2026-10-23 · Correções das capas a pedido do autor · 4 gerações GPT Imagens: Machine com células vazias para receber o atlas original do jogo; Flying Clown com o palhaço atual vermelho/verde totalmente opaco; Fingo com cartela BINGO 5×5 e bolas numeradas; Fortune 33 com três cartas 10–13–10. Referências: capas e sprites oficiais. WebP 640×640 q86 em `assets/brand/cover-machine-reels.webp`, `cover-flying-current.webp`, `cover-fingo-bingo.webp`, `cover-33-three.webp`. Originais preservados em `/workspace/generated_images/`: `exec-16f6aae6-33d1-458b-abe9-a556562d4131.png`, `exec-8effe774-3385-4777-b700-b8ede8256946.png`, `exec-0f394c7c-e807-4bc5-812c-140ae4a3155d.png`, `exec-94299f16-d03c-46a3-8311-7325f9ca0db2.png`. Sem créditos Meshy; custo GPT Imagens não informado. Prévia da abertura: redimensionamento de empacotamento da arte existente para 128×228 WebP q60, embutida no HTML; sem geração adicional. Capas anteriores preservadas. Aceite estético do autor pendente.

- 2026-10-23 · Fingo: retorno ao plinko e cinco bolas · Uma edição GPT Imagens da fonte `assets/brand/cover-fingo.webp`, a pedido do autor. Composição original preservada, agora quadrada, sem fileiras de lâmpadas, halos e decoração miúda no fundo. Cinco bolas 15/16/32/52/64 acima do plinko verde. Original preservado em `/workspace/generated_images/exec-4059dd05-2c3a-4e26-81aa-5c228e93637a.png`; exportação de empacotamento 640×640 WebP q86 em `assets/brand/cover-fingo-plinko.webp`. Sem créditos Meshy; custo GPT Imagens não informado pela ferramenta. Cartela da versão anterior rejeitada pelo autor; aceite visual desta execução pendente.

- 2026-10-23 · Fundo único para as oito capas da Home · Pedido explícito do autor: usar o cenário da Wheel e posicionar os elementos de cada jogo sobre ele. Três edições GPT Imagens: uma extração do cenário vazio da Wheel e dois atlas de quatro primeiros planos com transparência. Originais preservados em `/workspace/generated_images/`: cenário `exec-69370619-9a24-486e-81d4-0513f0d0828d.png`, atlas A `exec-5c3571b6-4b17-4e93-8be0-3019d92fe72f.png`, atlas B `exec-4d86b572-014f-4874-baf4-e991ebb4ed19.png`. Exportações WebP em `assets/brand/covers/`, recortes individuais de empacotamento, no máximo 640 px. Mesmo fundo por CSS, não oito fundos regenerados. Símbolos originais da Machine preservados em camada separada. Sem créditos Meshy; custo GPT Imagens não informado. Referências: capas atuais dos oito jogos. Aceite estético do autor pendente; telas internas dos jogos preservadas.

- 2026-10-23 · Capa Machine de frente sem elefante · Uma edição GPT Imagens de `assets/brand/covers/machine.webp`, mantendo material e nove células vazias para os símbolos originais. Fonte preservada em `/workspace/generated_images/exec-1470e5b8-082d-4e5e-900a-659f2fe0176a.png`, exportação 640×640 WebP q88 em `assets/brand/covers/machine-front.webp`. Sem Meshy; custo GPT Imagens não informado. Fingo: substituição do primeiro plano gerado pela moldura/bolas originais e pinos/divisores em HTML/CSS, com as coordenadas do tabuleiro atual (453×509), sem geração. Fundo compartilhado preservado. Aceite estético do autor pendente.

- 2026-10-24 · Neck: extensão do chão para integrar controles ao cenário · Uma geração GPT Imagens com a parte inferior da savana atual como referência, somente grama no mesmo estilo e paleta, sem horizonte/árvores/espelhamento. Fonte preservada em `/workspace/generated_images/exec-6c3a0d1e-e2e0-4df4-a0bd-cad81ab7c941.png`; exportação 640×640 WebP q86 em `assets/neck/ground-extend.webp`. Composição em CSS com transição de 48px sobre o chão original; posição da girafa e câmera preservadas. Sem Meshy; custo GPT Imagens não informado pela ferramenta. Aceite estético do autor pendente.

- 2026-10-24 · Neck: teste da macieira no picadeiro · Reutilização de `assets/flying/bg2.webp` para picadeiro, plateia e lona, com camadas e transições por CSS. A árvore, os galhos, as maçãs e a girafa continuam sendo os assets originais; o trecho superior de `bg-sky33.webp` conserva o céu e o espaço. Nenhuma imagem nova gerada, sem consumo GPT Imagens ou Meshy. Enquadramentos conferidos no início e nos níveis 4/10/20/33; composição em teste com o autor.

- 2026-10-24 · Neck: simplificação após feedback de fundo confuso · A composição com duas instâncias de `flying/bg2.webp` foi rejeitada pelo autor. Removida a camada de lona sobreposta e adotado um único cenário `assets/brand/bg-circus-stage.webp`, com centro mais livre. Céu superior com menor opacidade para destacar girafa e frutas. Sem novas imagens geradas; alterações somente na composição dos assets existentes. Aceite visual desta revisão pendente.

## 2026-10-24 — Quintal do Fortune Neck

Conceito de circo à esquerda e árvore à direita aceito pelo usuário; a montagem com
ícone de tenda e grama detalhada foi rejeitada pelo acabamento. Nova arte única
`assets/neck/courtyard-hd.webp`, gerada com GPT Image a partir da tela atual, palco
oficial e cabeça da girafa: entrada, caminho e raízes na mesma perspectiva e luz.
Uma geração; PNG mestre preservado no workspace, exportação WebP de 906 px (~120 KB).
A textura do pescoço passou a seguir a curva em coordenadas próprias, com alternativa
SVG quando Canvas não está disponível. As verificações funcionais não constituem
aprovação estética; a nova arte ainda aguarda feedback do usuário.

### 2026-10-24 — Vista lateral e apoio da girafa

Após aprovação do acabamento do quintal, o usuário pediu apoio mais firme e mordida
lateral. `assets/neck/g-head-side.webp`: uma geração GPT Image com a cabeça frontal
como referência, exportada a 640 px com alpha. Troca de vista apenas durante a
aproximação; ajuste da ponta do pescoço, alinhamento com a entrada e duas sombras
curtas sob os cascos. Imagem frontal continua como alternativa se a lateral falhar.
Validação no navegador: contato da boca com a fruta, apoio dos pés, retomada e prêmio;
também com imagem lateral/Canvas indisponíveis e redução de movimento.

### 2026-10-25 — Pescoço contínuo

O usuário rejeitou o aspecto de recortes empilhados ao esticar. A pequena textura
`g-neck.webp` deixa de compor o pescoço: uma única silhueta SVG recebe manchas
irregulares em coordenadas do corpo, sombra de seção arredondada e encaixe sob os
sprites existentes. O crescimento revela a pelagem sem esticar suas manchas;
a curva distribui o movimento pelo trecho superior. A renderização acompanha a
altura efetiva durante a transição, sem loop quando parada. Teste de navegador
compara o tamanho da mesma mancha em duas alturas e confere o último andar,
bote, deglutição, queda, retomada e prêmio protegido. A aparência aguarda feedback.

### 2026-10-25 — Pelagem integrada à cabeça e ao corpo

Feedback do usuário: a construção contínua foi aceita, mas a cor destoou dos sprites.
Ajuste localizado da paleta SVG com os assets originais como referência: amarelo mais
luminoso, manchas âmbar, sombra quente menos intensa e brilho suave. Grão discreto
no material e sombra curta sob o queixo aproximam o acabamento dos sprites pintados.
Sem alterar ou gerar imagens; sem créditos. Conferidos os enquadramentos esticado e
lateral durante a mordida e o teste de movimento/retomada/prêmio protegido. O aceite
estético deste ajuste depende do próximo feedback do usuário.

### 2026-10-25 — Recorte do pescoço antigo nas cabeças

O usuário identificou um pedaço da pelagem antiga preso ao sprite da cabeça.
Máscaras SVG em CSS seguem o contorno do queixo nas vistas frontal e lateral;
a camada que esconde a maçã na deglutição usa o mesmo recorte. Os WebP originais
foram preservados. A ponta do pescoço contínuo agora sobrepõe a região sob a cabeça
recortada; o viewport SVG inclui essa sobreposição para não cortar a curva. Sem
novas imagens ou créditos. Conferidos cinco ângulos ampliados, contato, deglutição,
queda/retomada/prêmio protegido e encaixe com o renderizador indisponível. Não
constitui aprovação estética do autor.

### 2026-10-25 — Encaixe por sobreposição e gola

O usuário rejeitou a ponta afunilada e especificou a solução: mesma largura,
extremidade arredondada passando para dentro da cabeça, com a cabeça à frente.
A renderização segue essa orientação, sem estreitar a parte superior. A ponta
arredondada fica oculta pelos sprites frontal/lateral e a região SVG cobre a
sobreposição. Na base, uma máscara acompanha a abertura da gola original; o
pescoço passa atrás dela e da gravata, removendo o recorte de pele anterior.
Amarelo/âmbar e brilho foram comparados aos pixels dos sprites, com manchas menores
e sombreado suave. Sem alterar ou gerar arquivos de imagem; sem créditos.
Conferidos início, crescimento, virada, mordida e gola ampliados; teste de retomada
na queda e prêmio protegido passou, assim como os enquadramentos com o renderizador
indisponível. O acabamento ainda depende do feedback do usuário.

### 2026-10-25 — Repouso mais alto e manchas mais escuras

Pedido do usuário: cabeça inicialmente na altura visual da antiga primeira maçã,
para destacar a girafa do amarelo do circo. Pescoço/cabeça e sequência de frutas
recebem um andar visual de altura; câmera acompanha apenas os andares jogados.
Piso inicial, apostas e pagamentos preservados. Manchas âmbar levemente escurecidas,
com o mesmo brilho e tamanho. Conferidos início, mordida, estabilidade da primeira
subida, retomada e prêmio protegido. Sem geração de imagens ou créditos.

### 2026-10-25 — Pôr do sol na região do x1,7

Pedido do usuário: antecipar o escurecimento do céu para a região do x1,7.
Reenquadramento vertical de `bg-sky33.webp` por CSS (altura 5.400 px): a faixa quente
aparece antes, com transição contínua pela subida, noite e planetas preservados.
Conferidos os enquadramentos 0/6/7/10/16/28/33. Imagem original preservada,
sem geração ou créditos; nenhuma regra de aposta alterada.

### 2026-10-25 — Intervalo dos galhos e contato das maçãs

Intervalo vertical aumentado de 96 para 104 px, conservando a altura de repouso.
A maçã desce 1 px e recebe sombra curta sobre a folhagem. Um recorte das mesmas
folhas, alinhado à base original, passa à frente dos pés; a sombra de contato sai
quando a fruta é comida ou cai. Definição explícita do usuário: “ancorar” significa
parecer uma coisa única, com contato/profundidade/luz, e não assets sobrepostos.
Imagens preservadas, sem geração/créditos. Conferidos início, x1,7 e último andar,
contato ampliado, mordida, queda, primeira subida estável e retomada/prêmio protegido.

### 2026-10-25 — Mais espaço e emenda limpa no tronco

Intervalo passa de 104 para 112 px. Retirada a sombra externa artificial do tronco
e alinhada sua borda interna à árvore do quintal (410 px), evitando a faixa de
textura semitransparente sobre o céu perto da base. Cena ampliada para 4.500 px e
céu reenquadrado para 6.000 px para cobrir os 33 andares, mantendo pôr do sol na
região do x1,7. Sem edição de imagens/créditos. Conferidos início, x1,7 e final;
teste de queda agora mede deslocamento em relação ao galho, sem confundir o retorno
da câmera com movimento da maçã. Subida estável, mordida e retomada passaram.
