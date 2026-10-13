import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Timestamp} from 'firebase/firestore';
import {createGameStore,dayIndex} from '../cloud/store.mjs';

// Runs the real transaction callback, serialized like successful Firestore commits.
// These tests do not execute Security Rules; integration.mjs does that separately.
function memory(rng=()=>.99) {
  const records=new Map();let time=Date.parse('2026-10-12T12:00:00Z'),tail=Promise.resolve();
  const dependencies={reference:path=>path.join('/'),now:()=>time,stamp:()=>Timestamp.fromMillis(time),rng:()=>rng(),
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
  return {records,client:uid=>createGameStore(null,uid,dependencies),advance:ms=>time+=ms,setRng:next=>rng=next};
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
test('Neck persists a round between devices, debits once and deduplicates collecting',async()=>{
  const m=memory(()=>0),call=m.client('neck');await call(request({action:'bootstrap'}));
  m.records.get('players/neck').balanceUnits=100025;
  const roundId=randomUUID(),start=request({action:'neck',game:'neck',move:'start',bet:2.5,roundId,floor:0});
  const [a,b]=await Promise.all([call(start),call(start)]);
  assert.equal(a.player.balance,997.75);assert.equal(b.replayed,true);assert.equal(a.player.neckRound.floor,1);
  assert.equal((await m.client('neck')(request({action:'bootstrap'}))).player.neckRound.id,roundId);
  m.advance(400);const climb=await call(request({action:'neck',game:'neck',move:'climb',bet:2.5,roundId,floor:1}));
  assert.equal(climb.player.balance,997.75);assert.equal(climb.player.neckRound.floor,2);
  m.advance(400);const collect=request({action:'neck',game:'neck',move:'collect',bet:2.5,roundId,floor:2});
  const [paid,replayed]=await Promise.all([call(collect),call(collect)]);
  assert.equal(paid.player.balance,1000.75);assert.equal(paid.player.neckRound,null);assert.equal(replayed.replayed,true);
  m.advance(400);
  await assert.rejects(call(request({action:'neck',game:'neck',move:'collect',bet:2.5,roundId,floor:2})),{code:'king-rico/round-conflict'});
  await assert.rejects(call(request({action:'neck',game:'neck',move:'climb',bet:2.5,roundId,floor:1})),{code:'king-rico/round-conflict'});
  assert.equal(m.records.get('players/neck').balanceUnits,100075);
});
test('Neck pays the guaranteed Happeach once after a miss and settles the final floor automatically',async()=>{
  const m=memory(()=>0),call=m.client('neck');await call(request({action:'bootstrap'}));
  let roundId=randomUUID(),response;
  for(let floor=1;floor<=6;floor++) {
    response=await call(request({action:'neck',game:'neck',move:floor===1?'start':'climb',bet:10,roundId,floor:floor-1}));
    assert.equal(response.player.neckRound.floor,floor);m.advance(400);
  }
  assert.equal(response.player.neckRound.savedUnits,1550);
  m.setRng(()=>.99);const missed=await call(request({action:'neck',game:'neck',move:'climb',bet:10,roundId,floor:6}));
  assert.equal(missed.player.balance,1005.5);assert.equal(missed.player.neckRound,null);assert.equal(missed.outcome.ok,false);
  m.advance(400);m.setRng(()=>0);roundId=randomUUID();
  for(let floor=1;floor<=33;floor++) {
    response=await call(request({action:'neck',game:'neck',move:floor===1?'start':'climb',bet:10,roundId,floor:floor-1}));m.advance(400);
  }
  assert.equal(response.outcome.winUnits,50000);assert.equal(response.player.neckRound,null);assert.equal(response.player.balance,1495.5);
});
test('Neck rejects a conflicting round or changed bet and accepts legacy profiles',async()=>{
  const m=memory(()=>0),call=m.client('legacy');await call(request({action:'bootstrap'}));
  const p=m.records.get('players/legacy');delete p.settings.neckBetIdx;delete p.neckRound;
  const roundId=randomUUID();await call(request({action:'neck',game:'neck',move:'start',bet:10,roundId,floor:0}));m.advance(400);
  for(const data of [{move:'start',bet:10,roundId:randomUUID(),floor:0},{move:'climb',bet:25,roundId,floor:1},{move:'climb',bet:10,roundId:randomUUID(),floor:1},{move:'climb',bet:10,roundId,floor:0}])
    await assert.rejects(call(request({action:'neck',game:'neck',...data})),{code:'king-rico/round-conflict'});
  assert.equal(m.records.get('players/legacy').balanceUnits,99000);
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
