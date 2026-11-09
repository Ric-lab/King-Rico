# Fluxo entre modelos

Todos os modelos (Claude, Codex, outros) são um só desenvolvedor.
1. Puxar o último commit.
2. Ler `AGENTS.md` → `docs/skills/` → `docs/HANDOFF.md`.
3. Trabalhar na branch da prévia (`codex/penalty-clown-preview`); ela publica a URL de prévia (docs/PREVIA-CIRCUS.md).
4. Aprovado pelo dono → levar para `main` (publica o site oficial).
5. Ao parar: commit + push + entrada no HANDOFF. Checkpoints de fonte/documentação usam `[skip ci]` quando não há publicação pretendida.
6. Seguir a estratégia permanente em AGENTS.md: teste focado e prévia cedo em ajustes pequenos; agrupar mudanças aprovadas para publicar. Não confundir checkpoint com atualização da URL de teste.
