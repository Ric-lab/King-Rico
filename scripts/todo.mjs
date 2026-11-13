#!/usr/bin/env node
// Gerenciador único do painel de tarefas compartilhado (Dono, Claude, GPT/Codex e Gemini/Antigravity).
// Substitui o antigo TODO.md. A única fonte da verdade é docs/todo.json (lida e gravada pelo site /todo/ e pelas 3 IAs).
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(root, 'docs', 'todo.json');
const mdPath = path.join(root, 'docs', 'TODO.md');

export function loadBoard() {
  return JSON.parse(readFileSync(jsonPath, 'utf8'));
}

export function renderPointerMarkdown(board) {
  return `# Painel de Tarefas — King Rico

Este arquivo \`.md\` foi **aposentado e substituído** pelo painel web sincronizado entre o dono, **Antigravity (Gemini)**, **Claude** e **GPT/Codex**:

- 🌐 **Painel Web (Dono + IAs):** **${board.boardUrl || 'https://ric-lab.github.io/King-Rico/todo/'}**
- 📄 **Fonte de dados única (JSON):** [\`docs/todo.json\`](todo.json)
- 🛠️ **CLI obrigatória para os 3 agentes de IA:**
  - \`node scripts/todo.mjs list\` — lê todas as tarefas (destacando no topo as atribuídas pelo dono a cada IA)
  - \`node scripts/todo.mjs add "Título" --cat="Visual & Ritmo" --agent="Antigravity|Claude|Codex"\` — cria nova tarefa
  - \`node scripts/todo.mjs assign <id> <Antigravity|Claude|Codex|none>\` — atribui tarefa a uma IA
  - \`node scripts/todo.mjs move <id> <todo|preview|done> --agent="Claude|Codex|Antigravity" --commit="abc1234" --demo="https://..."\` — move tarefa
  - \`node scripts/todo.mjs edit <id> --title="..." --notes="..." --demo="https://..."\` — edita tarefa
  - \`node scripts/todo.mjs rm <id>\` — remove tarefa
  - \`node scripts/todo.mjs watch --agent=Antigravity\` — escuta o GitHub em background e acorda o agente quando o dono atribuir uma tarefa no site

> **Atenção agentes:** Nunca recrie listas de tarefas neste \`.md\`. Leia e grave sempre em \`docs/todo.json\` via \`node scripts/todo.mjs\`.

## Escopo ativo reservado — Circus v6 (Codex)
Escopo reservado: \`cloud/\` (perfil/motor v6/carteira), \`firestore.rules\`, \`ui/park/\` (símbolos, defesa e retirada do acesso às atrações), Circus, catálogo/build, testes e documentação da economia. Preservar sons, patadas e raspadinha aprovados.
`;
}

export function saveBoard(board) {
  board.updatedAt = new Date().toISOString().slice(0, 10);
  writeFileSync(jsonPath, JSON.stringify(board, null, 2) + '\n');
  writeFileSync(mdPath, renderPointerMarkdown(board));
}

