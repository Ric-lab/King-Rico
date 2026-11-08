# Commit, prévia, publicação

- `main` publica sozinha no site oficial depois de passar nos testes (workflow "Publicar King Rico no Firebase"). Teste falhou = nada vai ao ar.
- Prévia compartilhada: branch `codex/penalty-clown-preview` → canal de prévia isolado (ver docs/PREVIA-CIRCUS.md). Nunca usar a conta de produção para a prévia.
- Commit: mensagem em português dizendo o que mudou. Confirmar ao dono com o hash curto.
- Depois do push: conferir o resultado no Actions; se falhar, ler o log e corrigir antes de avisar.
- Ao parar: atualizar docs/HANDOFF.md com "feito" e "próximo passo".
- Nada é apagado: arquivo velho vai para `archive/`; branch velha vira tag `archive/<nome>`.
- Segredos (tokens, contas de serviço) nunca entram no Git.

- Prévias: testes locais focados na mudança, um build de prévia e um de produção após integração quando exigido; um commit com HANDOFF, sem segundo commit só para copiar status do Actions. Conferir Actions com resumo curto, sem despejar payloads nem repetir diagnóstico.
- Workflow de prévia executa as seis regressões de navegador em pares independentes (`scripts/test-preview-browsers.py`); logs separados e screenshots preservados. Não retirar testes para acelerar.
