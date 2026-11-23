import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, rmSync, mkdirSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {classify, inspectPush} from '../scripts/preview-ci-path.mjs';

test('visual allowlist; code and workflow paths always use full lane', () => {
  assert.equal(classify(['ui/a.css','assets/a.webp','assets/a.png','assets/a.svg','a.jpg','docs/todo.json','README.md']).lane, 'fast');
  for (const file of ['ui/a.js','a.mjs','a.cjs','a.html','cloud/a.css','tests/a.png','scripts/a.md','.github/a.svg','docs/example.js','config.json','a.jpeg'])
    assert.equal(classify(['ui/a.css',file]).lane,'full',file);
  assert.equal(classify(['ui/a.css'],['older commit [full ci]','new css']).lane,'full');
  assert.equal(classify([]).lane,'full');
  assert.equal(inspectPush({},'workflow_dispatch').lane,'full');
  assert.equal(inspectPush({before:'0'.repeat(40)},'push').lane,'full');
  assert.equal(inspectPush({before:'a'.repeat(40),after:'b'.repeat(40)},'push',()=>{throw Error('missing base');}).lane,'full');
});

test('whole push catches earlier JS changes, rename source and earlier force marker', () => {
  const cwd=mkdtempSync(path.join(os.tmpdir(),'preview-ci-'));
  const git=args=>execFileSync('git',args,{cwd,encoding:'utf8'});
  const commit=(name,text,message)=>{writeFileSync(path.join(cwd,name),text);git(['add','-A']);git(['commit','-qm',message]);return git(['rev-parse','HEAD']).trim();};
  try {
    git(['init','-q']);git(['config','user.email','test@example.invalid']);git(['config','user.name','Test']);
    const before=commit('a.css','/*base*/','base');
    commit('a.js','const a=1;','logic');
    let after=commit('a.css','/*visual*/','css');
    assert.equal(inspectPush({before,after},'push',git).lane,'full');
    const cssBase=after;
    commit('a.css','/*1*/','visual [full ci]');
    after=commit('a.css','/*2*/','visual2');
    assert.equal(inspectPush({before:cssBase,after},'push',git).lane,'full');
    git(['mv','a.js','old.css']);git(['commit','-qm','rename']);
    const renamed=git(['rev-parse','HEAD']).trim();
    assert.equal(inspectPush({before:after,after:renamed},'push',git).lane,'full');
    after=commit('a.css','/*3*/','css only');
    assert.equal(inspectPush({before:renamed,after},'push',git).lane,'fast');
  } finally {rmSync(cwd,{recursive:true,force:true});}
});

test('build gate rejects JS and HTML inline syntax errors without executing them', () => {
  const cwd=mkdtempSync(path.join(os.tmpdir(),'preview-build-'));
  const file=path.join(cwd,'Fortune Circus.dc.html');
  const checker=path.resolve('scripts/check-preview-build.mjs');
  const run=()=>spawnSync(process.execPath,[checker,cwd],{encoding:'utf8'});
  try {
    writeFileSync(file,'<!doctype html><html><head></head><body><script>const x=1;</script></body></html>');
    mkdirSync(path.join(cwd,'nested'));
    writeFileSync(path.join(cwd,'nested','a.js'),'export const x=1;');
    assert.equal(run().status,0);
    writeFileSync(path.join(cwd,'nested','a.js'),'export const =;');
    assert.notEqual(run().status,0);
    writeFileSync(path.join(cwd,'nested','a.js'),'export const x=1;');
    writeFileSync(file,'<!doctype html><html><body><script>const =;</script></body></html>');
    assert.notEqual(run().status,0);
  } finally {rmSync(cwd,{recursive:true,force:true});}
});
