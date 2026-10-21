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
test('Penalty commits one debit/outcome, resumes another device and collects exactly once',async()=>{
  const m=memory(()=>0),call=m.client('penalty');await call(request({action:'bootstrap'}));
  m.records.get('players/penalty').balanceUnits=100025;
  const roundId=randomUUID(),base={action:'penalty',game:'penalty',bet:2.5,roundId};
  const shot={...base,requestId:roundId,move:'shoot',step:0,quality:1000};
  const [a,b]=await Promise.all([call(shot),call(shot)]);
  assert.equal(a.player.balance,997.75);assert.equal(b.replayed,true);
  const other=m.client('penalty');assert.equal((await other(request({action:'bootstrap'}))).player.penaltyRound.step,1);
  m.advance(350);const collect=request({...base,move:'collect',step:1,quality:0});
  const [paid,replay]=await Promise.all([call(collect),other(collect)]);
  assert.equal(paid.player.balance,1000.75);assert.equal(replay.replayed,true);
  assert.equal(paid.player.penaltyRound,null);
  assert.equal((await call(shot)).replayed,true);
  assert.equal((await call(request({action:'bootstrap'}))).player.balance,1000.75);
  await assert.rejects(call(request({...base,move:'collect',step:1,quality:0})),{code:'king-rico/round-conflict'});
});
test('Penalty preserves losses and the final prize across retries and rejects stale rounds',async()=>{
  const m=memory(()=>.99),call=m.client('penalty-loss');await call(request({action:'bootstrap'}));
  const id=randomUUID(),loss={action:'penalty',game:'penalty',bet:1000,roundId:id,requestId:id,move:'shoot',step:0,quality:1000};
  const r=await call(loss);assert.equal(r.player.balance,0);assert.equal(r.player.penaltyRound,null);
  m.setRng(()=>{throw Error('Replay must not draw');});assert.equal((await call(loss)).replayed,true);
  assert.equal((await call(request({action:'bootstrap'}))).player.balance,0);
  assert.equal((await call(request({action:'recharge'}))).player.balance,1000);
  m.advance(350);m.setRng(()=>0);const roundId=randomUUID(),base={...loss,roundId,requestId:roundId};
  await call(base);assert.equal((await call(request({action:'recharge'}))).reason,'penalty-round');
  for(let step=1;step<=4;step++) {
    m.advance(350);const shot={...base,step,requestId:randomUUID()};const result=await call(shot);
    assert.equal((await call(shot)).replayed,true);
    assert.equal(result.player.balance,step===4?10000:0);
  }
  await assert.rejects(call({...base,step:4,requestId:randomUUID()}),{code:'king-rico/round-conflict'});
  await assert.rejects(call({...base,quality:1001}),{code:'king-rico/invalid-argument'});
});
test('Fingo debits one bet, resumes the same targets and slots, and pays a completed round once',async()=>{
  const m=memory(()=>0),call=m.client('fingo');await call(request({action:'bootstrap'}));
  m.records.get('players/fingo').balanceUnits=100025;
  const roundId=randomUUID(),base={action:'fingo',game:'fingo',bet:2.5,roundId};
  for(let used=0;used<5;used++) {
    const roll=request({...base,move:'roll',used}),[r,replay]=await Promise.all([call(roll),call(roll)]);
    assert.equal(r.player.balance,997.75);assert.equal(replay.replayed,true);
    const restored=await m.client('fingo')(request({action:'bootstrap'}));
    assert.deepEqual(restored.player.fingoRound.slots,r.outcome.slots);
    assert.equal(restored.player.fingoRound.used,used);
    await assert.rejects(call(request({...base,move:'roll',used})),{code:'king-rico/round-conflict'});
    m.advance(350);
    const drop=request({...base,move:'drop',used,selected:used});
    const [paid,again]=await Promise.all([call(drop),call(drop)]);
    assert.equal(again.replayed,true);assert.deepEqual(again.outcome,paid.outcome);
    assert.equal(paid.player.balance,used===4?1060.25:997.75);
    assert.equal(paid.player.fingoRound===null,used===4);
    m.advance(350);
  }
  await assert.rejects(call(request({...base,move:'drop',used:4,selected:4})),{code:'king-rico/round-conflict'});
});
test('Fingo records a miss before animation and rejects forged steps, bets and recharge during a round',async()=>{
  const m=memory(()=>.99),call=m.client('fingo-miss');await call(request({action:'bootstrap'}));
  const base={action:'fingo',game:'fingo',bet:1000,roundId:randomUUID()};
  await call(request({...base,move:'roll',used:0}));
  const blocked=await call(request({action:'recharge'}));assert.equal(blocked.amount,0);assert.equal(blocked.reason,'fingo-round');
  for(const changes of [{used:1},{bet:10},{roundId:randomUUID()},{selected:5},{winUnits:99999}])
    await assert.rejects(call(request({...base,move:'drop',used:0,selected:4,...changes})));
  m.advance(350);
  const id=request({...base,move:'drop',used:0,selected:4}),miss=await call(id);
  assert.equal(miss.outcome.used,1);assert.equal(miss.outcome.winUnits,0);assert.equal(miss.player.balance,0);
  m.setRng(()=>{throw Error('A lost response cannot redraw the ball');});
  assert.equal((await call(id)).replayed,true);
  const restored=(await call(request({action:'bootstrap'}))).player.fingoRound;
  assert.equal(restored.used,1);assert.equal(restored.slots,null);assert.deepEqual(restored.marks,Array(5).fill(false));
});
test('an exhausted wallet recharges after the daily gift, keeps cents and only credits once',async()=>{
  const m=memory(),call=m.client('recharge');await call(request({action:'bootstrap'}));
  await call(request({action:'bonus'}));
  const original=m.records.get('players/recharge');original.balanceUnits=25;original.peaches=3;
  const bonus=structuredClone(original.bonus),settings=structuredClone(original.settings);
  const recharge=request({action:'recharge'});
  const [paid,replayed]=await Promise.all([call(recharge),call(recharge)]);
  assert.equal(paid.amount,1000);assert.equal(paid.player.balance,1000.25);assert.equal(replayed.replayed,true);
  assert.deepEqual(paid.player.bonus,bonus);assert.deepEqual(paid.player.settings,settings);assert.equal(paid.player.peaches,3);
  const before=m.records.size,revision=m.records.get('players/recharge').revision;
  assert.equal((await call(request({action:'recharge'}))).amount,0);
  assert.equal(m.records.size,before);assert.equal(m.records.get('players/recharge').revision,revision);
  assert.equal((await call(request({action:'bonus'}))).amount,0);
  m.records.get('players/recharge').balanceUnits=0;
  const [a,b]=await Promise.all([call(request({action:'recharge'})),call(request({action:'recharge'}))]);
  assert.equal(a.amount+b.amount,1000);assert.equal(m.records.get('players/recharge').balanceUnits,100000);
});
test('recharge rejects client-selected amounts and leaves an unfinished Neck round untouched',async()=>{
  const m=memory(),call=m.client('recharge-guard');await call(request({action:'bootstrap'}));
  const p=m.records.get('players/recharge-guard');p.balanceUnits=0;
  await assert.rejects(call(request({action:'recharge',amount:999999})),{code:'king-rico/invalid-argument'});
  p.neckRound={id:randomUUID(),betUnits:100000,floor:1,peachAt:0,savedUnits:0};
  const blocked=await call(request({action:'recharge'}));
  assert.equal(blocked.amount,0);assert.equal(blocked.reason,'neck-round');
  assert.equal(m.records.size,1);assert.equal(p.balanceUnits,0);
});
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
test('leaving after a first-floor miss preserves the debit and cannot redraw a lost response',async()=>{
  const m=memory(()=>.99),call=m.client('neck-miss');await call(request({action:'bootstrap'}));
  const start=request({action:'neck',game:'neck',move:'start',bet:10,roundId:randomUUID(),floor:0});
  const missed=await call(start);
  assert.equal(missed.outcome.ok,false);assert.equal(missed.outcome.ended,true);
  assert.equal(missed.player.balance,990);assert.equal(missed.player.neckRound,null);
  const reopened=m.client('neck-miss');
  assert.equal((await reopened(request({action:'bootstrap'}))).player.balance,990);
  m.setRng(()=>{throw Error('A recovered result must not draw again');});
  const replay=await reopened(start);
  assert.equal(replay.replayed,true);assert.deepEqual(replay.outcome,missed.outcome);
  assert.equal(replay.player.balance,990);assert.equal(m.records.size,2);
  await assert.rejects(reopened(request({action:'neck',game:'neck',move:'collect',bet:10,
    roundId:start.roundId,floor:1})),{code:'king-rico/round-conflict'});
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
  await assert.rejects(call(request({action:'spin',game:'wheel',bet:10,selected:13})),{code:'king-rico/invalid-argument'});
  await call(request({action:'settings',settings:{sfxLvl:0},analyticsConsent:true}));
  assert.equal(m.records.get('players/one').analyticsConsent,true);
  assert.equal(m.records.size,1,'Settings do not create operation/event documents');
  await call(request({action:'spin',game:'wheel',bet:1000,selected:0}));
  await assert.rejects(call(request({action:'spin',game:'wheel',bet:10,selected:0})),{code:'king-rico/resource-exhausted'});
  m.advance(1000);
  await assert.rejects(call(request({action:'spin',game:'wheel',bet:10,selected:0})),{code:'king-rico/failed-precondition'});
  assert.equal(m.records.get('players/one').balanceUnits,0);
});
test('Clown commits ten throws, resumes across devices and settles the prize once',async()=>{
 const m=memory(()=>0),call=m.client('clown');await call(request({action:'bootstrap'}));
 m.records.get('players/clown').balanceUnits=100025;
 const roundId=randomUUID(),base={action:'clown',game:'clown',bet:2.5,roundId,selected:0};
 let sum=0;
 for(let used=0;used<10;used++) {
  const shot={...base,used,requestId:used===0?roundId:randomUUID()};
  const [a,b]=await Promise.all([call(shot),m.client('clown')(shot)]);assert.equal(b.replayed,true);
  sum+=38;assert.equal(a.outcome.sumUnits,sum);assert.equal(a.player.balance,used===9?1001.55:997.75);
  const restored=(await m.client('clown')(request({action:'bootstrap'}))).player;
  assert.equal(restored.clownRound?.used ?? 10,used+1);
  if(used===0) {
   await assert.rejects(call(request({...base,used:0,requestId:randomUUID()})),{code:'king-rico/invalid-argument'});
   await assert.rejects(call(request({...base,used:2})),{code:'king-rico/round-conflict'});
   assert.equal((await call(request({action:'recharge'}))).reason,'clown-round');
  }
  m.advance(350);
 }
 const p=m.records.get('players/clown');assert.equal(p.clownStats.betUnits,250);assert.equal(p.clownStats.winUnits,380);
 await assert.rejects(call(request({...base,used:9})),{code:'king-rico/round-conflict'});
});
test('Bounce persists skill checkpoints and pays gold, fall guarantee and collection only once',async()=>{
 const m=memory(),call=m.client('bounce');await call(request({action:'bootstrap'}));
 const roundId=randomUUID(),base={action:'bounce',game:'bounce',bet:10,roundId,gold:false};
 const start={...base,move:'start',n:0,requestId:roundId};await call(start);assert.equal((await call(start)).replayed,true);
 for(let n=0;n<10;n++) {
  m.advance(400);const step=request({...base,move:'land',n,gold:n===2});const r=await call(step);
  assert.equal((await call(step)).replayed,true);assert.equal(r.player.bounceRound.n,n+1);
 }
 assert.equal((await call(request({action:'bootstrap'}))).player.balance,1020);
 m.advance(400);const loss=request({...base,move:'fall',n:10});const paid=await call(loss);
 assert.equal(paid.player.balance,1035);assert.equal(paid.player.bounceRound,null);assert.equal((await call(loss)).replayed,true);
 m.advance(400);const next=randomUUID();await call({...start,requestId:next,roundId:next});
 m.advance(400);await call(request({...base,roundId:next,move:'land',n:0}));
 m.advance(400);const collect=request({...base,roundId:next,move:'collect',n:1});assert.equal((await call(collect)).player.balance,1035.5);
 assert.equal((await call(collect)).replayed,true);
});

