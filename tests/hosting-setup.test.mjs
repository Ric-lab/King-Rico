import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
const script=path.resolve('scripts/setup-github-hosting.sh');
async function setup({wrongProject=false,existing=false,propagationFailures=0,permissionDenied=false}={}) {
  const directory=await mkdtemp(path.join(os.tmpdir(),'king-rico-identity-'));
  try {
    const log=path.join(directory,'commands.jsonl');
    const fake=`#!/usr/bin/env python3
import json,os,sys
args=sys.argv[1:]
try:
 with open(os.environ['TASK_COMMAND_LOG']) as file:previous=[json.loads(line) for line in file]
except FileNotFoundError:previous=[]
with open(os.environ['TASK_COMMAND_LOG'],'a') as file:file.write(json.dumps(args)+'\\n')
if args[:2]==['projects','describe']:
 print('123' if os.environ['TASK_WRONG_PROJECT']=='1' else '776388739192')
elif 'describe' in args:
 raise SystemExit(0 if os.environ['TASK_EXISTING']=='1' else 1)
elif args[:2]==['projects','add-iam-policy-binding']:
 attempts=sum(command[:2]==args[:2] for command in previous)
 if os.environ['TASK_PERMISSION_DENIED']=='1':
  print('ERROR: PERMISSION_DENIED: Missing permission to modify the policy.',file=sys.stderr)
  raise SystemExit(3)
 if attempts < int(os.environ['TASK_PROPAGATION_FAILURES']):
  print('ERROR: Policy modification failed. For a binding with condition, run lint-condition.',file=sys.stderr)
  print('ERROR: INVALID_ARGUMENT: Service account king-rico-hosting@king-rico.iam.gserviceaccount.com does not exist.',file=sys.stderr)
  raise SystemExit(1)
`;
    await writeFile(path.join(directory,'gcloud'),fake,{mode:0o755});
    await writeFile(path.join(directory,'python3'),'#!/bin/sh\nprintf "%s\\n" "Hosting check simulated; no external API calls."\n',{mode:0o755});
    // The fake gcloud must use the real Python interpreter, not the Hosting stub.
    const interpreter=spawnSync('python3',['-c','import sys;print(sys.executable)'],{encoding:'utf8'}).stdout.trim();
    await writeFile(path.join(directory,'gcloud'),fake.replace('/usr/bin/env python3',interpreter),{mode:0o755});
    await writeFile(path.join(directory,'sleep'),`#!${interpreter}
import json,os,sys
with open(os.environ['TASK_COMMAND_LOG'],'a') as file:file.write(json.dumps(['sleep']+sys.argv[1:])+'\\n')
`,{mode:0o755});
    const result=spawnSync('bash',[script],{encoding:'utf8',env:{...process.env,PATH:directory+path.delimiter+process.env.PATH,
      TASK_COMMAND_LOG:log,TASK_WRONG_PROJECT:wrongProject?'1':'0',TASK_EXISTING:existing?'1':'0',
      TASK_PROPAGATION_FAILURES:String(propagationFailures),TASK_PERMISSION_DENIED:permissionDenied?'1':'0'}});
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
  assert.deepEqual(commands.filter(args=>args[0]==='projects' && args[1]==='add-iam-policy-binding')
    .map(args=>args.find(arg=>arg.startsWith('--role='))).sort(),['--role=roles/firebasehosting.admin','--role=roles/firebaserules.admin']);
  assert.ok(commands.every(args=>!args.includes('keys') && !args.includes('billing')));
});
test('repeating identity setup updates the existing provider instead of creating another',async()=>{
  const {result,commands}=await setup({existing:true});assert.equal(result.status,0,result.stderr);
  assert.ok(commands.some(args=>args.includes('update-oidc')));
  assert.ok(commands.every(args=>!args.includes('create') && !args.includes('create-oidc')));
});
test('identity setup waits for a newly created account to propagate and then continues',async()=>{
  const {result,commands}=await setup({propagationFailures:3});assert.equal(result.status,0,result.stderr);
  assert.equal(commands.filter(args=>args.includes('--role=roles/firebasehosting.admin')).length,4);
  assert.deepEqual(commands.filter(args=>args[0]==='sleep').map(args=>args[1]),['2','4','8']);
  assert.match(result.stdout,/ainda está propagando/);
  assert.match(result.stdout,/Conexão GitHub → Firebase configurada/);
  assert.ok(commands.some(args=>args.includes('create-oidc')));
});
test('identity setup stops after a bounded wait if the account remains unavailable',async()=>{
  const {result,commands}=await setup({propagationFailures:99});assert.equal(result.status,1);
  assert.equal(commands.filter(args=>args[0]==='projects' && args[1]==='add-iam-policy-binding').length,7);
  assert.deepEqual(commands.filter(args=>args[0]==='sleep').map(args=>args[1]),['2','4','8','16','30','30']);
  assert.match(result.stderr,/Service account .* does not exist/);
  assert.ok(commands.every(args=>!args.includes('workload-identity-pools')));
  assert.doesNotMatch(result.stdout,/Hosting check simulated|Conexão GitHub → Firebase configurada/);
});
test('identity setup preserves permission errors without retrying or continuing',async()=>{
  const {result,commands}=await setup({permissionDenied:true});assert.equal(result.status,3);
  assert.equal(commands.filter(args=>args[0]==='projects' && args[1]==='add-iam-policy-binding').length,1);
  assert.match(result.stderr,/PERMISSION_DENIED/);
  assert.ok(commands.every(args=>args[0]!=='sleep' && !args.includes('workload-identity-pools')));
  assert.doesNotMatch(result.stdout,/Hosting check simulated|Conexão GitHub → Firebase configurada/);
});
