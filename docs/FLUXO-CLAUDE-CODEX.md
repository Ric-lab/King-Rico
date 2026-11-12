# Fluxo entre modelos

Todos os modelos (Claude, Codex, outros) são um só desenvolvedor.
1. Puxar o último commit.
2. Ler `AGENTS.md` → `docs/skills/` → `docs/HANDOFF.md`.
3. Trabalhar na branch da prévia (`codex/penalty-clown-preview`); ela publica a URL de prévia (docs/PREVIA-CIRCUS.md).
4. Aprovado pelo dono → levar para `main` (publica o site oficial).
5. Ao parar: commit + push + entrada no HANDOFF. Checkpoints de fonte/documentação usam `[skip ci]` quando não há publicação pretendida.
6. Seguir a estratégia permanente em AGENTS.md: teste focado e prévia cedo em ajustes pequenos; agrupar mudanças aprovadas para publicar. Não confundir checkpoint com atualização da URL de teste.

## Endereço padrão de teste — decisão do dono

- Toda prévia para o dono deve apontar para **https://ric-lab.github.io/King-Rico/circus/**.
- Push à branch compartilhada usa `preview-pages.yml`; confirmar sucesso e entregar o link com `?demo=` pertinente. `?demo=off` abre o jogo normal.
- Firebase Hosting em **king-rico.web.app** continua sendo o oficial. Não oferecer links Firebase de prévia como se fossem os atualizados.
- Falha no Pages: corrigir/registrar o bloqueio; não trocar silenciosamente o link para outro host.