test('Flying commits a single debit, resumes popped balloons, pays collection once and forbids stale throws',async()=>{
 const m=memory(()=>0),call=m.client('flying');await call(request({action:'bootstrap'}));
 m.records.get('players/flying').balanceUnits=100025;
 const roundId=randomUUID(),base={action:'flying',game:'flying',bet:2.5,roundId};
 const first={...base,requestId:roundId,move:'pop',step:0,selected:4};
 const [a,b]=await Promise.all([call(first),call(first)]);assert.equal(a.player.balance,997.75);assert.equal(b.replayed,true);
 assert.deepEqual((await m.client('flying')(request({action:'bootstrap'}))).player.flyingRound.popped,[4]);
 m.advance(350);const take=request({...base,move:'collect',step:1,selected:-1});
 const paid=await call(take);assert.equal(paid.player.balance,1000.75);assert.equal((await call(take)).replayed,true);
 await assert.rejects(call(request({...base,move:'collect',step:1,selected:-1})),{code:'king-rico/round-conflict'});
 m.advance(350);m.setRng(()=>.99);const id=randomUUID();const lost=await call({...first,roundId:id,requestId:id});
 assert.equal(lost.player.balance,998.25);assert.equal(lost.player.flyingRound,null);
});
test('21 persists the same deck/turn across devices and cannot duplicate a payout, debit or recharge',async()=>{
 const {rngFor}=await import('./helpers/twenty-one.cjs');
 const m=memory(rngFor([9,5,7,6,22])),call=m.client('twentyOne');await call(request({action:'bootstrap'}));
 const roundId=randomUUID(),base={action:'twentyOne',game:'twentyOne',bet:1000,roundId};
 const start={...base,move:'start',turn:0,requestId:roundId};const [a,b]=await Promise.all([call(start),call(start)]);
 assert.equal(a.player.balance,0);assert.equal(b.replayed,true);assert.equal((await call(request({action:'recharge'}))).reason,'twenty-one-round');
 assert.deepEqual((await m.client('twentyOne')(request({action:'bootstrap'}))).player.twentyOneRound,a.outcome.round);
 m.advance(350);let x=await call(request({...base,move:'stand',turn:1}));assert.equal(x.outcome.round.phase,'dealer');
 m.advance(350);const finish=request({...base,move:'dealer',turn:2});x=await call(finish);
 assert.equal(x.player.balance,2000);assert.equal(x.outcome.round.result.reason,'dealer-bust');assert.equal((await call(finish)).replayed,true);
 m.advance(350);await assert.rejects(call(request({...base,move:'dealer',turn:2})),{code:'king-rico/round-conflict'});
 assert.equal((await call(request({action:'bootstrap'}))).player.balance,2000);
});

