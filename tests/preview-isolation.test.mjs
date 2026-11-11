import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const script=path.resolve('scripts/preview-config.mjs'),result=path.resolve('scripts/preview-result.mjs');
const project='king-rico-previa-test',provider='projects/123456/locations/global/workloadIdentityPools/king-rico-preview-github/providers/github';
test('preview config rejects production and contains only isolated Hosting',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'preview-isolation-'));
 try{
  await writeFile(path.join(dir,'firebase.json'),JSON.stringify({hosting:{site:'king-rico',public:'dist',rewrites:[{source:'/circus',destination:'/Fortune Circus.dc.html'}]},firestore:{rules:'firestore.rules'}}));
  const run=p=>spawnSync(process.execPath,[script],{cwd:dir,env:{...process.env,KING_RICO_PREVIEW_PROJECT_ID:p,KING_RICO_PREVIEW_PROVIDER:provider}});
  assert.notEqual(run('king-rico').status,0);assert.notEqual(run('').status,0);
  assert.equal(run(project).status,0);
  const config=JSON.parse(await readFile(path.join(dir,'firebase.preview.generated.json'),'utf8'));
  assert.deepEqual(Object.keys(config),['hosting']);assert.equal(config.hosting.site,project);assert.equal(config.hosting.public,'dist');assert.equal(config.hosting.rewrites[0].source,'/circus');
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('publication result accepts only this isolated project preview URL',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'preview-url-'));
 try{
  const file=path.join(dir,'result.json');
  const run=async url=>{await writeFile(file,JSON.stringify({result:{hosting:{url}}}));return spawnSync(process.execPath,[result,file],{env:{...process.env,KING_RICO_PREVIEW_PROJECT_ID:project,GITHUB_OUTPUT:'',GITHUB_STEP_SUMMARY:''},encoding:'utf8'});};
  assert.notEqual((await run('https://king-rico.web.app')).status,0);
  assert.notEqual((await run('https://king-rico--previa-abc.web.app')).status,0);
  assert.notEqual((await run('https://king-rico-previa-other--previa-abc.web.app')).status,0);
  assert.equal((await run('https://'+project+'--previa-abc.web.app')).status,0);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('full browser suite runs locally before deploy, keeping Firebase transfer for human previews',async()=>{
 const workflow=await readFile('.github/workflows/preview-channel.yml','utf8');
 const browser=workflow.indexOf('python3 scripts/test-preview-browsers.py');
 const deploy=workflow.indexOf('firebase hosting:channel:deploy');
 assert.ok(browser>=0&&browser<deploy,'Full browser validation must gate publication locally');
 assert.ok(!workflow.includes('KING_RICO_TEST_URL:'),'Do not point all browser contexts at Firebase');
 assert.ok(workflow.includes("method: 'HEAD'"),'Remote route checks must not download the assets again');
});
