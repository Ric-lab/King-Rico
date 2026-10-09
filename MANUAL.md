# MANUAL — King Rico / Fortune Circus

Manual completo do projeto: o que é, como está montado, como gerar assets, o que funcionou, o que falhou, e o
que falta para a publicação oficial. Escrito para que uma pessoa ou outra IA (ex.: Claude Code) consiga clonar,
continuar e publicar sem refazer os erros.

> Regra de ouro: **diagnosticar antes de gerar**. Olhe o asset-fonte, escolha a técnica certa (seção 5),
> estime créditos, confirme com o dono do projeto e só então gere. Um objeto por vez, sempre comparando lado a
> lado com o original.

---

## 1. O que é

- **King Rico** é uma plataforma de jogos casuais de **cassino social** (sem dinheiro real, sem resgate de
  prêmios). Mascote: King Rico, um elefante roxo rei com coroa, capa vermelha e cetro.
- **Fortune Circus** é o primeiro jogo: caça-níquel 3×3, tema circo, com o mascote secundário **Happeach**
  (pêssego com braços e pernas — esse é o asset correto).
- Público principal: **terceira idade** (a usuária piloto é a avó do dono). Toda decisão de UX parte disso:
  texto grande, alvos ≥ 44 px, prêmio que não passa despercebido, nada que dependa de reflexo rápido.
- Formato alvo: **web + PWA** (instalar na tela inicial do celular), login Google, anúncios premiados.

## 2. Mapa do repositório

| Caminho | O que é |
|---|---|
| `Fortune Circus.dc.html` | **Entrypoint.** O jogo inteiro + a Home embutida (abre na Home). |
| `Home.dc.html` | Tela inicial (lobby): saldo, título, card do jogo, "em breve", modal de bônus diário. |
| `King Rico.dc.html` | Animador do mascote (troca de poses desenhadas). Página de demonstração das reações. |
| `3D Library.html` | Visualizador/exportador dos modelos 3D e renders de estúdio. |
| `assets/` | Imagens, sprites, quadros de animação, modelos. Ver seção 4. |
| `assets/king-rico/frames/` | Poses do King Rico já alinhadas (mesma escala e linha dos pés). |
| `assets/happeach/f-*.webp` | Quadros desenhados do Happeach (pronto, agacha, impulso, queda, vitória, dança A/B). |
| `assets/models/` | GLBs otimizados + `procedural.js` (diamante/moeda/trevo em código). |
| `guidelines/asset-pipeline.md` | Regras de geração de asset + log de custos. **Ler antes de gastar créditos.** |
| `guidelines/benchmark-*.md` | Análise quadro a quadro de vídeos de referência e plano de melhorias. |
| `components/`, `ui_kits/`, `tokens/` | Design system (tokens, componentes, kit de UI do jogo). |
| `CLAUDE.md` | Regras de trabalho que qualquer IA deve seguir neste projeto. |
| `github.md` | Registro de sincronização com este repositório. |

### Formato `.dc.html` (Design Component)
Cada tela é um único arquivo HTML que abre direto no navegador: um template com `{{ holes }}` + uma classe
`Component extends DCLogic` (estilo React class component, sem JSX) + `support.js` (runtime). Estilos são
**inline** (sem CSS por classe). Isso é ótimo para prototipar e publicar como arquivo único, mas para a
publicação oficial recomenda-se portar para um projeto React/Vite normal (seção 9).

## 3. Como o jogo funciona

### Regras e matemática (simulado em 500 mil giros)
- Grade 3×3, 5 linhas (3 horizontais + 2 diagonais). Aposta de 1 a **1.000** por giro.
- **Retorno ao jogador (RTP) ≈ 98%**. Jogo base devolve ≈ 76%; o resto vem da Rodada Especial.
- **Taxa de acerto ≈ 24%** (1 em 4 giros ganha algo) — importante para o público idoso não desanimar.
- Constantes ficam agrupadas no topo da lógica do jogo: `LINE_K = 1.9`, `FEAT_P_SYM = 0.15`,
  `FEAT_P_WILD = 0.04`, `FEAT_MIN = 10`, `PEACH_P = 0.008`, `PEACH_GOAL = 5`, `PEACH_PAY = 20`, `FEAT_SPINS = 5`.
- Elefante = curinga (substitui tudo menos o Happeach). Tela cheia do mesmo símbolo paga ×10.
- **Happeach**: cada um que cai vai para a **cesta** (contador 0–5). Excedente conta para a próxima rodada.
  3 Happeach na mesma linha pagam ×20.
