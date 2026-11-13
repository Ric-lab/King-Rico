# Painel de Tarefas — King Rico

Este arquivo `.md` foi **aposentado e substituído** pelo painel web sincronizado entre o dono, **Antigravity (Gemini)**, **Claude** e **GPT/Codex**:

- 🌐 **Painel Web (Dono + IAs):** **https://ric-lab.github.io/King-Rico/todo/**
- 📄 **Fonte de dados única (JSON):** [`docs/todo.json`](todo.json)
- 🛠️ **CLI obrigatória para os 3 agentes de IA:**
  - `node scripts/todo.mjs list` — lê todas as tarefas (destacando no topo as atribuídas pelo dono a cada IA)
  - `node scripts/todo.mjs add "Título" --cat="Visual & Ritmo" --agent="Antigravity|Claude|Codex"` — cria nova tarefa
  - `node scripts/todo.mjs assign <id> <Antigravity|Claude|Codex|none>` — atribui tarefa a uma IA
  - `node scripts/todo.mjs move <id> <todo|preview|done> --agent="Claude|Codex|Antigravity" --commit="abc1234" --demo="https://..."` — move tarefa
  - `node scripts/todo.mjs edit <id> --title="..." --notes="..." --demo="https://..."` — edita tarefa
  - `node scripts/todo.mjs rm <id>` — remove tarefa
  - `node scripts/todo.mjs watch --agent=Antigravity` — escuta o GitHub em background e acorda o agente quando o dono atribuir uma tarefa no site

> **Atenção agentes:** Nunca recrie listas de tarefas neste `.md`. Leia e grave sempre em `docs/todo.json` via `node scripts/todo.mjs`.

## Escopo ativo reservado — Circus v6 (Codex)
Escopo reservado: `cloud/` (perfil/motor v6/carteira), `firestore.rules`, `ui/park/` (símbolos, defesa e retirada do acesso às atrações), Circus, catálogo/build, testes e documentação da economia. Preservar sons, patadas e raspadinha aprovados.