test('33 saves its rules across devices, deduplicates settlement and leaves legacy hands unchanged',async()=>{
 const {rngFor}=await import('./helpers/twenty-one.cjs');
 const m=memory(rngFor([12,25,11,10,7,3])),call=m.client('33');await call(request({action:'bootstrap'}));
 const roundId=randomUUID(),base={action:'twentyOne',game:'twentyOne',bet:1000,roundId,target:33};
 const start={...base,requestId:roundId,move:'start',turn:0};const a=await call(start);assert.equal(a.player.balance,0);assert.equal((await call(start)).replayed,true);
 const other=m.client('33');assert.equal((await other(request({action:'bootstrap'}))).player.twentyOneRound.target,33);
 assert.equal((await other(request({action:'recharge'}))).reason,'twenty-one-round');
 m.advance(350);await other(request({...base,move:'hit',turn:1}));m.advance(350);
 const final=request({...base,move:'dealer',turn:2});const x=await call(final);assert.equal(x.player.balance,2000);assert.equal(x.outcome.round.playerHard,33);
 assert.equal((await other(final)).replayed,true);assert.equal((await call(request({action:'bootstrap'}))).player.balance,2000);
 await assert.rejects(call(request({...base,move:'hit',turn:1})),{code:'king-rico/round-conflict'});
});

test('Claw atomically settles one grab, shares its wallet and deduplicates a replay across devices',async()=>{
 const m=memory(),call=m.client('claw');await call(request({action:'bootstrap'}));
 const roundId=randomUUID(),grab={action:'claw',game:'claw',bet:2.5,selected:4,aimX:500,aimZ:500,seed:0,roundId,requestId:roundId};
 const [a,b]=await Promise.all([call(grab),call(grab)]);assert.equal(a.player.balance,1005);assert.equal(b.replayed,true);assert.equal(a.outcome.winUnits,750);
 const other=m.client('claw');assert.equal((await other(request({action:'bootstrap'}))).player.balance,1005);
 await assert.rejects(other({...grab,aimX:0}),{code:'king-rico/already-exists'});
 m.advance(750);const id=randomUUID();const loss=await other({...grab,roundId:id,requestId:id,aimX:0,aimZ:0});assert.equal(loss.player.balance,1002.5);assert.equal(loss.outcome.winUnits,0);
 await assert.rejects(call({...grab,roundId:randomUUID(),requestId:randomUUID()}),{code:'king-rico/invalid-argument'});
});
