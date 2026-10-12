import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const script=path.resolve('scripts/setup-github-hosting.sh');
async function setup({wrongProject=false,existing=false}={}) {
  const directory=await mkdtemp(path.join(os.tmpdir(),'king-rico-identity-'));
  try {
    const log=path.join(directory,'commands.jsonl');
    const fake=`#!/usr/bin/env python3
import json,os,sys
args=sys.argv[1:]
with open(os.environ['TASK_COMMAND_LOG'],'a') as file:file.write(json.dumps(args)+'\\n')
if args[:2]==['projects','describe']:
 print('123' if os.environ['TASK_WRONG_PROJECT']=='1' else '776388739192')
elif 'describe' in args:
 raise SystemExit(0 if os.environ['TASK_EXISTING']=='1' else 1)
`;
    await writeFile(path.join(directory,'gcloud'),fake,{mode:0o755});
    await writeFile(path.join(directory,'python3'),'#!/bin/sh\nprintf "%s\\n" "Hosting check simulated; no external API calls."\n',{mode:0o755});
    // The fake gcloud must use the real Python interpreter, not the Hosting stub.
    const interpreter=spawnSync('python3',['-c','import sys;print(sys.executable)'],{encoding:'utf8'}).stdout.trim();
    await writeFile(path.join(directory,'gcloud'),fake.replace('/usr/bin/env python3',interpreter),{mode:0o755});
    const result=spawnSync('bash',[script],{encoding:'utf8',env:{...process.env,PATH:directory+path.delimiter+process.env.PATH,
      TASK_COMMAND_LOG:log,TASK_WRONG_PROJECT:wrongProject?'1':'0',TASK_EXISTING:existing?'1':'0'}});
    const commands=(await readFile(log,'utf8')).trim().split('\n').map(JSON.parse);
    return {result,commands};
  } finally {await rm(directory,{recursive:true,force:true});}
}
test('identity setup refuses a mismatched project before granting any permissions',async()=>{
  const {result,commands}=await setup({wrongProject:true});
  assert.equal(result.status,1);assert.equal(commands.length,1);assert.match(result.stderr,/Nenhuma alteração/);
});
test('identity setup limits temporary publishing access to this repository and main',async()=>{
  const {result,commands}=await setup();assert.equal(result.status,0,result.stderr);
  const provider=commands.find(args=>args.includes('create-oidc'));
  assert.ok(provider.includes("--attribute-condition=assertion.repository == 'Ric-lab/King-Rico' && assertion.ref == 'refs/heads/main'"));
  const binding=commands.find(args=>args.includes('--role=roles/iam.workloadIdentityUser'));
  assert.ok(binding.some(arg=>arg.includes('/attribute.repository/Ric-lab/King-Rico')));
  const projectRole=commands.find(args=>args.slice(0,2).join(' ')==='projects add-iam-policy-binding');
  assert.ok(projectRole.includes('--role=roles/firebasehosting.admin'));
  assert.ok(commands.every(args=>!args.includes('keys') && !args.includes('billing')));
});
test('repeating identity setup updates the existing provider instead of creating another',async()=>{
  const {result,commands}=await setup({existing:true});assert.equal(result.status,0,result.stderr);
  assert.ok(commands.some(args=>args.includes('update-oidc')));
  assert.ok(commands.every(args=>!args.includes('create') && !args.includes('create-oidc')));
});
