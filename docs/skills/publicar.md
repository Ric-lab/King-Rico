# Commit, prévia, publicação

- `main` publica sozinha no site oficial depois de passar nos testes (workflow "Publicar King Rico no Firebase"). Teste falhou = nada vai ao ar.
- Prévia compartilhada: branch `codex/penalty-clown-preview` → canal de prévia isolado (ver docs/PREVIA-CIRCUS.md). Nunca usar a conta de produção para a prévia.
- Commit: mensagem em português dizendo o que mudou. Confirmar ao dono com o hash curto.
- Quando o push dispara uma publicação: conferir o resultado no Actions; se falhar, ler o log e corrigir antes de declarar a publicação concluída. Checkpoints `[skip ci]` não exigem aguardar workflow.
- Ao parar: atualizar docs/HANDOFF.md com "feito" e "próximo passo".
- Nada é apagado: arquivo velho vai para `archive/`; branch velha vira tag `archive/<nome>`.
- Segredos (tokens, contas de serviço) nunca entram no Git.

- Prévias: testes locais focados na mudança, um build de prévia e um de produção após integração quando exigido; um commit com HANDOFF, sem segundo commit só para copiar status do Actions. Conferir Actions com resumo curto, sem despejar payloads nem repetir diagnóstico.
- Quando houver publicação, o workflow de prévia executa as regressões de navegador em pares independentes (`scripts/test-preview-browsers.py`); logs separados e screenshots preservados. Não retirar testes para acelerar.

## Iterações pequenas

Seguir a estratégia permanente em AGENTS.md: prévia cedo e teste local focado;
agrupar refinamentos aprovados antes de publicar. Não disparar a suíte/deploy
completos a cada detalhe. Preservar a colaboração com commit/push `[skip ci]`
quando a entrega for um checkpoint de fontes. Não confundir isso com atualizar
a URL compartilhada. Pedidos explícitos de publicar ou testar remotamente
continuam autorizando o workflow pertinente. Alterações financeiras continuam
exigindo validação de regras, idempotência e recuperação.

## Escopo da publicação — correção de 10/11/2026

- Quando o dono pede publicar a prévia aprovada, comparar TODO o conjunto da
  branch com main. Não publicar só o último ajuste por cherry-pick enquanto
  fundo, personagens, controles e animações anteriores ficam de fora. Uma
  publicação parcial só atende ao pedido se o dono limitar expressamente o escopo.
- Recursos que eram demos precisam de integração real e testes de transação
  antes de chegar ao oficial; copiar só a apresentação não conclui a entrega.
- Rejeitado: anunciar f4904b7 como publicação completa; era somente a cor do bônus.
