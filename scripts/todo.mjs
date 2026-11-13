#!/usr/bin/env node
// Gerenciador único do backlog compartilhado (Dono, Claude, GPT/Codex e Gemini/Antigravity).
// Fonte estruturada: docs/todo.json -> gera automaticamente docs/TODO.md e abastece /todo/.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = path.join(root, 'docs', 'todo.json');
const mdPath = path.join(root, 'docs', 'TODO.md');

export function loadBoard() {
  return JSON.parse(readFileSync(jsonPath, 'utf8'));
}

export function renderMarkdown(board) {
  const byStatus = s => board.items.filter(i => i.status === s);
  const fmt = item => {
    const box = item.status === 'done' ? '[x]' : item.status === 'preview' ? '[~]' : '[ ]';
    const parts = [`- ${box} **[\`${item.id}\`]** ${item.title}`];
    const meta = [];
    if (item.category) meta.push(item.category);
    if (item.agent) meta.push(item.agent);
    if (item.commit) meta.push(`\`${item.commit}\``);
    if (item.demoUrl) meta.push(`[Testar](${item.demoUrl})`);
    if (meta.length) parts.push(`*(${meta.join(' · ')})*`);
    if (item.notes) parts.push(`— ${item.notes}`);
    return parts.join(' ');
  };

  return `# TODO — Painel Compartilhado (Dono, Claude, GPT/Codex, Gemini)

👉 **Painel Visual Interativo:** **${board.boardUrl}**

> **Para os 3 agentes (Claude, Codex/GPT, Gemini/Antigravity):**
> - A fonte oficial é \`docs/todo.json\`. Use \`node scripts/todo.mjs\` para listar, adicionar ou mover tarefas (ele atualiza \`docs/todo.json\` e regenera este \`docs/TODO.md\` automaticamente).
> - Comandos rápidos:
>   - \`node scripts/todo.mjs list\`
>   - \`node scripts/todo.mjs add "Título da tarefa" --cat="Visual & Ritmo" --demo="https://ric-lab.github.io/King-Rico/circus/?demo=..."\`
>   - \`node scripts/todo.mjs move <id> <todo|preview|done> --agent="Claude|Codex|Antigravity" --commit="abc1234" --demo="https://..."\`
>   - \`node scripts/todo.mjs sync\`

## Escopo ativo reservado — Circus v6 (Codex)
Escopo reservado: \`cloud/\` (perfil/motor v6/carteira), \`firestore.rules\`, \`ui/park/\` (símbolos, defesa e retirada do acesso às atrações), Circus, catálogo/build, testes e documentação da economia. Preservar sons, patadas e raspadinha aprovados.

---

## 📋 A Fazer — Backlog (${byStatus('todo').length})
${byStatus('todo').map(fmt).join('\n') || '_Nenhuma tarefa pendente._'}

---

## 🧪 Na Prévia — Para o Dono Testar / Aprovar (${byStatus('preview').length})
${byStatus('preview').map(fmt).join('\n') || '_Nenhum item aguardando avaliação na prévia._'}

---

## ✅ Feito — Aprovado / Concluído (${byStatus('done').length})
${byStatus('done').map(fmt).join('\n') || '_Nenhum item concluído._'}
`;
}

export function saveBoard(board) {
  board.updatedAt = new Date().toISOString().slice(0, 10);
  writeFileSync(jsonPath, JSON.stringify(board, null, 2) + '\n');
  writeFileSync(mdPath, renderMarkdown(board));
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
    console.log('Sincronizado docs/todo.json -> docs/TODO.md (' + board.items.length + ' itens).');
  } else if (cmd === 'list') {
    for (const [status, label] of [['todo', '📋 A FAZER'], ['preview', '🧪 NA PRÉVIA (TESTAR)'], ['done', '✅ FEITO']]) {
      const list = board.items.filter(i => i.status === status);
      console.log(`\n=== ${label} (${list.length}) ===`);
      for (const i of list) {
        console.log(`  [${i.id}] (${i.category}) ${i.title}${i.demoUrl ? ' -> ' + i.demoUrl : ''}`);
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
  } else {
    throw new Error(`Comando desconhecido: ${cmd}`);
  }
}
