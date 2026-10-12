import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Timestamp} from 'firebase/firestore';
import {createGameStore,dayIndex} from '../cloud/store.mjs';

// Runs the real transaction callback, serialized like successful Firestore commits.
// These tests do not execute Security Rules; integration.mjs does that separately.
function memory() {
  const records=new Map();let time=Date.parse('2026-10-12T12:00:00Z'),tail=Promise.resolve();
  const dependencies={reference:path=>path.join('/'),now:()=>time,stamp:()=>Timestamp.fromMillis(time),rng:()=>.99,
    transact:fn=>{
      const operation=tail.then(async()=>{
        const writes=new Map();
        const result=await fn({get:async path=>({exists:()=>records.has(path),data:()=>structuredClone(records.get(path))}),
          set:(path,value)=>writes.set(path,value)});
        for (const [path,value] of writes) records.set(path,value);
        return result;
      });tail=operation.catch(()=>{});return operation;
    }};
  // structuredClone drops SDK Timestamp methods, so reconstruct snapshot timestamps.
  const transact=dependencies.transact;
  dependencies.transact=fn=>transact(tx=>fn({...tx,get:async path=>{
    const snapshot=await tx.get(path), value=snapshot.data();
    if (value && path.split('/').length===2) for (const key of ['createdAt','updatedAt','lastSpinAt','firstSpinAt'])
      if(value[key]) value[key]=new Timestamp(value[key].seconds,value[key].nanoseconds);
    return {...snapshot,data:()=>value};
  }}));
  return {records,client:uid=>createGameStore(null,uid,dependencies),advance:ms=>time+=ms};
}
const request=data=>({requestId:randomUUID(),...data});
test('Spark creates a fixed wallet, preserves consent and deduplicates concurrent spins',async()=>{
  const m=memory(),call=m.client('one');
  assert.equal((await call(request({action:'bootstrap',analyticsConsent:false}))).player.balance,1000);
  const spin=request({action:'spin',game:'wheel',bet:10,selected:0});
  const [a,b]=await Promise.all([call(spin),call(spin)]);
  assert.equal(a.player.balance,990);assert.deepEqual(a.outcome,b.outcome);assert.equal(b.replayed,true);
  assert.equal(m.records.size,2);
  await assert.rejects(call({...spin,selected:1}),{code:'king-rico/already-exists'});
  assert.equal((await call(request({action:'bootstrap',analyticsConsent:true}))).player.analyticsConsent,false);
  assert.equal((await m.client('two')(request({action:'bootstrap'}))).player.balance,1000);
});
test('lost responses recover the original outcome even after a different device spins',async()=>{
  const m=memory(),call=m.client('one');await call(request({action:'bootstrap'}));
  const original=request({action:'spin',game:'circus',bet:2.5}),first=await call(original);
  m.advance(1000);await m.client('one')(request({action:'spin',game:'wheel',bet:10,selected:3}));
  const retry=await call(original);assert.equal(retry.replayed,true);assert.deepEqual(retry.outcome,first.outcome);
  assert.equal(m.records.get('players/one').revision,2);
});
test('daily credit advances seven-day cycle once per São Paulo day',async()=>{
  const m=memory(),call=m.client('one');await call(request({action:'bootstrap'}));
  for(const amount of [50,100,150,200,250,500,1000,50]){
    const claim=request({action:'bonus'}),r=await call(claim);assert.equal(r.amount,amount);
    assert.equal((await call(claim)).replayed,true);
    assert.equal((await call(request({action:'bonus'}))).amount,0);m.advance(86400000);
  }
  m.advance(86400000);assert.equal((await call(request({action:'bonus'}))).amount,50);
  assert.equal(dayIndex(Date.parse('2026-10-12T02:59:59Z'))+1,dayIndex(Date.parse('2026-10-12T03:00:00Z')));
});
test('invalid settings, insufficient funds, fast spins and client balance fields do not write',async()=>{
  const m=memory(),call=m.client('one');await call(request({action:'bootstrap'}));
  await assert.rejects(call(request({action:'spin',game:'wheel',bet:10,selected:0,balance:999999})),{code:'king-rico/invalid-argument'});
  await assert.rejects(call(request({action:'settings',settings:{sfxLvl:3}})),{code:'king-rico/invalid-argument'});
  await assert.rejects(call(request({action:'spin',game:'wheel',bet:10,selected:12})),{code:'king-rico/invalid-argument'});
  await call(request({action:'settings',settings:{sfxLvl:0},analyticsConsent:true}));
  assert.equal(m.records.get('players/one').analyticsConsent,true);
  assert.equal(m.records.size,1,'Settings do not create operation/event documents');
  await call(request({action:'spin',game:'wheel',bet:1000,selected:0}));
  await assert.rejects(call(request({action:'spin',game:'wheel',bet:10,selected:0})),{code:'king-rico/resource-exhausted'});
  m.advance(1000);
  await assert.rejects(call(request({action:'spin',game:'wheel',bet:10,selected:0})),{code:'king-rico/failed-precondition'});
  assert.equal(m.records.get('players/one').balanceUnits,0);
});
