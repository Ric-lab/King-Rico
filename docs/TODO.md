# Painel de Tarefas — King Rico

Este arquivo `.md` foi **aposentado e substituído** pelo painel web sincronizado entre o dono, **Antigravity (Gemini)**, **Claude** e **GPT/Codex**:

- 🌐 **Painel Web (Dono + IAs):** **https://ric-lab.github.io/King-Rico/todo/**
- 📄 **Fonte de dados única (JSON):** [`docs/todo.json`](todo.json)
- 🛠️ **CLI obrigatória para os 3 agentes de IA:**
  - `node scripts/todo.mjs list` — lê todas as tarefas atualizadas pelo dono no site ou pelas outras IAs
  - `node scripts/todo.mjs add "Título" --cat="Visual & Ritmo" --demo="https://..."` — cria nova tarefa
  - `node scripts/todo.mjs move <id> <todo|preview|done> --agent="Claude|Codex|Antigravity" --commit="abc1234" --demo="https://..."` — move tarefa
  - `node scripts/todo.mjs edit <id> --title="..." --notes="..." --demo="https://..."` — edita tarefa
  - `node scripts/todo.mjs rm <id>` — remove tarefa

> **Atenção agentes:** Nunca recrie listas de tarefas neste `.md`. Leia e grave sempre em `docs/todo.json` via `node scripts/todo.mjs`.

## Escopo ativo reservado — Circus v6 (Codex)
Escopo reservado: `cloud/` (perfil/motor v6/carteira), `firestore.rules`, `ui/park/` (símbolos, defesa e retirada do acesso às atrações), Circus, catálogo/build, testes e documentação da economia. Preservar sons, patadas e raspadinha aprovados.
