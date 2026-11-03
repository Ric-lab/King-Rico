# Handoff: a mesma tarefa, contínua

**Prévia online:** https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus
Projeto isolado Spark: `king-rico-previa-1408805633`. Canal `previa`.
Workflow confirmado: https://github.com/Ric-lab/King-Rico/actions/runs/41647536617

Entrada mais recente no topo. Quem for chamado (Claude ou Codex) continua
exatamente pelo "Próximo passo". Regras em [Fluxo](FLUXO-CLAUDE-CODEX.md).

## 2026-11-03 · Codex · prévia online publicada e testada

- **Feito:** `2d0b14a` publicou a interface no projeto isolado, usando a conta
  `king-rico-preview`. Actions e teste de navegador remoto concluíram com sucesso.
- **URL compartilhada:** https://king-rico-previa-1408805633--previa-okw4doeq.web.app/circus
- **Conferência real:** 9 tambores com `data-drum-depth=ready`, 18 draws;
  mesmos símbolos no repouso/parada; um giro contabilizado; carteira `park-preview`;
  recuperação por perda de contexto e inicialização sem WebGL funcionando;
  larguras 360/390/430 px; zero erros de console e assets ausentes. As medidas
  de sombra coincidem com localhost. Capturas no artefato do workflow acima.
- **Próximo passo exato:** dono e Claude abrem a URL acima para avaliar os rolos.
  Continuar o ajuste visual solicitado, sem mexer na direção ou publicar em main.
  Antes de editar, puxar esta branch; depois fazer commit/push e acompanhar
  `preview-channel.yml` até deploy e QA passarem. Atualiza o mesmo endereço.
- **Limites:** carteira fictícia separada por navegador; não é saldo compartilhado
  entre Claude e dono. Canal expira em 30d sem deploy. Site oficial e regras intactos.
- **Registro deste commit:** teste passa a abrir pela rota limpa `/circus` e
  verifica `/park` por HTTP, além de já carregar `/assets` e Three.js em `/runtime`.

## 2026-11-03 · Codex · provisionamento concluído, disparar deploy

- **Confirmado pelo Cloud Shell do dono:** vínculos IAM aplicados; projeto
  `king-rico-previa-1408805633`, número `61167555727`, conta e provider dedicados.
- **Feito:** valores públicos como padrão auditável no workflow (variáveis
  Actions continuam opcionais). Nenhuma chave, token ou mudança em produção.
- **Próximo passo exato:** acompanhar o workflow disparado por este commit;
  corrigir qualquer erro de deploy/QA, registrar URL real no topo deste arquivo
  e em PREVIA-CIRCUS.md, conferir os nove tambores e carteira fictícia online.

## 2026-11-03 · Codex · aguardar propagação da conta de serviço

- **Feito no Cloud Shell do dono:** pool `king-rico-preview-github`, provider
  `github` e conta `king-rico-preview@king-rico-previa-1408805633.iam.gserviceaccount.com`
  criados. A atribuição de Hosting Admin retornou “service account does not exist”
  imediatamente após a criação bem-sucedida da conta.
- **Correção versionada:** os dois vínculos IAM finais são repetidos até seis
  vezes com espera de 10s. Mesmos papéis e projeto; sem ampliar permissões.
  A criação não é repetida se os recursos já existem. Sintaxe Bash conferida.
- **Próximo passo exato:** no clone do Cloud Shell, `git pull --ff-only origin
  codex/penalty-clown-preview` e `bash scripts/setup-preview-cloud.sh`. Enviar
  os dois valores públicos finais. Depois configurar GitHub, publicar canal,
  verificar navegador remoto e registrar a URL. Não pedir nova autorização.
- **Limite:** retomada ainda depende da sessão administrativa do dono; sem URL.

## 2026-11-03 · Codex · retomar criação do pool WIF

- **Tarefa em andamento:** concluir a prévia isolada autorizada pelo dono.
- **Feito:** o dono executou o script no Cloud Shell; projeto
  `king-rico-previa-1408805633` criado e APIs habilitadas. Parou em
  `iam.workloadIdentityPools.create` com PERMISSION_DENIED.
- **Correção:** script preserva o projeto existente; se a criação do pool
  falhar, atribui `roles/iam.workloadIdentityPoolAdmin` ao usuário de setup
  somente nesse projeto e tenta novamente por até seis intervalos de 10s.
  Owner também inclui a permissão; propagação do projeto novo pode explicar
  a falha. Se a concessão ou as tentativas falharem, investigar o erro real,
  sem conceder papéis em produção. Sintaxe Bash conferida.
- **Próximo passo exato:** dono roda `git pull --ff-only` e
  `bash scripts/setup-preview-cloud.sh` no clone já aberto no Cloud Shell.
  Com as duas variáveis públicas finais, configurar GitHub e disparar deploy;
  conferir QA remoto e registrar URL aqui e em PREVIA-CIRCUS.md.
- **Limite:** não há credenciais Google nesta VM; correção ainda não executada
  no Cloud Shell. Nenhuma nova URL foi confirmada.

## 2026-11-03 · Codex · projeto de prévia isolado autorizado

- **Tarefa em andamento:** colocar a prévia compartilhada em projeto Firebase
  Spark separado; autorização expressa do proprietário nesta conversa.
- **Feito:** `scripts/setup-preview-cloud.sh` provisiona projeto, Hosting,
  conta e WIF dedicados sem tocar em produção. Workflow usa duas variáveis
  públicas, recusa `king-rico`, gera configuração com Hosting apenas e valida
  a URL do projeto isolado. Testes de isolamento e sintaxe passaram.
- **Bloqueio atual:** esta VM não possui gcloud nem identidade Google
  administrativa; Firebase CLI confirmou `Failed to authenticate`. Autorização
  do dono não cria uma sessão Google. Nenhum projeto foi criado ainda.
- **Próximo passo exato:** proprietário executa o comando do topo de
  `docs/PREVIA-AUTENTICACAO.md` no Cloud Shell e informa as duas variáveis
  públicas geradas (ou confirma que foram gravadas pelo script). Codex então
  confere os valores, faz push para disparar Actions, acompanha deploy e QA,
  registra a URL fixa em `docs/PREVIA-CIRCUS.md` e no topo deste HANDOFF.
  Não pedir novamente autorização para criar esse projeto ou publicar a prévia.
- **Como conferir:** `bash -n scripts/setup-preview-cloud.sh` e
  `node --test tests/preview-isolation.test.mjs`. A criação Google ainda não
  foi executada; a prévia continua sem URL confirmada.

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
