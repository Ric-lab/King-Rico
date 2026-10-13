// Publish through the official Rules REST API using the workflow's temporary
// Google credentials. This needs Rules Admin, without Service Usage inspection.
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const PROJECT = 'king-rico';
const API = 'https://firebaserules.googleapis.com/v1';
const RELEASE = `projects/${PROJECT}/releases/cloud.firestore`;
const RULESET_NAME = /^projects\/(?:king-rico|776388739192)\/rulesets\/[A-Za-z0-9-]+$/;

export class RulesPublishError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export function httpFailure(status, body) {
  // Do not print HTTP bodies, authorization headers or credential errors.
  const code = body?.error?.status;
  const safeCode = ['PERMISSION_DENIED', 'UNAUTHENTICATED', 'INVALID_ARGUMENT',
    'NOT_FOUND', 'RESOURCE_EXHAUSTED', 'UNAVAILABLE'].includes(code) ? ` ${code}` : '';
  return new RulesPublishError(`Request to ${API} had HTTP Error: ${status}${safeCode}`, status);
}

export async function publishRules(request, content) {
  if (!content.includes('rules_version') || !content.includes('service cloud.firestore') ||
      Buffer.byteLength(content) > 256 * 1024) {
    throw new RulesPublishError('Arquivo firestore.rules inválido. Publicação interrompida.');
  }
  const source = {files: [{name: 'firestore.rules', content}]};
  const compiled = await request('POST', `projects/${PROJECT}:test`, {source});
  const errors = (compiled.issues || []).filter(issue => issue.severity === 'ERROR');
  if (errors.length) {
    const positions = errors.map(issue => {
      const {line = 0, column = 0} = issue.sourcePosition || {};
      return `[E] ${Number(line) || 0}:${Number(column) || 0} - erro de compilação`;
    });
    throw new RulesPublishError('Compilation errors in firestore.rules:\n' + positions.join('\n'));
  }

  let current;
  try { current = await request('GET', RELEASE); }
  catch (error) { if (error.status !== 404) throw error; }
  if (current) {
    if (!RULESET_NAME.test(current.rulesetName)) {
      throw new RulesPublishError('Referência de regras fora do projeto esperado.');
    }
    const previous = await request('GET', current.rulesetName);
    const files = previous.source?.files;
    if (files?.length === 1 && files[0].name === 'firestore.rules' && files[0].content === content) {
      return {rulesetName: current.rulesetName, changed: false};
    }
  }

  const created = await request('POST', `projects/${PROJECT}/rulesets`, {source});
  if (!RULESET_NAME.test(created.name)) {
    throw new RulesPublishError('A API retornou regras fora do projeto esperado.');
  }
  const release = {name: RELEASE, rulesetName: created.name};
  if (current) {
    // A rejected update must fail, never fall back to creating another release.
    await request('PATCH', RELEASE, {release, updateMask: 'rulesetName'});
  } else {
    await request('POST', `projects/${PROJECT}/releases`, release);
  }
  const verified = await request('GET', RELEASE);
  if (verified.rulesetName !== created.name) {
    throw new RulesPublishError('A versão ativa das regras não corresponde à versão publicada.');
  }
  return {rulesetName: created.name, changed: true};
}

async function main() {
  const require = createRequire(import.meta.url);
  // firebase-tools is pinned in package-lock.json and supplies this dependency.
  const firebaseRequire = createRequire(require.resolve('firebase-tools/package.json'));
  const {GoogleAuth} = firebaseRequire('google-auth-library');
  const auth = new GoogleAuth({scopes: ['https://www.googleapis.com/auth/cloud-platform']});
  let token;
  try { token = await auth.getAccessToken(); }
  catch { throw new RulesPublishError('Failed to authenticate the publishing account.'); }
  if (!token) throw new RulesPublishError('Failed to authenticate the publishing account.');

  const request = async (method, resource, data) => {
    let response;
    try {
      response = await fetch(`${API}/${resource}`, {
        method, headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: data === undefined ? undefined : JSON.stringify(data),
        signal: AbortSignal.timeout(30000), redirect: 'error'
      });
    } catch { throw new RulesPublishError('Não foi possível alcançar a API oficial de regras.'); }
    let body;
    try { body = await response.json(); }
    catch { throw new RulesPublishError('Resposta inválida da API oficial de regras.'); }
    if (!response.ok) throw httpFailure(response.status, body);
    return body;
  };
  const content = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  const result = await publishRules(request, content);
  console.log(`Regras Firestore verificadas: ${result.rulesetName} (${result.changed ? 'atualizadas' : 'já atuais'}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof RulesPublishError ? error.message : 'Falha ao publicar as regras.');
    process.exitCode = 1;
  });
}