function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (const a of args) {
    if (a.startsWith('--') && a.includes('=')) {
      const idx = a.indexOf('=');
      flags[a.slice(2, idx)] = a.slice(idx + 1);
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd = 'list', ...rest] = process.argv.slice(2);
  const { flags, positional } = parseFlags(rest);
  const board = loadBoard();

  if (cmd === 'sync') {
    saveBoard(board);
    console.log('Sincronizado docs/todo.json (' + board.items.length + ' itens).');
  } else if (cmd === 'list') {
    const assigned = board.items.filter(i => i.status === 'todo' && i.agent && i.agent !== 'Dono');
    if (assigned.length) {
      console.log(`\n🎯 === ATRIBUÍDAS PELO DONO (${assigned.length}) ===`);
      for (const i of assigned) {
        console.log(`  👉 [${i.agent.toUpperCase()}] [${i.id}] (${i.category}) ${i.title}${i.notes ? ' | ' + i.notes : ''}`);
      }
    }
    for (const [status, label] of [['todo', '📋 A FAZER'], ['preview', '🧪 NA PRÉVIA (TESTAR)'], ['done', '✅ FEITO']]) {
      const list = board.items.filter(i => i.status === status);
      console.log(`\n=== ${label} (${list.length}) ===`);
      for (const i of list) {
        const who = i.agent ? ` [${i.agent}]` : '';
        console.log(`  [${i.id}]${who} (${i.category}) ${i.title}${i.demoUrl ? ' -> ' + i.demoUrl : ''}${i.notes ? ' | ' + i.notes : ''}`);
      }
    }
  } else if (cmd === 'add') {
    const title = positional.join(' ').trim();
    if (!title) throw new Error('Informe o título: node scripts/todo.mjs add "Minha tarefa"');
    const id = flags.id || ('t-' + title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24));
    board.items.unshift({
      id,
      title,
      status: flags.status || 'todo',
      category: flags.cat || 'Visual & Ritmo',
      agent: flags.agent || '',
      commit: flags.commit || '',
      demoUrl: flags.demo || '',
      notes: flags.notes || ''
    });
    saveBoard(board);
    console.log(`Adicionado [${id}]: ${title}`);
  } else if (cmd === 'assign') {
    const [id, agentName = ''] = positional;
    const item = board.items.find(i => i.id === id);
    if (!item) throw new Error(`Tarefa não encontrada: ${id}`);
    item.agent = agentName === 'none' ? '' : agentName;
    saveBoard(board);
    console.log(`Tarefa [${id}] atribuída para: ${item.agent || 'Qualquer IA'}.`);
  } else if (cmd === 'move') {
    const [id, status] = positional;
    if (!id || !['todo', 'preview', 'done'].includes(status)) {
      throw new Error('Uso: node scripts/todo.mjs move <id> <todo|preview|done> [--agent=...] [--commit=...] [--demo=...]');
    }
    const item = board.items.find(i => i.id === id);
    if (!item) throw new Error(`Tarefa não encontrada: ${id}`);
    item.status = status;
    if (flags.agent !== undefined) item.agent = flags.agent;
    if (flags.commit !== undefined) item.commit = flags.commit;
    if (flags.demo !== undefined) item.demoUrl = flags.demo;
    if (flags.notes !== undefined) item.notes = flags.notes;
    saveBoard(board);
    console.log(`Movido [${id}] para ${status}.`);
  } else if (cmd === 'edit') {
    const [id] = positional;
    const item = board.items.find(i => i.id === id);
    if (!item) throw new Error(`Tarefa não encontrada: ${id}`);
    if (flags.title !== undefined) item.title = flags.title;
    if (flags.cat !== undefined) item.category = flags.cat;
    if (flags.agent !== undefined) item.agent = flags.agent;
    if (flags.commit !== undefined) item.commit = flags.commit;
    if (flags.demo !== undefined) item.demoUrl = flags.demo;
    if (flags.notes !== undefined) item.notes = flags.notes;
    saveBoard(board);
    console.log(`Editado [${id}].`);
  } else if (cmd === 'rm' || cmd === 'delete') {
    const [id] = positional;
    const idx = board.items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error(`Tarefa não encontrada: ${id}`);
    const [removed] = board.items.splice(idx, 1);
    saveBoard(board);
    console.log(`Removido [${removed.id}].`);
  } else if (cmd === 'watch') {
    const targetAgent = (flags.agent || 'Antigravity').toLowerCase();
    const maxMinutes = Number(flags.minutes || 30);
    const maxLoops = Math.ceil((maxMinutes * 60) / 8);
    console.log(`Escutando atribuições no painel /todo/ para "${flags.agent || 'Antigravity'}"...`);
    for (let i = 0; i < maxLoops; i++) {
      try {
        execFileSync('git', ['fetch', 'origin', 'codex/penalty-clown-preview', '--quiet'], { cwd: root });
        const raw = execFileSync('git', ['show', 'origin/codex/penalty-clown-preview:docs/todo.json'], { cwd: root, encoding: 'utf8' });
        const remote = JSON.parse(raw);
        const match = remote.items.find(it => it.status === 'todo' && (it.agent || '').toLowerCase().includes(targetAgent));
        if (match) {
          execFileSync('git', ['pull', '--rebase', 'origin', 'codex/penalty-clown-preview', '--quiet'], { cwd: root });
          console.log(`\n🚀 TAREFA ACIONADA NO PAINEL PARA ${match.agent.toUpperCase()}:`);
          console.log(JSON.stringify(match, null, 2));
          process.exit(0);
        }
      } catch {
        // Ignora falha transitória de rede
      }
      await new Promise(r => setTimeout(r, 8000));
    }
    console.log('Tempo de escuta encerrado sem novas atribuições.');
  } else {
    throw new Error(`Comando desconhecido: ${cmd}`);
  }
}
