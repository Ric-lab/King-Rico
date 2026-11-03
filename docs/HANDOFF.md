# Handoff: a mesma tarefa, contínua

**Prévia online:** aguardando primeira execução do canal `previa`.

Entrada mais recente no topo. Quem for chamado (Claude ou Codex) continua
exatamente pelo "Próximo passo". Regras em [Fluxo](FLUXO-CLAUDE-CODEX.md).

## 2026-11-03 · Claude · commit 9113f45 (sobre 812e6b1)

- **Tarefa em andamento:** melhorar os rolos da slot machine do Circus
  (9 tambores em Three.js, luz e sombras), branch `codex/penalty-clown-preview`.
- **Feito:** tambores, iluminação e sombras laterais (commits até `955e081`);
  fita `HEIGHT=146` + `.park-reel-paper` + `build:preview` (`812e6b1`).
  Prévia visual aberta para o dono (sem giro, carteira fictícia). Fluxo único
  Claude+Codex documentado.
- **Próximo passo exato:** o dono avaliar os tambores na prévia
  (`npm run build:preview` → http://localhost:4178/Fortune%20Circus.dc.html)
  e dizer o que ajustar na aparência dos rolos. Sem pedido novo, não mexer.
- **Pela metade / riscos:** nada publicado. `main` continua em `aae21d3`.
  Merge só com autorização do dono.
- **Como conferir:** `node --test tests/reel-tape.test.cjs tests/adapters.test.cjs`
  e `python3 tests/circus_depth_browser.py` com a prévia aberta.