- **Rodada Especial** (5 Happeach): 5 giros em que símbolos travam; paga no mínimo 10× a aposta.
  Sai em média a cada ~70 giros.
- **Antes de mexer em qualquer número, rode a simulação** (copie as regras para um script e simule ≥ 300 mil
  giros). Uma vez o jogo estava pagando 212% e ninguém tinha percebido jogando.

### Sequência de um giro (timing importa)
1. Toque → "tec" + botão afunda escuro + **pulso de energia** (onda sai do botão e acende a moldura).
2. **Atraso de 280 ms** entre o tec e a largada (dá para ouvir os dois sons separados).
3. Todos os rolos largam juntos com curva de velocidade (acelera → pico → desacelera); param escalonados de A3 a C1.
4. Suspense ocasional só no último rolo (suave no manual, marcado no automático).
5. Linhas premiadas acendem → pausa → Happeach dança e voa para a cesta (um de cada vez) → pausa → modal de prêmio.
6. Modal de prêmio fica **até tocar** (no automático some sozinho em ~2 s). Depois as moedas voam para o saldo.
7. **Nada pode interromper** essa sequência: o botão de girar fica travado até o saldo terminar de contar.

### Rodada Especial
Cesta vai para o centro no lugar do King Rico. Para cada um dos 5 giros, um pêssego sai da cesta e cai de
braços para cima (estilo montanha-russa) no botão, que acende de mentira — o usuário não controla nada nessa hora.

### Feedback háptico (vibração)
Botões: toque curto. Giro: curto na largada. Parada de rolo: muito leve. Prêmio: proporcional ao tamanho.
Rodada Especial: padrão marcado. **Não vibrar** em animações decorativas nem no automático em sequência.

### Menu
Abrir o menu **pausa o jogo** (inclusive automático e Rodada Especial). Nunca deixar o jogo rodando atrás de um modal.

## 4. Assets — o que existe e de onde veio

- **Fonte original**: arte do Canva do dono (fundo do palco, símbolos, botões). Não há outra fonte.
- **Fundo do jogo** (`assets/stage-hd-c.webp`): Canva em alta resolução, com o miolo da máquina (rolos) vazio.
  O topo foi **refeito do zero** (cortina + palco) porque remendar o original sempre deixava restos do King Rico antigo.
- **Símbolos do rolo** (`assets/symbols-v7.png`): sprite de 12 quadros × 512 px (11 símbolos + vazio). Cada
  símbolo é um remaster fiel do Canva (GPT Image 2 via Meshy, "faithful copy, only sharpen").
- **King Rico animado**: ~30 poses desenhadas em `assets/king-rico/frames/`, todas alinhadas pela altura e pela
  linha dos pés (`align.json`). Animação = troca de pose + mola de escala/posição. Nada é deformado.
- **Happeach animado**: 9 quadros desenhados em `assets/happeach/`.
- **Cesta**: `assets/fx/basket.webp` (fundo) + `basket-front.webp` (borda da frente) com pêssegos simples entre as duas camadas
  (3 embaixo, 2 em cima).
- **Moeda voando para o saldo**: imagem 2D da moeda do rolo, girando por achatamento (funciona em qualquer celular).
- **Sons**: todos sintetizados em código (Web Audio), sem arquivos de áudio.

### Formatos e peso
- Publicação como arquivo único tem **limite de 16 MB**. Use **WebP** (qualidade ~0,86) para tudo que não precisa de
  alfa perfeito; PNG só quando inevitável. PNG de 2 MB vira WebP de 0,05–0,12 MB.
- GLB: reescrever as texturas para JPEG 1024 (símbolos) / 2048 (personagem). 10–20 MB vira 1–5 MB.

### Armadilha do arquivo único (resolvida — não quebre)
O empacotador só reescreve URLs que aparecem **no template**. Imagens criadas por código (`new Image()`,
`style.backgroundImage` montado em JS) ou dentro de componentes importados **não** entram no arquivo publicado.
Solução usada: um registro oculto de `<img data-asset="assets|pasta|arquivo.webp" src="...">` no template do jogo,
e o código resolve tudo por `window.__fcAsset('assets/pasta/arquivo.webp')`. **Toda imagem nova usada por código
ou pela Home precisa entrar nesse registro.** Sintoma de esquecer: tela publicada sem imagens.

## 5. Estratégia de geração — o que funciona

