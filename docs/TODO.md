# TODO — Painel Compartilhado (Dono, Claude, GPT/Codex, Gemini)

👉 **Painel Visual Interativo:** **https://ric-lab.github.io/King-Rico/todo/**

> **Para os 3 agentes (Claude, Codex/GPT, Gemini/Antigravity):**
> - A fonte oficial é `docs/todo.json`. Use `node scripts/todo.mjs` para listar, adicionar ou mover tarefas (ele atualiza `docs/todo.json` e regenera este `docs/TODO.md` automaticamente).
> - Comandos rápidos:
>   - `node scripts/todo.mjs list`
>   - `node scripts/todo.mjs add "Título da tarefa" --cat="Visual & Ritmo" --demo="https://ric-lab.github.io/King-Rico/circus/?demo=..."`
>   - `node scripts/todo.mjs move <id> <todo|preview|done> --agent="Claude|Codex|Antigravity" --commit="abc1234" --demo="https://..."`
>   - `node scripts/todo.mjs sync`

## Escopo ativo reservado — Circus v6 (Codex)
Escopo reservado: `cloud/` (perfil/motor v6/carteira), `firestore.rules`, `ui/park/` (símbolos, defesa e retirada do acesso às atrações), Circus, catálogo/build, testes e documentação da economia. Preservar sons, patadas e raspadinha aprovados.

---

## 📋 A Fazer — Backlog (14)
- [ ] **[`t-cedro-todos`]** Cedro defende de TODOS os vilões (Tony, Tucker e Ray), não só do Tony; com 0 cedros não defende. Melhorar o depósito (onde ficam guardados) e as animações *(Economia & Regras · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=cedar))* — Sorteio/defesa base já existe na prévia v6; falta refinar onde os cedros ficam guardados e a animação da defesa.
- [ ] **[`t-ray-1a4`]** Ray rouba só de 1 a 4 cedros por vez (ajustar) *(Economia & Regras · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=ray))* — Limitar o roubo do Ray para 1 a 4 cedros.
- [ ] **[`t-roleta-min`]** Roleta nunca abre com prêmio da slot zerado: o 10º giro tem que pagar pelo menos o mínimo para o ×1 sempre devolver alguma coisa (ajustar economia junto) *(Economia & Regras · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=wheel))* — Garantir retorno mínimo no giro que abre a roleta mantendo RTP ~90%.
- [ ] **[`t-controle-penalty`]** Símbolo do controle de videogame já no jogo: por enquanto abre o antigo Fortune Penalty (só para funcionar; o jogo definitivo vem depois) *(Economia & Regras)* — Ativar o símbolo do controle nos rolos abrindo o Fortune Penalty temporariamente.
- [ ] **[`t-raspadinha-rapida`]** Raspadinha: o 1º risco rápido não toca o som da raspagem (o som tem que sair mesmo raspando rápido) *(Sons · [Testar](https://ric-lab.github.io/King-Rico/circus/))* — Destravar/iniciar o áudio logo no pointerdown/primeiro movimento rápido.
- [ ] **[`t-sfx-levanta`]** Sfx quando a slot machine levanta e abre a roleta *(Sons · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=wheel))* — Som mecânico/cordas ao içar a máquina para revelar a roleta.
- [ ] **[`t-sfx-aviao`]** Big win: sfx do avião parece moto — trocar por som de avião de verdade (hélice/jato leve) *(Sons · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=bigwin))* — Substituir síntese atual de motor por timbre de avião mais limpo.
- [ ] **[`t-musica-fundo`]** Música de fundo no mesmo ritmo da abertura do Bingo Plinko (repo Ric-lab/Bingo-Plinko-Lucky-Machine), sem letra, só em alguns momentos *(Sons)* — Referência no repo Ric-lab/Bingo-Plinko-Lucky-Machine.
- [ ] **[`t-roleta-tempo`]** Roleta: diminuir o tempo entre mostrar o valor sorteado e as moedas viajarem (fica tempo demais na tela) *(Visual & Ritmo · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=wheel))* — Encurtar a pausa após a parada da roleta antes do voo do disco/moedas.
- [ ] **[`t-bigwin-placa`]** Big win: retângulo branco com border-radius pulsando atrás do saldo subindo (legibilidade) *(Visual & Ritmo · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=bigwin))* — Destacar o número do prêmio durante o voo do avião.
- [ ] **[`t-king-reacoes`]** King Rico: reações casadas com o que acontece no jogo (ação → reação), mais longas e melhores; hoje é um loop independente *(Visual & Ritmo)* — Sincronizar expressões/poses do King Rico com giro, quase-vitória, ganho, vilão e bônus.
- [ ] **[`t-happeach-raio`]** Happeach → raio pêssego (borda laranja, sem texto, rosto menor) + placa igual à do ingresso no lugar da cesta, com contador e raio caindo no spin *(Visual & Ritmo)* — Substituir cesta por placa com contador e ícone de raio pêssego.
- [ ] **[`t-firestore-v6`]** Concluir regras Firestore v6 / persistência real (limite de 1.000 expressões) e conferir snapshot concorrente de cedros antes de publicar no oficial *(Economia & Regras · Codex)* — Bloqueio técnico para promover a v6 ao site oficial.
- [ ] **[`t-ideia-king-nuvem`]** Ideia futura (só fazer quando o dono pedir): King Rico caindo da nuvem até a roleta *(Ideias)* — Guardado em ideias.

