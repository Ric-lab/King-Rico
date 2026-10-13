import test from 'node:test';
import assert from 'node:assert/strict';
import {publishRules, httpFailure} from '../scripts/publish-firestore-rules.mjs';

const content = "rules_version = '2'; service cloud.firestore { match /databases/{db}/documents {} }";
const release = 'projects/king-rico/releases/cloud.firestore';
const oldRules = 'projects/king-rico/rulesets/old-version';
const newRules = 'projects/king-rico/rulesets/new-version';

function api(overrides = {}) {
  const calls = [];
  let active = oldRules;
  const request = async (method, resource, data) => {
    calls.push({method, resource, data});
    const custom = overrides[`${method} ${resource}`];
    if (custom) return custom(data, calls);
    if (resource.endsWith(':test')) return {};
    if (method === 'GET' && resource === release) return {rulesetName: active};
    if (method === 'GET' && resource === oldRules) return {source: {files: [{name: 'firestore.rules', content: 'old'}]}};
    if (method === 'POST' && resource.endsWith('/rulesets')) return {name: newRules};
    if (method === 'PATCH' && resource === release) {active = data.release.rulesetName; return data.release;}
    if (method === 'POST' && resource.endsWith('/releases')) {active = data.rulesetName; return data;}
    throw new Error('Unexpected API call');
  };
  return {request, calls};
}

test('rules publisher compiles and verifies the live version before succeeding', async () => {
  const {request, calls} = api();
  assert.deepEqual(await publishRules(request, content), {rulesetName: newRules, changed: true});
  assert.equal(calls[0].resource, 'projects/king-rico:test');
  assert.equal(calls.at(-1).method, 'GET');
  assert.equal(calls.at(-1).resource, release);
  const patch = calls.find(call => call.method === 'PATCH');
  assert.equal(patch.data.release.rulesetName, newRules);
  assert.equal(patch.data.updateMask, 'rulesetName');
});

test('production compilation errors prevent every release mutation', async () => {
  const {request, calls} = api({'POST projects/king-rico:test': () => ({issues: [
    {severity: 'ERROR', sourcePosition: {line: 9, column: 12}, description: 'invalid syntax'}]})});
  await assert.rejects(publishRules(request, content), /Compilation errors.*\n\[E\] 9:12/s);
  assert.equal(calls.length, 1);
});

test('a read permission denial is not mistaken for an absent release', async () => {
  const {request, calls} = api({[`GET ${release}`]: () => {throw httpFailure(403, {});}});
  await assert.rejects(publishRules(request, content), /403/);
  assert.equal(calls.filter(call => ['POST', 'PATCH'].includes(call.method) && !call.resource.endsWith(':test')).length, 0);
});

test('a denied update does not fall back to release creation', async () => {
  const {request, calls} = api({[`PATCH ${release}`]: () => {throw httpFailure(403, {});}});
  await assert.rejects(publishRules(request, content), /403/);
  assert.ok(calls.every(call => !call.resource.endsWith('/releases')));
});

test('an unchanged source is idempotent and creates no ruleset', async () => {
  const {request, calls} = api({[`GET ${oldRules}`]: () => ({source: {files: [{content, name: 'firestore.rules'}]}})});
  assert.deepEqual(await publishRules(request, content), {rulesetName: oldRules, changed: false});
  assert.ok(calls.every(call => call.method === 'GET' || call.resource.endsWith(':test')));
});

test('the first release is created only after an explicit 404', async () => {
  let reads = 0;
  const {request, calls} = api({[`GET ${release}`]: () => {
    if (!reads++) throw httpFailure(404, {});
    return {rulesetName: newRules};
  }});
  assert.equal((await publishRules(request, content)).changed, true);
  assert.ok(calls.some(call => call.method === 'POST' && call.resource.endsWith('/releases')));
  assert.ok(calls.every(call => call.method !== 'PATCH'));
});

test('a ruleset outside King Rico cannot replace its live rules', async () => {
  const {request, calls} = api({'POST projects/king-rico/rulesets': () => ({name: 'projects/other/rulesets/new-version'})});
  await assert.rejects(publishRules(request, content), /fora do projeto/);
  assert.ok(calls.every(call => call.method !== 'PATCH'));
});

test('a mismatch in the active release prevents a successful publication claim', async () => {
  const {request} = api({[`PATCH ${release}`]: () => ({})});
  await assert.rejects(publishRules(request, content), /versão ativa/);
});

test('API diagnostics omit response bodies and credential-bearing messages', () => {
  const error = httpFailure(403, {error: {status: 'PERMISSION_DENIED', message: 'Bearer sensitive-example'}});
  assert.match(error.message, /HTTP Error: 403 PERMISSION_DENIED/);
  assert.doesNotMatch(error.message, /Bearer|sensitive-example/);
});