| Tipo de objeto | Técnica certa | Nunca |
|---|---|---|
| Geométrico simétrico (moeda, gema, ficha, botão) | 3D em código (three.js) ou 2D | IA 3D de imagem única (achata, duplica, "papel alumínio") |
| Personagem/orgânico | **Poses 2D desenhadas** geradas em lote com a mesma referência | Auto-rig + mocap humano (vira gelatina) |
| Fumaça, gás, nuvem, brilho | 2D com alfa | Qualquer 3D (não tem superfície) |
| Símbolo do rolo | Remaster 2D fiel | Descrever cores no prompt (a IA inventa) |

### Receita de poses de personagem (a que finalmente deu certo)
1. Uma **imagem mestre** aprovada (pose neutra, fundo transparente, sem sombra no chão).
2. Planejar a **sequência inteira** da reação antes de gerar (ex.: aceno = 5 quadros: levanta, mão alta, meio, baixa, volta).
3. Gerar **todas as poses de uma vez**, cada uma com a mestre como referência e o mesmo bloco de texto
   "EXATAMENTE o mesmo personagem... mesma escala, mesmo enquadramento, pés na mesma linha, luz uniforme, sem sombra".
4. **Alinhar** cada pose à mestre (altura da coroa aos pés + centro das pernas) e apagar sombra de chão.
5. Quando só uma parte muda (ex.: braço da moeda), **colar só essa região** sobre a mestre — o resto fica pixel
   idêntico e o tamanho nunca "pisca".
6. **Inspecionar todos os quadros** (cores, mãos, unhas, objetos duplicados) antes de animar.
7. Animar com trocas **lentas** (≥ ~0,25 s por pose) + mola de escala/posição. Trocas rápidas de desenho piscam de tamanho.

### Prompts — regras
- Remaster: "faithful copy... only improve sharpness... same colors as reference". **Não citar cores.**
- Frente e verso / vistas: **mesmo pedido de estilo, mesma referência, no mesmo lote**.
- Sempre: "flat even lighting, no cast shadow, no ground shadow, transparent background" (a luz vem do render).
- Asset com luz pintada → gerar versão ALBEDO antes de usar em 3D.

## 6. Lições aprendidas (erros que custaram tempo/créditos)

1. **Confirmar o asset-fonte** antes de gerar (Happeach antigo sem braços → créditos perdidos).
2. **Remendar fundo raramente funciona.** Depois de 3 tentativas, refazer a área inteira é mais rápido e fica limpo.
3. **IA 3D de imagem única** inventa o verso. Para personagem 3D use multi-view; para mascote animado, prefira 2D.
4. **Auto-rig + mocap** em mascote cartoon = gelatina. Mesh-warp 2D (deformar a imagem) também ficou ruim.
5. **Arte com luz pintada colada em 3D** = luz dupla, estranha.
6. **Trocar de desenho rápido** (malabares a 2–3 trocas/s) faz o personagem piscar de tamanho. Use ações de troca lenta
   (ex.: cara ou coroa: 3 trocas em 3,8 s).
7. **Objeto desenhado + objeto animado ao mesmo tempo** = dois objetos (moeda duplicada). Apagar o desenhado deixa mancha.
   Certo: mostrar só o desenhado enquanto está na mão e só o animado enquanto voa, cronometrado com o fade.
8. **Piscar preto em efeitos**: `mix-blend-mode`, `clip-path` animado, sombras grandes e filtros recalculados por quadro
   causam quadros pretos em alguns celulares. Use só `transform` e `opacity`; pré-renderize brilhos em bitmap.
9. **Lag ao começar a girar**: construir efeitos no primeiro toque. Pré-construa após o carregamento.
10. **Hover no celular**: `:hover` gruda depois do toque e "acende" o botão. Não use hover em botões de jogo.
11. **Matemática**: sempre simular. Jogar na mão não revela um RTP de 212%.
12. **Números para idosos**: "1.000", nunca "1 mil"; "2,5", não "2,50".
13. **Modal importante (bônus diário)** = obrigatório tocar. Nada que o idoso possa perder sem ver.
14. **Personagem decorativo fica atrás da máquina** — a máquina é sempre a camada principal.

## 7. Custos de referência (Meshy, set–out/2026)
- Meshy Pro ≈ US$ 20/mês = 1.000 créditos.
- image-to-image (GPT Image 2) ≈ 10 créditos por imagem; imagem→3D ≈ 20–30; multi-view 3D ≈ 40–55; remesh ≈ 5.
- Uma reação de personagem com 4–5 poses ≈ 40–50 créditos se planejada; 2–3× isso se gerada no improviso.
- Log detalhado: `guidelines/asset-pipeline.md`.

