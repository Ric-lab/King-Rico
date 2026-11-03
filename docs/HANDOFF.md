# Handoff: a mesma tarefa, contínua

**Prévia online:** bloqueada na autenticação Google; canal ainda sem URL.
Execução: https://github.com/Ric-lab/King-Rico/actions/runs/41641476323

Entrada mais recente no topo. Quem for chamado (Claude ou Codex) continua
exatamente pelo "Próximo passo". Regras em [Fluxo](FLUXO-CLAUDE-CODEX.md).

## 2026-11-03 · Codex · canal de prévia (`c75bef5` + registro deste commit)

- **Tarefa em andamento:** prévia pública fixa atualizada pelo GitHub a cada commit.
- **Feito:** workflow `preview-channel.yml` para `codex/**` e disparo manual;
  build da carteira fictícia; deploy exclusivo do canal `previa`, validade 30d;
  URL no resumo; teste de navegador online e capturas após publicar.
- **Verificação real:** build aprovado no Actions. Hosting emulado com o
  `firebase.json` real passou em 360/390/430 px: 9 tambores, giro, moedas de
  teste e recuperação 2D, sem assets ausentes/erros. Produção e regras intactas.
- **Bloqueio:** Google recusou a condição de atributos do provider; a publicação
  não chegou a executar. Não há URL do canal para registrar/testar online ainda.
- **Próximo passo exato:** ler `docs/PREVIA-AUTENTICACAO.md`. O proprietário
  precisa decidir/configurar projeto Spark de prévia com conta isolada para
  preservar a exigência de nenhum acesso ao live oficial. Não liberar a conta
  de produção para branches codex como se isso fosse uma permissão só de canal.
  Depois ajustar os campos de autenticação/projeto em `preview-channel.yml`,
  push, conferir Actions/navegador remoto e substituir o bloqueio pela URL real
  aqui e em `docs/PREVIA-CIRCUS.md`.
- **Como conferir:** `npm run build:preview`; Hosting emulado (somente hosting,
  projeto `demo-king-rico`); `KING_RICO_TEST_URL=http://127.0.0.1:5000 python3
  tests/circus_depth_browser.py`. O workflow executa o mesmo teste online.

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