---

## 🧪 Na Prévia — Para o Dono Testar / Aprovar (9)
- [~] **[`t-ingresso-asset`]** Ingresso (asset): mais dourado no meio e levemente inclinado *(Visual & Ritmo · Codex · `87d90e0` · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=ticket))* — V2 rejeitado por ficar alaranjado. V3 em dourado claro/champagne; mesma estrela roxa, inclinação e encaixe. Aguardando avaliação do dono.
- [~] **[`p-menu-tabela-3blocos`]** Tabela em 3 blocos (Prêmios, Power-ups, Vilões), só com ícones e valores; botão Home removido; menu = engrenagem; botão ▶ +1000 no header (fora do menu) *(Menu & Topo · Claude · `1a7f198` · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=off))* — Pronto na prévia para avaliação do dono.
- [~] **[`p-circus-v6`]** Circus v6 na prévia: 6 pagantes (ingresso 0,4 · circo 0,8 · capa 1,2 · moeda 2,5 · diamante 5 · coroa 10), trinca de cedro (até 5) e atrações arquivadas *(Economia & Regras · Codex · `c6bdb3c` · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=cedar))* — Auditoria RTP ~90% concluída na prévia.
- [~] **[`p-tony-patada-som`]** Patada do Tony = um som só, contínuo (zuum que desce até o grave com impacto) e moedas saindo ao tocar CONTINUAR *(Sons · Claude · `f23d8d7` · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=tony))* — Aprovado na base f23d8d7; aguardando publicação conjunta no oficial.
- [~] **[`p-tony-veu-tela-toda`]** Tony Tiger: efeito alaranjado/avermelhado na tela toda (preservando faixa de anúncio) durante as patadas *(Visual & Ritmo · Antigravity / Claude · `4bc80fa` · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=tony))* — Véu alaranjado/avermelhado em tela cheia na prévia.
- [~] **[`p-raspadinha-sfx`]** Sfx da raspadinha: raspar cada casa (mais alto), abrir casa (plim/toque grave), 3 iguais (fanfarra) e moedas subindo com tique do voo *(Sons · Claude · `b61619a` · [Testar](https://ric-lab.github.io/King-Rico/circus/))* — Abre ao carregar quando o bônus diário está disponível.
- [~] **[`p-roleta-sfx-voo`]** Roleta: tique original em arquivo WAV, sfx na parada e na ficha batendo no prêmio, e moedas voando uma única vez *(Sons · Claude · `6e00ec6` · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=wheel))* — Pronto na prévia.
- [~] **[`p-tucker-asas`]** Tucker com duas batidas de asa no roubo da cesta *(Visual & Ritmo · Claude · `fbe911d` · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=tucker))* — Pronto na prévia.
- [~] **[`p-viloes-bigwin-sfx`]** Sons dos vilões, big win, spin igual ao turbo e volumes equalizados *(Sons · Claude · `10f23cc` · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=off))* — Aguardando aprovação final do pacote de sons para publicar no site oficial.

---

## ✅ Feito — Aprovado / Concluído (5)
- [x] **[`d-roleta-aprovada`]** Roleta de bônus aprovada pelo dono (cores fixas por multiplicador + tique original) *(Visual & Ritmo · Equipe · `b0ffe91` · [Testar](https://ric-lab.github.io/King-Rico/circus/?demo=wheel))*
- [x] **[`d-patada-raspadinha-base`]** Dono testou e aprovou base de patada nova, raspagem e moedas no fim da raspadinha *(Sons · Equipe · `f23d8d7`)*
- [x] **[`d-pages-previa`]** Prévia oficial migrada e destravada no GitHub Pages (sem consumir cota do Firebase) *(Infra · Codex / Antigravity · `32086d4` · [Testar](https://ric-lab.github.io/King-Rico/circus/))*
- [x] **[`d-previa-engatilhada`]** Prévia engatilhada: 1º giro mostra a última mudança (?demo=off abre jogo normal) *(Infra · Claude / Codex · `6a199ce` · [Testar](https://ric-lab.github.io/King-Rico/circus/))*
- [x] **[`d-circus-v5-live`]** Economia Circus v5 publicada no site oficial (king-rico.web.app) *(Economia & Regras · Codex · `b394d9f` · [Testar](https://king-rico.web.app/circus))*
