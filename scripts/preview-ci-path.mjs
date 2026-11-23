// Conservative preview-only gate. Compare the entire push, never just HEAD~1.
import {execFileSync} from 'node:child_process';
import {readFileSync, appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function classify(files, messages = [], fallback = '') {
  if (fallback) return {lane: 'full', reason: fallback};
  if (messages.some(message => /\[full ci\]/i.test(message)))
    return {lane: 'full', reason: 'Mensagem do push contém [full ci].'};
  if (!files.length) return {lane: 'full', reason: 'Sem alterações classificáveis.'};
  const code = file => /^(cloud|tests|scripts|\.github)\//.test(file) || /\.(?:js|mjs|cjs|html)$/i.test(file);
  const visual = file => !code(file) && (file.startsWith('docs/') || /\.(?:css|webp|png|svg|jpg|md)$/i.test(file));
  const other = files.filter(file => !visual(file));
  return other.length
    ? {lane: 'full', reason: `Fora da lista visual: ${other.join(', ')}`}
    : {lane: 'fast', reason: 'Todos os arquivos são CSS, imagens ou documentação permitida.'};
}

export function inspectPush(event, eventName, git = args => execFileSync('git', args, {encoding: 'utf8'})) {
  let files = [], messages = [], fallback = '';
  if (eventName !== 'push' || !/^[0-9a-f]{40}$/i.test(event.before || '') || /^0+$/.test(event.before)) {
    fallback = 'Execução manual, branch nova ou base do push indisponível.';
  } else {
    try {
      // --no-renames includes both paths, so moving code to a CSS filename cannot bypass CI.
      files = git(['diff', '--no-renames', '--name-only', '-z', event.before, event.after]).split('\0').filter(Boolean);
      messages = git(['log', '--format=%B%x00', `${event.before}..${event.after}`]).split('\0');
      if (!messages.some(message => message.trim())) fallback = 'Não foi possível identificar os commits do push.';
    } catch {
      fallback = 'Falha ao comparar a base completa do push; testes completos por segurança.';
    }
  }
  return {...classify(files, messages, fallback), files};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const result = inspectPush(event, process.env.GITHUB_EVENT_NAME);
  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `lane=${result.lane}\n`);
  const safe = text => text.replace(/[&<>]/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;'}[ch]));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `### Caminho da prévia: ${result.lane === 'fast' ? 'rápido' : 'completo'}\n\n${safe(result.reason)}\n\nArquivos do push (${result.files.length}):\n<pre>${safe(result.files.join('\n') || '(comparação indisponível)')}</pre>\n`);
}
