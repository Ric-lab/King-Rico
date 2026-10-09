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
| Saldo atual | | | 1808 | |


## Lição — animação de personagem (out/2026)
- **Falhou:** Meshy auto-rig + clipes humanoides (mocap) no King Rico → pele "gelatina", partes se misturam. Pesos rígidos (1 osso por vértice) também ficou ruim (degraus/quebras).
- **Por quê:** corpo de mascote cartoon (cabeça/orelhas/tromba/barriga grandes) não tem proporção humana; skinning automático + mocap humano não serve.
- **Regra:** personagem de UI/menu no estilo toy = **2D em camadas (estilo Spine)** a partir da arte oficial, com trocas de olhos/boca para expressões. 3D com rig só se feito à mão por animador (Blender).
- Custo desperdiçado nessa tentativa: ~30 créditos (rig + 8 clipes).
