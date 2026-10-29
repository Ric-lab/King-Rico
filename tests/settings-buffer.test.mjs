import test from 'node:test';
import assert from 'node:assert/strict';
import {createSettingsBuffer} from '../cloud/settings-buffer.mjs';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};

test('minus then plus keeps the last intent, even when it equals the saved value',async()=>{
  const saved={neckBetIdx:3,sfxLvl:2},writes=[];
  const buffer=createSettingsBuffer({owner:()=> 'a',confirmed:()=>saved,send:async v=>writes.push(v),changed:()=>{},error:assert.fail,delay:60000});
  buffer.set({neckBetIdx:2});assert.equal(buffer.overlay(saved).neckBetIdx,2);
  buffer.set({neckBetIdx:3});await buffer.flush();
  assert.equal(buffer.overlay(saved).neckBetIdx,3);assert.deepEqual(writes,[]);buffer.reset();
});

test('a confirmed older write cannot overwrite a newer bet or sound intent',async()=>{
  let saved={wheelBetIdx:3,sfxLvl:2};const first=deferred(),writes=[];
  const buffer=createSettingsBuffer({owner:()=> 'a',confirmed:()=>saved,changed:()=>{},error:assert.fail,delay:60000,
    send:async v=>{writes.push({...v});if(writes.length===1)await first.promise;saved={...saved,...v};}});
  buffer.set({wheelBetIdx:2,sfxLvl:0});const sending=buffer.flush();
  buffer.set({wheelBetIdx:3,sfxLvl:2});
  assert.deepEqual(buffer.overlay(saved),{wheelBetIdx:3,sfxLvl:2});
  first.resolve();await sending;
  assert.equal(saved.wheelBetIdx,2);assert.deepEqual(buffer.overlay(saved),{wheelBetIdx:3,sfxLvl:2});
  await buffer.flush();assert.deepEqual(saved,{wheelBetIdx:3,sfxLvl:2});
  assert.equal(writes.length,2);buffer.reset();
});

test('changing accounts discards pending preferences and ignores an older completion',async()=>{
  let uid='a';const wait=deferred(),writes=[];
  const buffer=createSettingsBuffer({owner:()=>uid,confirmed:()=>({fingoBetIdx:3}),changed:()=>{},error:assert.fail,delay:60000,
    send:async(v,owner)=>{writes.push(owner);await wait.promise;}});
  buffer.set({fingoBetIdx:1});const old=buffer.flush();uid='b';
  assert.deepEqual(buffer.overlay({fingoBetIdx:3}),{fingoBetIdx:3});
  buffer.set({fingoBetIdx:5});wait.resolve();await old;
  assert.equal(buffer.overlay({fingoBetIdx:3}).fingoBetIdx,5);
  await buffer.flush();assert.deepEqual(writes,['a','b']);buffer.reset();
});