## 8. Como rodar localmente
Os `.dc.html` precisam ser servidos por HTTP (não abrir via `file://`):
```
npx serve .            # ou: python3 -m http.server 8080
# abra http://localhost:3000/Fortune%20Circus.dc.html
```
Parâmetros úteis na URL: `?from=home` (pula a Home), `?no3d=1` (não carrega nada 3D).
O runtime `support.js` é necessário ao lado dos `.dc.html`.

## 9. Infra para a publicação oficial (roteiro para Claude Code ou dev)

### Fase 1 — Portar para um projeto web padrão
1. Criar projeto **Vite + React + TypeScript**.
2. Portar cada `.dc.html` para componentes React: o template vira JSX, a classe `Component` vira um componente
   (estado e lógica copiados quase 1:1; `renderVals()` vira o corpo do render). Manter estilos inline no início.
3. Separar: `game/engine.ts` (regras, RTP, sorteio, avaliação de linhas — **sem DOM**), `game/fx/*` (efeitos),
   `audio/sfx.ts` (sons Web Audio), `screens/Home.tsx`, `screens/Game.tsx`, `mascot/KingRico.tsx`.
4. Copiar `assets/` (só o que o jogo usa: WebP/PNG listados no registro `data-asset`) para `public/assets`.
   Com Vite, o problema do registro some (imports normais); pode remover `__fcAsset`.
5. Testes: `engine.test.ts` com simulação de 500 mil giros que **falha se o RTP sair de 96–99%** ou a taxa de acerto
   cair abaixo de 20%.

### Fase 2 — PWA
- `manifest.webmanifest`: nome "King Rico", `display: standalone`, `orientation: portrait`, cores `#45157a`.
- Ícones 192, 512 e maskable 512 + `apple-touch-icon` 180 (gerar a partir do King Rico mestre).
- Service worker (vite-plugin-pwa, Workbox): pré-cache de todos os assets → abre rápido e offline.
- Tela "Instale o jogo" para iPhone (Compartilhar → Adicionar à Tela de Início), com figuras grandes.

### Fase 3 — Login e progresso na nuvem
- **Firebase Auth** com Google. **Firestore**: `users/{uid}` com saldo, cesta de pêssegos, dia do bônus, preferências.
- **Toda regra que mexe em saldo roda no servidor** (Cloud Functions): sorteio do giro, bônus diário, recompensa de anúncio.
  O cliente só anima o resultado. Senão qualquer um edita o saldo no navegador.
- Manter `localStorage` como cache offline; sincronizar ao reconectar.

### Fase 4 — Anúncios
- Web/PWA: Google AdSense / Ad Manager com **anúncio premiado** ("assistir para ganhar moedas") no lugar da recarga grátis.
  Cassino social exige aprovação — deixe claro na política que não há dinheiro real nem resgate.
- Frequência: nunca durante um giro ou a Rodada Especial; só em pontos de pausa (Home, saldo zerado).

### Fase 5 — Conformidade (obrigatório para cassino social)
- Aviso **18+** na primeira abertura; política de privacidade e termos; texto "jogo de entretenimento, sem prêmios em dinheiro".
- Sem compra de moedas com dinheiro real nesta versão.
- Acessibilidade: contraste ≥ 4,5:1, alvos ≥ 44 px, textos ≥ 16 px, opção de desligar vibração e sons.

### Fase 6 — Hospedagem
- **Firebase Hosting** (já casa com Auth/Firestore) ou Vercel. HTTPS obrigatório para PWA.
- CI no GitHub Actions: build + testes de RTP + deploy na branch `main`.

## 10. Segredos
- A chave da API do Meshy aparece como `MESHY_API_KEY` nos scripts. **Nunca** commitar a chave real; use variável de
  ambiente. Gere uma chave nova no painel do Meshy se a antiga foi exposta.
- Tokens do GitHub usados durante a prototipação devem ser revogados.

## 11. Como trabalhar neste projeto (para a próxima IA)
1. Leia `CLAUDE.md` e `guidelines/asset-pipeline.md` antes de gerar qualquer asset.
2. Para pedidos visuais, mostre comparação lado a lado com o original antes de aplicar.
3. Se o pedido do dono levar a uma técnica que historicamente falha (seção 6), diga **antes**, explique e proponha a certa.
4. Mudanças pequenas = mexer só no que foi pedido.
5. Depois de cada mudança visível no jogo, teste no tamanho de celular (453 × 802 é o palco de referência) e no
   arquivo publicado (arquivo único), não só no editor.
6. Registre custo e resultado de cada geração no log.
