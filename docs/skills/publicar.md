# Commit, prévia, publicação

- `main` publica sozinha no site oficial depois de passar nos testes (workflow "Publicar King Rico no Firebase"). Teste falhou = nada vai ao ar.
- Prévia compartilhada: branch `codex/penalty-clown-preview` → canal de prévia isolado (ver docs/PREVIA-CIRCUS.md). Nunca usar a conta de produção para a prévia.
- Commit: mensagem em português dizendo o que mudou. Confirmar ao dono com o hash curto.
- Depois do push: conferir o resultado no Actions; se falhar, ler o log e corrigir antes de avisar.
- Ao parar: atualizar docs/HANDOFF.md com "feito" e "próximo passo".
- Nada é apagado: arquivo velho vai para `archive/`; branch velha vira tag `archive/<nome>`.
- Segredos (tokens, contas de serviço) nunca entram no Git.
