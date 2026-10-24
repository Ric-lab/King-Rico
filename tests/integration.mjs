import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {initializeApp,deleteApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,GoogleAuthProvider,signInWithCredential,signOut} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator,doc,getDoc,setDoc,updateDoc,deleteDoc,writeBatch,serverTimestamp} from 'firebase/firestore';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {createGameStore,publicPlayer} from '../cloud/store.mjs';
import engine from '../cloud/engine.cjs';
const apps=[];let environment;
before(async()=>{
  environment=await initializeTestEnvironment({projectId:'demo-king-rico',firestore:{host:'127.0.0.1',port:8085,rules:await readFile('firestore.rules','utf8')}});
});
after(async()=>{await Promise.all(apps.map(deleteApp));await environment?.cleanup();});
const request=data=>({requestId:randomUUID(),...data});
test('Circus v5 banks contributing stakes, rejects inflation, and replays a bonus across devices once',async()=>{
  const name='circus-bank-'+randomUUID();let draws=[];
  const c=await client(name,name,{rng:()=>draws.length?draws.shift():.99});
  await c.call(request({action:'bootstrap'}));const ref=doc(c.db,'players',c.uid);
  await environment.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'players',c.uid),{
    peaches:4,peachBank:{count:4,units:400}}));
  const old=(await getDoc(ref)).data();
  const queue=()=>[0,0,...Array.from({length:7},()=>[.99,.2]).flat()];
  async function forge(change){
    let samples=queue();const outcome=engine.slot(1000,old.peaches,()=>samples.length?samples.shift():.99,old.peachBank);
    const id=randomUUID(),next={...old,balanceUnits:old.balanceUnits-100000+outcome.winUnits,
      peaches:outcome.peaches,peachBank:outcome.peachBank,settings:{...old.settings,slotBetIdx:9},
      revision:old.revision+1,lastOperationId:id,updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp(),firstSpinAt:serverTimestamp()};
    change(next,outcome);
    const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',id),{
      action:'spin',game:'circus',selected:-1,fingerprint:'forged-bank',betUnits:100000,winUnits:outcome.winUnits,
      rulesVersion:engine.RULES_VERSION,createdAt:serverTimestamp(),result:{game:'circus',bet:1000,
        balanceBefore:1000,balanceDebited:0,baseBalance:next.balanceUnits/100,outcome}});
    await assertFails(batch.commit());
  }
  await forge((p,x)=>{p.peachBank={count:1,units:200000};x.peachBank=p.peachBank;});
  await forge((p,x)=>{x.feature.bet=1000;});
  await forge((p,x)=>{x.res.peach=[0];});
  draws=queue();const spin=request({action:'spin',game:'circus',bet:1000});
  const [a,b]=await Promise.all([c.call(spin),c.call(spin)]);
  assert.ok(a.replayed||b.replayed);assert.equal(a.outcome.feature.bet,200.8);
  assert.equal(a.outcome.feature.res.win,2008);assert.deepEqual(a.player.peachBank,{count:1,units:100000});
  const other=await client(name+'-other',name,{rng:()=>{throw Error('Replay cannot redraw or bank twice');}});
  assert.deepEqual((await other.call(request({action:'bootstrap'}))).player.peachBank,a.player.peachBank);
  assert.equal((await other.call(spin)).player.balance,a.player.balance);
  assert.equal((await getDoc(ref)).data().peachBank.units,100000);
});
test('Wheel v5 rejects a color x5 payout while a saved v4 client still uses its x5 table',async()=>{
  for(const [version,pay,allowed]of[[engine.RULES_VERSION,5,false],[engine.RULES_VERSION,2,true],['2026-10-20-spark-v4',5,true]]){
    const name='wheel-version-'+randomUUID(),c=await client(name);await c.call(request({action:'bootstrap'}));
    const ref=doc(c.db,'players',c.uid),old=(await getDoc(ref)).data(),id=randomUUID();
    const outcome={target:3,winUnits:1000*pay};
    const next={...old,balanceUnits:old.balanceUnits-1000+outcome.winUnits,revision:1,lastOperationId:id,
      updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp(),firstSpinAt:serverTimestamp()};
    const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',id),{
      action:'spin',game:'wheel',selected:1,fingerprint:'version-table',betUnits:1000,winUnits:outcome.winUnits,
      rulesVersion:version,createdAt:serverTimestamp(),result:{game:'wheel',bet:10,balanceBefore:1000,
        balanceDebited:990,baseBalance:next.balanceUnits/100,outcome}});
    await (allowed?assertSucceeds(batch.commit()):assertFails(batch.commit()));
  }
});
test('A saved legacy 33 hand settles at its original 2x after the v5 update',async()=>{
  const {rngFor}=await import('./helpers/twenty-one.cjs');const name='33-old-hand-'+randomUUID(),c=await client(name);
  await c.call(request({action:'bootstrap'}));const roundId=randomUUID();
  const opening=engine.twentyOne(10,null,'start',roundId,rngFor([12,25,11,10,7,3],{guided33:true}),33).round;
  delete opening.winFactor;delete opening.dealVersion;
  await environment.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'players',c.uid),{
    balanceUnits:99000,twentyOneRound:opening}));
  const base={action:'twentyOne',game:'twentyOne',bet:10,roundId,target:33};
  await c.call(request({...base,move:'hit',turn:1}));await new Promise(r=>setTimeout(r,350));
  const paid=await c.call(request({...base,move:'dealer',turn:2}));
  assert.equal(paid.outcome.winUnits,2000);assert.equal(paid.player.balance,1010);
});
test('Penalty Rules persist shots, prevent duplicate debits/collection and share a legacy wallet',async()=>{
  const identity='penalty-'+randomUUID(),c=await client(identity,identity,{rng:()=>0});
  await c.call(request({action:'bootstrap'}));await c.call(request({action:'bonus'}));
  const ref=doc(c.db,'players',c.uid);
  await environment.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'players',c.uid),{balanceUnits:100025,peaches:2}));
  const roundId=randomUUID(),base={action:'penalty',game:'penalty',bet:2.5,roundId};
  const shot={...base,requestId:roundId,move:'shoot',step:0,quality:1000};
  const [a,b]=await Promise.all([c.call(shot),c.call(shot)]);
  assert.ok(a.replayed || b.replayed);assert.equal(a.player.balance,997.75);assert.equal(a.player.penaltyRound.step,1);
  const other=await client(identity+'-device',identity,{rng:()=>{throw Error('Collection/replay cannot draw');}});
  assert.deepEqual((await other.call(request({action:'bootstrap'}))).player.penaltyRound,a.player.penaltyRound);
  await new Promise(resolve=>setTimeout(resolve,350));
  const collect=request({...base,move:'collect',step:1,quality:0});
  const [paid,replay]=await Promise.all([other.call(collect),c.call(collect)]);
  assert.ok(paid.replayed || replay.replayed);assert.equal(paid.player.balance,1001.5);assert.equal(paid.player.penaltyRound,null);
  assert.equal((await c.call(shot)).replayed,true);
  assert.equal((await getDoc(ref)).data().balanceUnits,100150);
  await assert.rejects(c.call(request({...base,move:'collect',step:1,quality:0})),{code:'king-rico/round-conflict'});
  await assertFails(updateDoc(doc(c.db,'players',c.uid,'operations',collect.requestId),{winUnits:99999}));
  assert.equal((await other.call(request({action:'bootstrap'}))).player.peaches,2);
});
test('Penalty Rules validate losses, all ten steps, automatic prize and round preservation',async()=>{
  const identity='penalty-final-'+randomUUID(),c=await client(identity,identity,{rng:()=>0});
  await c.call(request({action:'bootstrap'}));
  const ref=doc(c.db,'players',c.uid),roundId=randomUUID();
  const base={action:'penalty',game:'penalty',bet:1000,roundId,move:'shoot',quality:1000};
  for(let step=0;step<10;step++) {
    const shot={...base,step,requestId:step===0?roundId:randomUUID()},result=await c.call(shot);
    assert.equal(result.player.balance,step===9?100000:0);assert.equal((await c.call(shot)).replayed,true);
    if(step===0) assert.ok((await c.call(request({action:'bootstrap'}))).player.penaltyRound);
    await new Promise(resolve=>setTimeout(resolve,350));
  }
  const id=randomUUID(),miss={...base,requestId:id,roundId:id,step:0,quality:0};
  const loss=await c.call(miss);assert.equal(loss.player.balance,99000);assert.equal(loss.player.penaltyRound,null);
  assert.equal((await c.call(miss)).replayed,true);
  assert.equal((await getDoc(ref)).data().balanceUnits,9900000);
});
test('Penalty Rules finish a legacy five-goal round at its original prize, then start the new table',async()=>{
 const c=await client('penalty-legacy-'+randomUUID(),undefined,{rng:()=>0});await c.call(request({action:'bootstrap'}));
 const ref=doc(c.db,'players',c.uid),roundId=randomUUID();
 await environment.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'players',c.uid),{
  balanceUnits:99000,penaltyRound:{id:roundId,betUnits:1000,step:4}}));
 const last=request({action:'penalty',game:'penalty',bet:10,roundId,step:4,move:'shoot',quality:1000});
 const paid=await c.call(last);assert.equal(paid.outcome.ended,true);assert.equal(paid.outcome.step,5);
 assert.equal(paid.outcome.winUnits,10000);assert.equal(paid.player.balance,1090);
 assert.equal((await c.call(last)).replayed,true);assert.equal((await getDoc(ref)).data().balanceUnits,109000);
 await new Promise(resolve=>setTimeout(resolve,350));
 const next=randomUUID(),fresh=await c.call({action:'penalty',game:'penalty',bet:10,roundId:next,requestId:next,step:0,move:'shoot',quality:1000});
 assert.equal(fresh.player.penaltyRound.ladderVersion,2);assert.equal(fresh.player.balance,1080);
 await new Promise(resolve=>setTimeout(resolve,350));
 const collected=await c.call(request({action:'penalty',game:'penalty',bet:10,roundId:next,step:1,move:'collect',quality:0}));
 assert.equal(collected.player.balance,1095);
});
test('Penalty Rules reject free progress, skipped steps, changed bets and forged credits',async()=>{
  const identity='penalty-forged-'+randomUUID(),c=await client(identity,identity,{rng:()=>0});
  await c.call(request({action:'bootstrap'}));const ref=doc(c.db,'players',c.uid),roundId=randomUUID();
  await c.call({action:'penalty',game:'penalty',bet:2.5,roundId,requestId:roundId,step:0,move:'shoot',quality:1000});
  await new Promise(resolve=>setTimeout(resolve,350));
  await assertFails(updateDoc(ref,{penaltyRound:null,revision:2,updatedAt:serverTimestamp()}));
  async function forged(changes={},profileChanges={}) {
    const old=(await getDoc(ref)).data(),id=randomUUID();
    const x={...engine.penalty(2.5,old.penaltyRound,'shoot',roundId,1000,()=>0),...changes};
    const next={...old,balanceUnits:old.balanceUnits+x.winUnits,revision:old.revision+1,lastOperationId:id,
      updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp(),
      penaltyRound:x.ended?null:{id:x.roundId,betUnits:x.betUnits,step:x.step,...(x.ladderVersion===2?{ladderVersion:2}:{})},...profileChanges};
    const batch=writeBatch(c.db);batch.set(ref,next);
    batch.set(doc(c.db,'players',c.uid,'operations',id),{action:'penalty',game:'penalty',selected:-1,fingerprint:'forged',betUnits:0,
      winUnits:x.winUnits,createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION,
      result:{game:'penalty',bet:x.betUnits/100,balanceBefore:old.balanceUnits/100,balanceDebited:old.balanceUnits/100,
        baseBalance:next.balanceUnits/100,player:publicPlayer(next),outcome:x}});
    await assertFails(batch.commit());
  }
  await forged({step:4});await forged({betUnits:1000});await forged({quality:0});
  await forged({winUnits:99999,ended:true});await forged({ladderVersion:1});await forged({}, {peaches:4});
  await assertFails(getDoc(doc(c.db,'players','another-penalty-player')));
});
async function client(name,identity=name,dependencies={}){
  const app=initializeApp({apiKey:'demo-key',projectId:'demo-king-rico',appId:'demo-app'},name);apps.push(app);
  const auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
  const credential=GoogleAuthProvider.credential(JSON.stringify({sub:identity,email:`${identity}@example.test`,email_verified:true}));
  const signed=await signInWithCredential(auth,credential);
  const db=getFirestore(app);connectFirestoreEmulator(db,'127.0.0.1',8085);
  const store=createGameStore(db,signed.user.uid,dependencies);
  return {auth,db,uid:signed.user.uid,call:async data=>{
    try {return await store(data);}
    catch(error) {error.message=`${data.action}/${data.game || 'home'}: ${error.message}`;throw error;}
  }};
}
test('Spark wallet survives relogin and rules forbid unauthorized reads and arbitrary funding',async()=>{
  const name='wallet-'+randomUUID(),c=await client(name);
  let r=await c.call(request({action:'bootstrap',analyticsConsent:false}));assert.equal(r.player.balance,1000);
  const ref=doc(c.db,'players',c.uid);
  await assertFails(updateDoc(ref,{balanceUnits:9999999,revision:1,updatedAt:serverTimestamp()}));
  await assertSucceeds(getDoc(ref));await assertFails(getDoc(doc(c.db,'players','someone-else')));
  await assertFails(deleteDoc(ref));
  const bonus=await c.call(request({action:'bonus'}));assert.equal(bonus.amount,50);
  assert.equal((await c.call(request({action:'bonus'}))).amount,0);
  const operation=request({action:'spin',game:'wheel',bet:10,selected:0});
  const [a,b]=await Promise.all([c.call(operation),c.call(operation)]);
  assert.deepEqual(a.outcome,b.outcome);assert.equal(a.player.balance,1050-10+a.outcome.winUnits/100);
  assert.ok(a.replayed || b.replayed,'One concurrent request must recover the existing operation');
  await assert.rejects(c.call({...operation,selected:1}));
  await assertFails(updateDoc(doc(c.db,'players',c.uid,'operations',operation.requestId),{winUnits:9999999}));
  await new Promise(r=>setTimeout(r,800));
  const slot=await c.call(request({action:'spin',game:'circus',bet:2.5}));
  assert.equal(slot.player.balance,a.player.balance-2.5+slot.outcome.winUnits/100);
  await signOut(c.auth);await assertFails(getDoc(ref));
  const again=await client(name+'-device',name);
  assert.equal((await again.call(request({action:'bootstrap'}))).player.balance,slot.player.balance);
});
test('Neck Rules preserve an early loss after reentry and replay without another draw',async()=>{
  const identity='neck-early-miss';
  const first=await client('neck-early-miss-first',identity,{rng:()=>.99});
  await first.call(request({action:'bootstrap'}));
  const start=request({action:'neck',game:'neck',move:'start',bet:10,roundId:randomUUID(),floor:0});
  const missed=await first.call(start);
  assert.equal(missed.outcome.ok,false);assert.equal(missed.player.balance,990);
  assert.equal(missed.player.neckRound,null);
  await signOut(first.auth);
  const returned=await client('neck-early-miss-returned',identity,{rng:()=>{throw Error('No redraw on replay');}});
  assert.equal((await returned.call(request({action:'bootstrap'}))).player.balance,990);
  const replay=await returned.call(start);
  assert.equal(replay.replayed,true);assert.deepEqual(replay.outcome,missed.outcome);
  assert.equal(replay.player.balance,990);
  await assert.rejects(returned.call(request({action:'neck',game:'neck',move:'collect',bet:10,
    roundId:start.roundId,floor:1})),{code:'king-rico/round-conflict'});
});
test('Fingo Rules debit once, preserve a pending roll across devices and settle one prize before animation',async()=>{
  const identity='fingo-'+randomUUID(),c=await client(identity,identity,{rng:()=>0});
  await c.call(request({action:'bootstrap'}));
  // Existing players arrive with a daily gift, previous spins and legacy fields.
  await c.call(request({action:'bonus'}));
  await c.call(request({action:'spin',game:'wheel',bet:1,selected:0}));
  const ref=doc(c.db,'players',c.uid);
  await environment.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'players',c.uid),{balanceUnits:100025,peaches:2,neckRound:null}));
  await new Promise(resolve=>setTimeout(resolve,350));
  const other=await client(identity+'-device',identity,{rng:()=>0});
  const base={action:'fingo',game:'fingo',bet:2.5,roundId:randomUUID()};
  for(let used=0;used<5;used++) {
    const id=request({...base,move:'roll',used}),[a,b]=await Promise.all([c.call(id),other.call(id)]);
    assert.equal(a.player.balance,997.75);assert.ok(a.replayed || b.replayed);
    assert.deepEqual((await other.call(request({action:'bootstrap'}))).player.fingoRound.slots,a.outcome.slots);
    await assert.rejects(c.call(request({...base,move:'roll',used})),{code:'king-rico/round-conflict'});
    await new Promise(resolve=>setTimeout(resolve,350));
    const drop=request({...base,move:'drop',used,selected:used});
    const [paid,replay]=await Promise.all([other.call(drop),c.call(drop)]);
    assert.ok(paid.replayed || replay.replayed);assert.equal(paid.outcome.marks[used],true);
    assert.equal((await getDoc(ref)).data().balanceUnits,used===4?106025:99775);
    assert.equal(paid.player.fingoRound===null,used===4);
    await new Promise(resolve=>setTimeout(resolve,350));
  }
  assert.equal((await other.call(request({action:'bootstrap'}))).player.balance,1060.25);
});
test('Fingo Rules reject rerolls, invented marks, skipped balls, bet changes and arbitrary credits',async()=>{
  const name='fingo-forged-'+randomUUID(),c=await client(name,name,{rng:()=>0});
  await c.call(request({action:'bootstrap'}));
  const base={action:'fingo',game:'fingo',bet:2.5,roundId:randomUUID()};
  await c.call(request({...base,move:'roll',used:0}));
  const ref=doc(c.db,'players',c.uid);
  await assertFails(updateDoc(ref,{fingoRound:null,updatedAt:serverTimestamp(),revision:2}));
  async function forged(changes={},profileChanges={}) {
    const old=(await getDoc(ref)).data(),id=randomUUID();
    const x={...engine.fingo(2.5,old.fingoRound,'drop',base.roundId,0,()=>0),...changes};
    const next={...old,balanceUnits:old.balanceUnits+x.winUnits,revision:old.revision+1,lastOperationId:id,
      updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp(),
      fingoRound:x.ended?null:{id:x.roundId,betUnits:x.betUnits,targets:x.targets,marks:x.marks,used:x.used,slots:x.move==='roll'?x.slots:null},...profileChanges};
    const batch=writeBatch(c.db);batch.set(ref,next);
    batch.set(doc(c.db,'players',c.uid,'operations',id),{action:'fingo',game:'fingo',selected:x.move==='roll'?-1:0,
      fingerprint:'forged',betUnits:0,winUnits:x.winUnits,createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION,
      result:{game:'fingo',bet:x.betUnits/100,balanceBefore:old.balanceUnits/100,balanceDebited:old.balanceUnits/100,
        baseBalance:next.balanceUnits/100,player:publicPlayer(next),outcome:x}});
    await assertFails(batch.commit());
  }
  await new Promise(resolve=>setTimeout(resolve,350));
  await forged({move:'roll',bin:-1,used:0,marks:[false,false,false,false,false]});
  await forged({marks:[true,true,true,true,true],ended:true,winUnits:6250});
  await forged({used:21,ended:true});await forged({betUnits:1000});
  await forged({targets:[2,17,32,47,62]});await forged({winUnits:999999});await forged({}, {peaches:4});
  await assertFails(getDoc(doc(c.db,'players','another-fingo-player')));
});
test('Fingo Rules settle the final ball while preserving an exhausted wallet',async()=>{
  const name='fingo-last-'+randomUUID(),c=await client(name,name,{rng:()=>0});
  await c.call(request({action:'bootstrap'}));
  const ref=doc(c.db,'players',c.uid),targets=[1,16,31,46,61],roundId=randomUUID();
  async function seed(marks) {
    await environment.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'players',c.uid),{
      balanceUnits:0,lastSpinAt:null,fingoRound:{id:roundId,betUnits:250,targets,marks,used:29,slots:targets}}));
  }
  await seed([true,true,true,true,false]);
  assert.ok((await c.call(request({action:'bootstrap'}))).player.fingoRound);
  const last=request({action:'fingo',game:'fingo',bet:2.5,roundId,move:'drop',used:29,selected:4});
  const paid=await c.call(last);assert.equal(paid.outcome.winUnits,250);assert.equal(paid.player.balance,2.5);assert.equal(paid.player.fingoRound,null);
  assert.equal((await c.call(last)).replayed,true);
  await seed([false,false,false,false,false]);
  const missed=await c.call({...last,requestId:randomUUID()});
  assert.equal(missed.outcome.winUnits,0);assert.equal(missed.player.fingoRound,null);
  assert.equal((await c.call(request({action:'recharge'}))).player.balance,1000);
});
test('recharge Rules credit an exhausted wallet once after the daily gift and reject forged credits',async()=>{
  const identity='recharge-'+randomUUID(),c=await client(identity);
  await c.call(request({action:'bootstrap'}));await c.call(request({action:'bonus'}));
  const ref=doc(c.db,'players',c.uid);
  async function seed(changes) {
    await environment.withSecurityRulesDisabled(async context=>updateDoc(doc(context.firestore(),'players',c.uid),changes));
  }
  await seed({balanceUnits:25,peaches:3});
  const original=(await getDoc(ref)).data(),id=request({action:'recharge'});
  const [a,b]=await Promise.all([c.call(id),c.call(id)]);
  assert.equal(a.player.balance,1000.25);assert.equal(b.player.balance,1000.25);assert.ok(a.replayed || b.replayed);
  assert.deepEqual(a.player.bonus,original.bonus);assert.equal(a.player.peaches,3);
  assert.equal((await c.call(request({action:'bonus'}))).amount,0);
  assert.equal((await c.call(request({action:'recharge'}))).amount,0);
  const other=await client(identity+'-device',identity);
  assert.equal((await other.call(request({action:'bootstrap'}))).player.balance,1000.25);
  async function forged(credit=100000,changes={}) {
    const old=(await getDoc(ref)).data(),operationId=randomUUID(),batch=writeBatch(c.db);
    const next={...old,balanceUnits:old.balanceUnits+credit,revision:old.revision+1,lastOperationId:operationId,
      updatedAt:serverTimestamp(),...changes};
    const player={balance:next.balanceUnits/100,peaches:next.peaches,settings:next.settings,bonus:next.bonus,
      neckRound:next.neckRound || null,analyticsConsent:next.analyticsConsent,revision:next.revision};
    batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',operationId),{action:'recharge',game:'home',selected:-1,
      fingerprint:'forged',betUnits:0,winUnits:credit,result:{amount:credit/100,player},createdAt:serverTimestamp(),rulesVersion:'2026-10-13-spark-v2'});
    await assertFails(batch.commit());
  }
  await forged(); // sufficient funds
  await seed({balanceUnits:0});
  await forged(999999);await forged(100000,{peaches:4});
  await forged(100000,{bonus:{day:null,dayIndex:-1,streak:0}});
  await seed({neckRound:{id:randomUUID(),betUnits:100000,floor:1,peachAt:0,savedUnits:0}});
  const paid=await c.call(request({action:'recharge'}));
  assert.equal(paid.amount,1000);assert.equal(paid.player.neckRound.floor,1);
  await forged();
  const collect=request({action:'neck',game:'neck',move:'collect',bet:1000,roundId:paid.player.neckRound.id,floor:1});
  const prize=await c.call(collect);assert.equal(prize.player.balance,2100);assert.equal(prize.player.neckRound,null);
  assert.equal((await other.call(collect)).replayed,true);assert.equal((await getDoc(ref)).data().balanceUnits,210000);
  await seed({neckRound:null,balanceUnits:0});
  const [x,y]=await Promise.all([c.call(request({action:'recharge'})),other.call(request({action:'recharge'}))]);
  assert.equal((await getDoc(ref)).data().balanceUnits,100000);
  assert.equal(x.amount+y.amount,1000);
});
test('Neck Rules preserve a legacy account, resume another device and pay collection once',async()=>{
  const identity='neck-'+randomUUID(),c=await client(identity,identity,{rng:()=>0});await c.call(request({action:'bootstrap'}));
  const ref=doc(c.db,'players',c.uid);
  await environment.withSecurityRulesDisabled(async context=>{
    const legacy=doc(context.firestore(),'players',c.uid),p=(await getDoc(legacy)).data();
    delete p.settings.neckBetIdx;delete p.neckRound;await setDoc(legacy,{...p,balanceUnits:100025});
  });
  const roundId=randomUUID(),start=request({action:'neck',game:'neck',move:'start',bet:2.5,roundId,floor:0});
  const [a,b]=await Promise.all([c.call(start),c.call(start)]);
  assert.equal(a.player.balance,997.75);assert.equal(a.player.neckRound.floor,1);assert.ok(a.replayed || b.replayed);
  const other=await client(identity+'-device',identity,{rng:()=>0});
  assert.equal((await other.call(request({action:'bootstrap'}))).player.neckRound.id,roundId);
  await new Promise(r=>setTimeout(r,350));
  const step=await other.call(request({action:'neck',game:'neck',move:'climb',bet:2.5,roundId,floor:1}));assert.equal(step.player.neckRound.floor,2);
  await new Promise(r=>setTimeout(r,350));
  const collect=request({action:'neck',game:'neck',move:'collect',bet:2.5,roundId,floor:2});
  const [paid,replay]=await Promise.all([c.call(collect),other.call(collect)]);
  assert.equal(paid.player.balance,1000.75);assert.equal(replay.player.balance,1000.75);assert.equal(paid.player.neckRound,null);
  await assert.rejects(other.call(request({action:'neck',game:'neck',move:'climb',bet:2.5,roundId,floor:1})),{code:'king-rico/round-conflict'});
});
test('Neck Rules reject arbitrary guarantees, free progression and unbound credits',async()=>{
  const c=await client('neck-forgery-'+randomUUID());await c.call(request({action:'bootstrap'}));
  const ref=doc(c.db,'players',c.uid),p=(await getDoc(ref)).data();
  await assertFails(updateDoc(ref,{neckRound:{id:randomUUID(),betUnits:1000,floor:10,peachAt:6,savedUnits:999999},updatedAt:serverTimestamp(),revision:1}));
  await assertFails(updateDoc(ref,{neckRound:{id:randomUUID(),betUnits:1000,floor:1,peachAt:0,savedUnits:0},updatedAt:serverTimestamp(),revision:1}));
  await assertFails(updateDoc(ref,{settings:{...p.settings,neckBetIdx:10},updatedAt:serverTimestamp(),revision:1}));
  const id=randomUUID(),roundId=randomUUID(),b=writeBatch(c.db);
  const next={...p,neckRound:null,balanceUnits:p.balanceUnits+50000,updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp(),firstSpinAt:serverTimestamp(),revision:1,lastOperationId:id};
  const outcome={move:'collect',roundId,betUnits:1000,peachAt:0,floor:33,savedUnits:0,ok:true,ended:true,winUnits:50000};
  b.set(ref,next);b.set(doc(c.db,'players',c.uid,'operations',id),{action:'neck',game:'neck',selected:-1,fingerprint:'forged',betUnits:0,winUnits:50000,
    result:{player:{balance:1500,peaches:0,bonus:p.bonus,settings:p.settings,analyticsConsent:false,revision:1,neckRound:null},
      game:'neck',bet:10,balanceBefore:1000,balanceDebited:1000,outcome,baseBalance:1500},createdAt:serverTimestamp(),rulesVersion:'2026-10-13-spark-v2'});
  await assertFails(b.commit());
});
test('Neck Rules validate Happeach guarantee, misses and automatic final-floor settlement',async()=>{
  const identity='neck-guarantee-'+randomUUID(),c=await client(identity,identity,{rng:()=>0});await c.call(request({action:'bootstrap'}));
  const roundId=randomUUID();let r;
  for(let floor=1;floor<=6;floor++) {
    r=await c.call(request({action:'neck',game:'neck',move:floor===1?'start':'climb',bet:10,roundId,floor:floor-1}));
    assert.equal(r.player.neckRound.floor,floor);await new Promise(resolve=>setTimeout(resolve,320));
  }
  assert.equal(r.player.neckRound.savedUnits,1550);
  const failing=await client(identity+'-fail',identity,{rng:()=>.99});
  r=await failing.call(request({action:'neck',game:'neck',move:'climb',bet:10,roundId,floor:6}));
  assert.equal(r.player.balance,1005.5);assert.equal(r.player.neckRound,null);
  await environment.withSecurityRulesDisabled(async context=>{
    const ref=doc(context.firestore(),'players',c.uid),p=(await getDoc(ref)).data();
    await setDoc(ref,{...p,lastSpinAt:null,neckRound:{id:roundId,betUnits:1000,floor:32,peachAt:6,savedUnits:1550}});
  });
  r=await c.call(request({action:'neck',game:'neck',move:'climb',bet:10,roundId,floor:32}));
  assert.equal(r.outcome.floor,33);assert.equal(r.outcome.winUnits,50000);assert.equal(r.player.balance,1505.5);assert.equal(r.player.neckRound,null);
});
test('Spark rules validate creation, settings, timestamps, balances, operation binding and providers',async()=>{
  const c=await client('rules-'+randomUUID());await c.call(request({action:'bootstrap'}));
  const ref=doc(c.db,'players',c.uid),p=(await getDoc(ref)).data();
  await assertFails(setDoc(ref,{...p,email:'extra@example.test',updatedAt:serverTimestamp(),revision:1}));
  await assertFails(updateDoc(ref,{settings:{...p.settings,sfxLvl:9},updatedAt:serverTimestamp(),revision:1}));
  await assertFails(updateDoc(ref,{createdAt:serverTimestamp(),updatedAt:serverTimestamp(),revision:1}));
  await assertFails(updateDoc(ref,{balanceUnits:-1,updatedAt:serverTimestamp(),revision:1}));
  await assertSucceeds(c.call(request({action:'settings',settings:{sfxLvl:0},analyticsConsent:true})));
  await assertFails(updateDoc(ref,{lastOperationId:randomUUID(),updatedAt:serverTimestamp(),revision:2}));
  await environment.withSecurityRulesDisabled(async context=>updateDoc(doc(context.firestore(),'players',c.uid),{balanceUnits:100}));
  await assert.rejects(c.call(request({action:'spin',game:'wheel',bet:10,selected:0})),{code:'king-rico/failed-precondition'});
  const anonymous=environment.unauthenticatedContext().firestore();await assertFails(getDoc(doc(anonymous,'players',c.uid)));
  const otherProvider=environment.authenticatedContext('password-user',{firebase:{sign_in_provider:'password'}}).firestore();
  await assertFails(setDoc(doc(otherProvider,'players','password-user'),p));
  // Forged but bounded lottery outcomes remain possible in Spark. Rules can
  // independently validate the server-clock bonus limit tested below.
  const today=await c.call(request({action:'bonus'}));
  const current=(await getDoc(ref)).data(),id=randomUUID(),b=writeBatch(c.db);
  const next={...current,balanceUnits:current.balanceUnits+5000,revision:current.revision+1,lastOperationId:id,updatedAt:serverTimestamp()};
  const publicP={...today.player,balance:next.balanceUnits/100,revision:next.revision};
  b.set(ref,next);b.set(doc(c.db,'players',c.uid,'operations',id),{action:'bonus',game:'home',selected:-1,
    fingerprint:'forged',betUnits:0,winUnits:5000,result:{amount:50,player:publicP},createdAt:serverTimestamp(),rulesVersion:'2026-10-12-spark-v1'});
  await assertFails(b.commit());
});
test('Clown Rules persist ten throws, reject forged progress and settle across devices once',async()=>{
 const identity='clown-'+randomUUID(),c=await client(identity,identity,{rng:()=>0});await c.call(request({action:'bootstrap'}));
 const ref=doc(c.db,'players',c.uid),roundId=randomUUID(),base={action:'clown',game:'clown',bet:2.5,roundId,selected:0};
 const first={...base,requestId:roundId,used:0};const [a,b]=await Promise.all([c.call(first),c.call(first)]);
 assert.ok(a.replayed || b.replayed);assert.equal(a.player.balance,997.5);
 const other=await client(identity+'other',identity,{rng:()=>0});assert.equal((await other.call(request({action:'bootstrap'}))).player.clownRound.used,1);
 await assertFails(updateDoc(ref,{clownRound:null,updatedAt:serverTimestamp(),revision:2}));
 for(let used=1;used<10;used++) {
  await new Promise(r=>setTimeout(r,350));const shot=request({...base,used});const result=await other.call(shot);
  assert.equal((await c.call(shot)).replayed,true);assert.equal(result.player.balance,used===9?1001.3:997.5);
 }
 assert.equal((await getDoc(ref)).data().clownStats.winUnits,380);
 assert.equal((await c.call(first)).replayed,true);
 await assert.rejects(c.call(request({...base,used:9})),{code:'king-rico/round-conflict'});
});
test('Bounce Rules validate gold, saved checkpoint, loss, replay and restore',async()=>{
 const identity='bounce-'+randomUUID(),c=await client(identity,identity);await c.call(request({action:'bootstrap'}));
 const roundId=randomUUID(),base={action:'bounce',game:'bounce',bet:1000,roundId,gold:false};
 const start={...base,move:'start',n:0,requestId:roundId};await c.call(start);assert.equal((await c.call(start)).replayed,true);
 assert.ok((await c.call(request({action:'bootstrap'}))).player.bounceRound);
 for(let n=0;n<10;n++) {await new Promise(r=>setTimeout(r,350));const step=request({...base,move:'land',n,gold:n===2});await c.call(step);assert.equal((await c.call(step)).replayed,true);}
 const other=await client(identity+'other',identity);assert.equal((await other.call(request({action:'bootstrap'}))).player.bounceRound.n,10);
 await new Promise(r=>setTimeout(r,350));const fall=request({...base,move:'fall',n:10});const r=await c.call(fall);
 assert.equal(r.player.balance,4500);assert.equal(r.player.bounceRound,null);assert.equal((await other.call(fall)).replayed,true);
 await assertFails(updateDoc(doc(c.db,'players',c.uid),{balanceUnits:99999999,revision:r.player.revision+1,updatedAt:serverTimestamp()}));
});
test('Wheel Rules match all 13 targets and displayed color/Fortune prizes',async()=>{
 const identity='wheel13-'+randomUUID();let rng=0;
 const c=await client(identity,identity,{rng:()=>rng});await c.call(request({action:'bootstrap'}));
 for(const [selected,value,win] of [[0,0,25000],[12,0,10000],[12,.1,2000],[12,.99,0]]) {
  rng=value;await new Promise(r=>setTimeout(r,750));const result=await c.call(request({action:'spin',game:'wheel',bet:10,selected}));assert.equal(result.outcome.winUnits,win);
 }
});
test('Clown Rules persist misses and whole-number multipliers, without numeric type mismatches',async()=>{
 const identity='clown-targets-'+randomUUID(),c=await client(identity,identity,{rng:()=>0});await c.call(request({action:'bootstrap'}));
 const roundId=randomUUID(),base={action:'clown',game:'clown',bet:1,roundId};
 let sum=0;
 for(const [used,selected] of [4,-1,2,1,0,5,-1,3,0,-1].entries()) {
  if(used) await new Promise(r=>setTimeout(r,350));
  const r=await c.call({...base,used,selected,requestId:used===0?roundId:randomUUID()});
  sum+=Math.round(100*(selected<0?0:engine.CLOWN_MULTIPLIERS[selected])/10);
  assert.equal(r.outcome.sumUnits,sum);assert.equal(r.player.balance,used===9?999+sum/100:999);
 }
});

test('Flying Rules preserve the real wallet, balloon order, cross-device collection and all ten prizes',async()=>{
 const name='flying-'+randomUUID(),c=await client(name,name,{rng:()=>0});await c.call(request({action:'bootstrap'}));
 const roundId=randomUUID(),base={action:'flying',game:'flying',bet:2.5,roundId};
 const first={...base,requestId:roundId,move:'pop',step:0,selected:4};
 const [a,b]=await Promise.all([c.call(first),c.call(first)]);assert.ok(a.replayed||b.replayed);assert.equal(a.player.balance,997.5);
 const second=await client(name+'-other',name,{rng:()=>{throw Error('No redraw on collect');}});
 assert.deepEqual((await second.call(request({action:'bootstrap'}))).player.flyingRound.popped,[4]);
 await assertFails(updateDoc(doc(c.db,'players',c.uid),{flyingRound:null,revision:2,updatedAt:serverTimestamp()}));
 await new Promise(r=>setTimeout(r,350));
 const take=request({...base,move:'collect',step:1,selected:-1});const paid=await second.call(take);
 assert.equal(paid.player.balance,1000.5);assert.equal((await c.call(take)).replayed,true);
 await assert.rejects(c.call(request({...base,move:'pop',step:1,selected:3})),{code:'king-rico/round-conflict'});
 await new Promise(r=>setTimeout(r,350));
 const finalId=randomUUID();
 for(let step=0;step<10;step++){
  const x=await c.call({...base,roundId:finalId,requestId:step===0?finalId:randomUUID(),move:'pop',step,selected:step});
  assert.equal(x.player.balance,step===9?1048:998);assert.equal(x.outcome.step,step+1);
  await new Promise(r=>setTimeout(r,350));
 }
});
test('21 Rules persist natural, tie, bust and bank turns without allowing extra credits or forged cards',async()=>{
 const {rngFor}=await import('./helpers/twenty-one.cjs');let rng=rngFor([9,5,7,6,22]);
 const name='twentyOne-'+randomUUID(),c=await client(name,name,{rng:()=>rng()});await c.call(request({action:'bootstrap'}));
 const roundId=randomUUID(),base={action:'twentyOne',game:'twentyOne',bet:2.5,roundId};
 const first={...base,requestId:roundId,move:'start',turn:0};const [a,b]=await Promise.all([c.call(first),c.call(first)]);
 assert.ok(a.replayed||b.replayed);assert.equal(a.player.balance,997.5);assert.equal(a.outcome.round.turn,1);
 const second=await client(name+'-other',name,{rng:()=>{throw Error('Resume must not shuffle');}});
 assert.deepEqual((await second.call(request({action:'bootstrap'}))).player.twentyOneRound,a.outcome.round);
 await new Promise(r=>setTimeout(r,350));await second.call(request({...base,move:'stand',turn:1}));
 await new Promise(r=>setTimeout(r,350));const final=request({...base,move:'dealer',turn:2});const win=await c.call(final);
 assert.equal(win.outcome.round.result.reason,'dealer-bust');assert.equal(win.player.balance,1002.5);
 assert.equal((await second.call(final)).replayed,true);
 await assert.rejects(c.call(request({...base,move:'hit',turn:2})),{code:'king-rico/round-conflict'});
 await assertFails(updateDoc(doc(c.db,'players',c.uid),{'twentyOneRound.player':[0,9],balanceUnits:999999,revision:4,updatedAt:serverTimestamp()}));
 await new Promise(r=>setTimeout(r,350));rng=rngFor([0,8,9,7]);const id=randomUUID();
 await c.call({...base,roundId:id,requestId:id,move:'start',turn:0});await new Promise(r=>setTimeout(r,350));
 const natural=await c.call(request({...base,roundId:id,move:'dealer',turn:1}));
 assert.equal(natural.player.balance,1006.25);assert.equal(natural.outcome.round.result.reason,'natural');
 await new Promise(r=>setTimeout(r,350));rng=rngFor([9,8,7,6,22]);const id2=randomUUID();
 await c.call({...base,roundId:id2,requestId:id2,move:'start',turn:0});await new Promise(r=>setTimeout(r,350));
 const busted=await c.call(request({...base,roundId:id2,move:'hit',turn:1}));assert.equal(busted.outcome.round.result.reason,'player-bust');assert.equal(busted.player.balance,1003.75);
});

test('21 Rules reject modified decks, skipped cards, fake totals and forged payout during a hand',async()=>{
 const {rngFor}=await import('./helpers/twenty-one.cjs');const name='21-forged-'+randomUUID(),c=await client(name,name,{rng:rngFor([9,5,7,6,22])});
 await c.call(request({action:'bootstrap'}));const roundId=randomUUID();
 await c.call({action:'twentyOne',game:'twentyOne',bet:1000,roundId,requestId:roundId,move:'start',turn:0});
 assert.ok((await c.call(request({action:'bootstrap'}))).player.twentyOneRound);
 const ref=doc(c.db,'players',c.uid);await new Promise(r=>setTimeout(r,350));
 async function forge(change,credit=0){
  const old=(await getDoc(ref)).data(),id=randomUUID(),outcome=engine.twentyOne(1000,old.twentyOneRound,'hit',roundId);
  change(outcome);const next={...old,twentyOneRound:outcome.round,balanceUnits:old.balanceUnits+credit,revision:old.revision+1,
   lastOperationId:id,updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp()};
  const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',id),{action:'twentyOne',game:'twentyOne',selected:-1,fingerprint:'forged',betUnits:0,winUnits:credit,
   createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION,result:{game:'twentyOne',bet:1000,balanceBefore:0,balanceDebited:0,baseBalance:credit/100,outcome}});
  await assertFails(batch.commit());
 }
 await forge(x=>{[x.round.deck[4],x.round.deck[5]]=[x.round.deck[5],x.round.deck[4]];});
 await forge(x=>{x.round.cursor++;});await forge(x=>{x.round.playerHard=21;});
 await forge(x=>{x.winUnits=99999;},99999);
});

test('21 Rules validate both naturals, bank natural, ties and soft-ace adjustment',async()=>{
 const {rngFor}=await import('./helpers/twenty-one.cjs');let draw;const name='21-aces-'+randomUUID(),c=await client(name,name,{rng:()=>draw()});await c.call(request({action:'bootstrap'}));
 for(const [prefix,moves,reason] of [
  [[0,13,9,22],['dealer'],'both-21'],[[8,0,7,9],['dealer'],'dealer-21'],
  [[9,8,7,21],['stand','dealer'],'equal'],[[0,13,5,18],['stand','dealer'],'equal'],
  [[0,8,5,7,22],['hit','stand','dealer'],'equal']]){
  draw=rngFor(prefix);const roundId=randomUUID(),base={action:'twentyOne',game:'twentyOne',bet:2.5,roundId};
  let result=await c.call({...base,requestId:roundId,move:'start',turn:0});
  for(const move of moves){await new Promise(r=>setTimeout(r,350));result=await c.call(request({...base,move,turn:result.outcome.round.turn}));}
  assert.equal(result.outcome.round.result.reason,reason);assert.equal(result.player.balance,reason==='dealer-21'?997.5:reason==='both-21'?1000:997.5);
  await new Promise(r=>setTimeout(r,350));
 }
});

test('Cached v3 clients can play another game without erasing a saved 21 hand',async()=>{
 const {rngFor}=await import('./helpers/twenty-one.cjs');const name='21-legacy-'+randomUUID(),c=await client(name,name,{rng:rngFor([9,5,7,6])});
 await c.call(request({action:'bootstrap'}));const roundId=randomUUID();
 await c.call({action:'twentyOne',game:'twentyOne',move:'start',bet:10,turn:0,roundId,requestId:roundId});
 await new Promise(r=>setTimeout(r,750));const ref=doc(c.db,'players',c.uid),old=(await getDoc(ref)).data(),id=randomUUID(),outcome=engine.wheel(1,1,()=>.99);
 const next={...old,balanceUnits:old.balanceUnits-100+outcome.winUnits,settings:{...old.settings,wheelBetIdx:0},revision:old.revision+1,lastOperationId:id,updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp()};
 const player=publicPlayer(next);delete player.flyingRound;delete player.twentyOneRound;
 const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',id),{action:'spin',game:'wheel',selected:1,fingerprint:'legacy-v3',betUnits:100,winUnits:outcome.winUnits,
  createdAt:serverTimestamp(),rulesVersion:'2026-10-19-spark-v3',result:{game:'wheel',bet:1,balanceBefore:old.balanceUnits/100,balanceDebited:(old.balanceUnits-100)/100,baseBalance:next.balanceUnits/100,outcome,player}});
 await assertSucceeds(batch.commit());assert.equal((await getDoc(ref)).data().twentyOneRound.id,roundId);
});

test('33 Rules preserve literal ranks, exact 33, shared balance, replay and cross-device bank turns',async()=>{
 const {rngFor}=await import('./helpers/twenty-one.cjs');const name='33-'+randomUUID(),c=await client(name,name,{rng:rngFor([12,25,11,10,7,38],{guided33:true})});
 await c.call(request({action:'bootstrap'}));const roundId=randomUUID(),base={action:'twentyOne',game:'twentyOne',bet:1000,roundId,target:33};
 const opening={...base,requestId:roundId,move:'start',turn:0};const [a,b]=await Promise.all([c.call(opening),c.call(opening)]);
 assert.ok(a.replayed||b.replayed);assert.equal(a.player.balance,0);assert.equal(a.outcome.round.target,33);assert.equal(a.outcome.round.playerHard,25);
 assert.ok((await c.call(request({action:'bootstrap'}))).player.twentyOneRound);
 const other=await client(name+'-other',name,{rng:()=>{throw Error('Resume cannot shuffle');}});assert.deepEqual((await other.call(request({action:'bootstrap'}))).player.twentyOneRound,a.outcome.round);
 await new Promise(r=>setTimeout(r,350));const hit=await other.call(request({...base,move:'hit',turn:1}));assert.equal(hit.outcome.round.playerHard,33);assert.equal(hit.outcome.round.phase,'dealer');
 await new Promise(r=>setTimeout(r,350));const final=request({...base,move:'dealer',turn:2});const win=await c.call(final);assert.equal(win.player.balance,2080);assert.equal(win.outcome.round.dealerHard,37);
 assert.equal((await other.call(final)).replayed,true);await assert.rejects(c.call(request({...base,move:'hit',turn:2})),{code:'king-rico/round-conflict'});
});
test('33 Rules enforce bank 27, ties, both busts, and the literal value of one',async()=>{
 const {rngFor}=await import('./helpers/twenty-one.cjs');let draw;const name='33-outcomes-'+randomUUID(),c=await client(name,name,{rng:()=>draw()});await c.call(request({action:'bootstrap'}));
 for(const [prefix,moves,reason,total] of [
  [[12,25,11,38,0],['stand','dealer'],'lower',25],
  [[12,25,11,24,7,20],['hit','dealer'],'equal',33],
  [[12,0,25,1,11],['hit'],'player-bust',38],
  [[12,11,25,26,38,51],['stand','dealer','dealer'],'dealer-bust',26],
  [[0,11,10,12,1],['stand','dealer'],'lower',12]]){
  draw=rngFor(prefix,{guided33:true});const roundId=randomUUID(),base={action:'twentyOne',game:'twentyOne',bet:2.5,roundId,target:33};
  let x=await c.call({...base,requestId:roundId,move:'start',turn:0});
  for(const move of moves){await new Promise(r=>setTimeout(r,350));x=await c.call(request({...base,move,turn:x.outcome.round.turn}));}
  assert.equal(x.outcome.round.result.reason,reason);assert.equal(x.outcome.round.playerHard,total);assert.equal(x.outcome.round.playerAces,0);
  await new Promise(r=>setTimeout(r,350));
 }
});
test('33 Rules reject changed targets, capped face-card values, forged totals/decks/prizes',async()=>{
 const {rngFor}=await import('./helpers/twenty-one.cjs');const name='33-forged-'+randomUUID(),c=await client(name,name,{rng:rngFor([12,25,11,10,7,38],{guided33:true})});
 await c.call(request({action:'bootstrap'}));const roundId=randomUUID();await c.call({action:'twentyOne',game:'twentyOne',bet:10,roundId,requestId:roundId,move:'start',turn:0,target:33});
 const ref=doc(c.db,'players',c.uid);await new Promise(r=>setTimeout(r,350));
 async function forge(change,credit=0){
  const old=(await getDoc(ref)).data(),id=randomUUID(),outcome=engine.twentyOne(10,old.twentyOneRound,'hit',roundId);change(outcome);
  const next={...old,twentyOneRound:outcome.round,balanceUnits:old.balanceUnits+credit,revision:old.revision+1,lastOperationId:id,updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp()};
  const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',id),{action:'twentyOne',game:'twentyOne',selected:-1,fingerprint:'forged',betUnits:0,winUnits:credit,createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION,
   result:{game:'twentyOne',bet:10,balanceBefore:old.balanceUnits/100,balanceDebited:old.balanceUnits/100,baseBalance:next.balanceUnits/100,outcome}});await assertFails(batch.commit());
 }
 await forge(x=>{x.round.dealVersion=1;});await forge(x=>{x.round.winFactor=300;});await forge(x=>{x.round.target=21;});await forge(x=>{x.round.playerHard=28;});await forge(x=>{x.round.playerAces=1;});await forge(x=>{x.round.deck.reverse();});await forge(x=>{x.round.cursor++;});await forge(x=>{x.winUnits=99999;},99999);
});

test('Claw Rules persist one deterministic grab, exact cents, immutable result and cross-device replay',async()=>{
 const name='claw-'+randomUUID(),c=await client(name,name);await c.call(request({action:'bootstrap'}));
 const roundId=randomUUID(),grab={action:'claw',game:'claw',bet:2.5,selected:4,aimX:500,aimZ:500,seed:0,roundId,requestId:roundId};
 const [a,b]=await Promise.all([c.call(grab),c.call(grab)]);assert.ok(a.replayed||b.replayed);assert.equal(a.player.balance,1005);assert.equal(a.outcome.quality,1000);assert.equal(a.outcome.winUnits,750);
 const other=await client(name+'-other',name);assert.equal((await other.call(grab)).replayed,true);assert.equal((await other.call(request({action:'bootstrap'}))).player.balance,1005);
 const op=doc(other.db,'players',c.uid,'operations',roundId);assert.equal((await getDoc(op)).data().result.outcome.winUnits,750);await assertFails(updateDoc(op,{'result.outcome.winUnits':99999}));
 const stranger=await client(name+'-stranger',name+'-stranger');await stranger.call(request({action:'bootstrap'}));await assertFails(getDoc(doc(stranger.db,'players',c.uid,'operations',roundId)));
 for(const [aimX,expected]of[[548,1010],[549,1010],[596,1010],[597,1007.5]]){
  await new Promise(r=>setTimeout(r,750));const id=randomUUID(),x=await c.call({...grab,aimX,roundId:id,requestId:id});assert.equal(x.player.balance,expected);
 }
});
test('Claw Rules reject fake accuracy, invented payouts, changed positions, wrong prize and mismatched operation IDs',async()=>{
 const name='claw-forged-'+randomUUID(),c=await client(name,name);await c.call(request({action:'bootstrap'}));
 const ref=doc(c.db,'players',c.uid);
 async function forge(change,credit=0){
  const old=(await getDoc(ref)).data(),id=randomUUID(),outcome=engine.claw(10,4,700,500,0,id);change(outcome);
  const next={...old,settings:{...old.settings,clawBetIdx:3},balanceUnits:old.balanceUnits-1000+credit,revision:old.revision+1,lastOperationId:id,updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp()};
  const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',id),{action:'claw',game:'claw',selected:4,fingerprint:'forged',betUnits:1000,winUnits:credit,createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION,
   result:{game:'claw',bet:10,balanceBefore:old.balanceUnits/100,balanceDebited:(old.balanceUnits-1000)/100,baseBalance:next.balanceUnits/100,outcome}});await assertFails(batch.commit());
 }
 await forge(x=>{x.quality=1000;x.winUnits=3000;},3000);await forge(x=>{x.winUnits=999999;},999999);await forge(x=>{x.aimX=-1;});await forge(x=>{x.selected=9;});await forge(x=>{x.seed=9;});await forge(x=>{x.betUnits=100;});await forge(x=>{x.roundId=randomUUID();});
});

test('Race Rules settle once, resume the same result, preserve exact cents and private immutable operations',async()=>{
 const name='race-'+randomUUID(),c=await client(name,name);await c.call(request({action:'bootstrap'}));
 const id=randomUUID(),bet={action:'race',game:'race',bet:2.5,selected:1,seed:21,roundId:id,requestId:id};
 const [a,b]=await Promise.all([c.call(bet),c.call(bet)]);assert.ok(a.replayed||b.replayed);assert.equal(a.player.balance,1007);assert.equal(a.outcome.winUnits,950);
 const other=await client(name+'-other',name);assert.equal((await other.call(bet)).replayed,true);
 const op=doc(other.db,'players',c.uid,'operations',id);assert.equal((await getDoc(op)).data().result.outcome.seed,21);await assertFails(updateDoc(op,{'result.outcome.winner':3}));
 const stranger=await client(name+'-stranger',name+'-stranger');await stranger.call(request({action:'bootstrap'}));await assertFails(getDoc(doc(stranger.db,'players',c.uid,'operations',id)));
 await new Promise(r=>setTimeout(r,750));const loss=randomUUID();assert.equal((await c.call({...bet,selected:0,requestId:loss,roundId:loss})).player.balance,1004.5);
});
test('Race Rules reject invented winners, overpayments, invalid marbles/seeds and mismatched IDs',async()=>{
 const name='race-forged-'+randomUUID(),c=await client(name,name);await c.call(request({action:'bootstrap'}));const ref=doc(c.db,'players',c.uid);
 async function forge(change,credit=0){const old=(await getDoc(ref)).data(),id=randomUUID(),outcome=engine.race(10,0,1,id);change(outcome);
  const next={...old,settings:{...old.settings,raceBetIdx:3},balanceUnits:old.balanceUnits-1000+credit,revision:old.revision+1,lastOperationId:id,updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp()};
  const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',id),{action:'race',game:'race',selected:0,fingerprint:'forged',betUnits:1000,winUnits:credit,createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION,result:{game:'race',bet:10,balanceBefore:old.balanceUnits/100,balanceDebited:(old.balanceUnits-1000)/100,baseBalance:next.balanceUnits/100,outcome}});await assertFails(batch.commit());
 }
 await forge(x=>{x.winner=0;x.winUnits=3800;},3800);await forge(x=>{x.winUnits=99999;},99999);await forge(x=>{x.selected=4;});await forge(x=>{x.seed=65536;});await forge(x=>{x.seed=-1;});await forge(x=>{x.roundId=randomUUID();});await forge(x=>{x.betUnits=250;});await forge(x=>{x.version=2;x.seed=65535;});await forge(x=>{x.version=4;});await forge(x=>{x.version=2;x.seed=0;x.winner=0;x.winUnits=3800;},3800);await forge(x=>{x.version=2;x.seed=0;x.winner=0;x.winUnits=5000;},5000);
});

test('Five-marble Race Rules pay the fifth participant 4.8x, deduplicate it and still honor old four-marble rounds',async()=>{
 const name='race-five-'+randomUUID(),c=await client(name,name);await c.call(request({action:'bootstrap'}));
 const id=randomUUID(),bet={action:'race',game:'race',bet:2.5,selected:4,seed:24,version:2,roundId:id,requestId:id};
 const a=await c.call(bet);assert.equal(a.player.balance,1009.5);assert.equal(a.outcome.winUnits,1200);assert.equal(a.outcome.winner,4);assert.equal((await c.call(bet)).replayed,true);
 const op=doc(c.db,'players',c.uid,'operations',id);await assertFails(updateDoc(op,{'result.outcome.version':1}));
 await new Promise(r=>setTimeout(r,750));const old=randomUUID();const legacy=await c.call({action:'race',game:'race',bet:2.5,selected:1,seed:21,roundId:old,requestId:old});assert.equal(legacy.outcome.winUnits,950);assert.equal(legacy.player.balance,1016.5);
});

test('Circus v4 Race Rules pay 4.8x winner and 19.2x exact pair, and reject forged pairs',async()=>{
 const name='race-v4-'+randomUUID(),c=await client(name,name);await c.call(request({action:'bootstrap'}));
 const pair=engine.race(2.5,0,22,'probe',4,1),w=pair.winner,s=pair.second;
 const id=randomUUID(),bet={action:'race',game:'race',bet:2.5,selected:w,selected2:s,seed:22,version:4,roundId:id,requestId:id};
 const a=await c.call(bet);assert.equal(a.outcome.winUnits,4800);assert.equal(a.player.balance,1000-2.5+48);assert.equal((await c.call(bet)).replayed,true);
 await new Promise(r=>setTimeout(r,750));const id2=randomUUID();const b=await c.call({...bet,selected2:-1,roundId:id2,requestId:id2});assert.equal(b.outcome.winUnits,1200);
 const ref=doc(c.db,'players',c.uid);
 for(const change of[x=>{x.second=(s+1)%5===w?(s+2)%5:(s+1)%5;x.selected2=x.second;},x=>{x.seed=640;},x=>{x.selected2=x.selected;},x=>{delete x.second;}]){
  await new Promise(r=>setTimeout(r,750));
  const old=(await getDoc(ref)).data(),roundId=randomUUID(),outcome=engine.race(2.5,w,22,roundId,4,s);change(outcome);
  const next={...old,settings:{...old.settings,raceBetIdx:1},balanceUnits:old.balanceUnits-250+4800,revision:old.revision+1,lastOperationId:roundId,updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp(),firstSpinAt:old.firstSpinAt??serverTimestamp()};
  const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',roundId),{action:'race',game:'race',selected:outcome.selected,fingerprint:'forged',betUnits:250,winUnits:4800,createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION,result:{game:'race',bet:2.5,balanceBefore:old.balanceUnits/100,balanceDebited:(old.balanceUnits-250)/100,outcome,baseBalance:next.balanceUnits/100}});await assertFails(batch.commit());
 }
});

 test('Gravity Race Rules validate physical finish tables, replay and reject invented winners',async()=>{
 const name='race-physics-'+randomUUID(),c=await client(name,name);await c.call(request({action:'bootstrap'}));
 const id=randomUUID(),winner=engine.race(2.5,0,21,id,3).winner,bet={action:'race',game:'race',bet:2.5,selected:winner,seed:21,version:3,roundId:id,requestId:id};
 const [a,b]=await Promise.all([c.call(bet),c.call(bet)]);assert.equal(a.outcome.version,3);assert.equal(a.outcome.winUnits,1200);assert.equal(a.player.balance,1009.5);assert.ok(a.replayed||b.replayed);
 const other=await client(name+'-second',name);assert.equal((await other.call(bet)).replayed,true);
 const ref=doc(c.db,'players',c.uid);await new Promise(r=>setTimeout(r,750));
 for(const change of[x=>{x.winner=(winner+1)%5;x.selected=x.winner;},x=>{x.seed=160;}]){
  const old=(await getDoc(ref)).data(),roundId=randomUUID(),outcome=engine.race(2.5,winner,21,roundId,3);change(outcome);
  const next={...old,settings:{...old.settings,raceBetIdx:1},balanceUnits:old.balanceUnits-250+1200,revision:old.revision+1,lastOperationId:roundId,updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp()};
  const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',roundId),{action:'race',game:'race',selected:outcome.selected,fingerprint:'forged',betUnits:250,winUnits:1200,createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION,result:{game:'race',bet:2.5,balanceBefore:old.balanceUnits/100,balanceDebited:(old.balanceUnits-250)/100,baseBalance:next.balanceUnits/100,outcome}});await assertFails(batch.commit());
 }
 });

test('recharge Rules preserve every paused game and prevent concurrent or replayed extra credit',async()=>{
 const name='recharge-paused-'+randomUUID(),c=await client(name),other=await client(name+'-other',name);
 await c.call(request({action:'bootstrap'}));const ref=doc(c.db,'players',c.uid);
 const fields=['neckRound','fingoRound','penaltyRound','clownRound','bounceRound','flyingRound','twentyOneRound'];
 for(const field of fields){
  // Legacy rounds are opaque to recharge: no progress may be rewritten or lost.
  const round={id:randomUUID(),betUnits:100000,step:1,phase:'player',popped:[2]};
  await environment.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'players',c.uid),{balanceUnits:25,[field]:round}));
  const recharge=request({action:'recharge'});
  const [a,b]=await Promise.all([c.call(recharge),other.call(request({action:'recharge'}))]);
  assert.equal(a.amount+b.amount,1000);assert.equal((await getDoc(ref)).data().balanceUnits,100025);
  assert.equal((await c.call(recharge)).player.balance,1000.25);
  assert.deepEqual((await getDoc(ref)).data()[field],round);
  assert.equal((await other.call(request({action:'recharge'}))).amount,0);
  await environment.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'players',c.uid),{balanceUnits:0}));
  const before=(await getDoc(ref)).data(),id=randomUUID(),batch=writeBatch(c.db);
  const next={...before,balanceUnits:before.balanceUnits+100000,[field]:null,revision:before.revision+1,lastOperationId:id,updatedAt:serverTimestamp()};
  batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',id),{action:'recharge',game:'home',selected:-1,fingerprint:'forged-clear-round',betUnits:0,winUnits:100000,result:{amount:1000,player:publicPlayer(next)},createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION});
  await assertFails(batch.commit());
 }
});

test('Home recharge Rules count daily confirmed clicks without duplicating replays or changing the daily gift',async()=>{
 const name='home-refill-'+randomUUID(),c=await client(name),other=await client(name+'-other',name);
 await c.call(request({action:'bootstrap'}));await c.call(request({action:'bonus'}));const ref=doc(c.db,'players',c.uid);
 const original=(await getDoc(ref)).data(),first=request({action:'recharge',source:'home'});
 const [a,b]=await Promise.all([c.call(first),other.call(first)]);
 assert.ok(a.replayed||b.replayed);assert.equal((await getDoc(ref)).data().balanceUnits,205000);assert.equal((await getDoc(ref)).data().rechargeCount,1);
 const [second,third]=await Promise.all([c.call(request({action:'recharge',source:'home'})),other.call(request({action:'recharge',source:'home'}))]);
 const current=(await getDoc(ref)).data();assert.equal(current.balanceUnits,405000);assert.equal(current.rechargeCount,3);
 assert.deepEqual(current.bonus,original.bonus);assert.equal(second.amount+third.amount,2000);
 assert.equal((await c.call(first)).player.rechargeCount,3);assert.equal((await c.call(request({action:'bonus'}))).amount,0);
 await assertFails(updateDoc(ref,{rechargeCount:0}));
 async function forge(changes,credit=100000){
  const old=(await getDoc(ref)).data(),id=randomUUID(),next={...old,balanceUnits:old.balanceUnits+credit,rechargeCount:old.rechargeCount+1,rechargeDaily:{...old.rechargeDaily,count:old.rechargeDaily.count+1},
   revision:old.revision+1,lastOperationId:id,updatedAt:serverTimestamp(),...changes};
  const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',id),{action:'recharge',game:'home',selected:-1,
   fingerprint:'forged-home-click',betUnits:0,winUnits:credit,result:{source:'home',amount:credit/100,count:next.rechargeCount},createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION});
  await assertFails(batch.commit());
 }
 await forge({rechargeCount:99});await forge({},200000);await forge({bonus:{day:null,dayIndex:-1,streak:0}});
 await assertFails(updateDoc(ref,{rechargeDaily:{...current.rechargeDaily,count:0}}));
 await c.call(request({action:'recharge',source:'home'}));
 const sixth=request({action:'recharge',source:'home'});
 const last=await Promise.all([c.call(request({action:'recharge',source:'home'})),other.call(sixth)]);
 assert.equal(last[0].amount+last[1].amount,2000);
 const uncapped=(await getDoc(ref)).data();assert.equal(uncapped.rechargeDaily.count,6);assert.equal(uncapped.balanceUnits,705000);
 assert.equal((await other.call(sixth)).replayed,true);assert.equal((await getDoc(ref)).data().balanceUnits,705000);
 await forge({rechargeDaily:{...uncapped.rechargeDaily,count:1}});
 await forge({rechargeDaily:{dayIndex:uncapped.rechargeDaily.dayIndex+1,count:1}});
 assert.equal((await c.call(first)).player.rechargeDaily.count,6);
 await environment.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'players',c.uid),{rechargeDaily:{dayIndex:uncapped.rechargeDaily.dayIndex-1,count:6}}));
 const renewed=await c.call(request({action:'recharge',source:'home'}));
 assert.equal(renewed.player.rechargeDaily.count,1);assert.equal(renewed.player.rechargeCount,7);
});

test('Flying Happeach v7 persists protection, rejects forged saves and pays a protected fall exactly once',async()=>{
 let roll=0;const name='flying-protected-'+randomUUID(),c=await client(name,name,{rng:()=>roll});
 await c.call(request({action:'bootstrap'}));const ref=doc(c.db,'players',c.uid),roundId=randomUUID();
 const base={action:'flying',game:'flying',bet:10,roundId};
 await c.call({...base,requestId:roundId,move:'pop',step:0,selected:0});
 await new Promise(r=>setTimeout(r,350));
 async function forge(change){
  const old=(await getDoc(ref)).data(),id=randomUUID(),outcome=engine.flying(10,old.flyingRound,'pop',roundId,1,()=>0);
  change(outcome);const round={id:roundId,betUnits:1000,step:outcome.step,popped:outcome.popped,
   ladderVersion:outcome.ladderVersion,peachAt:outcome.peachAt,savedUnits:outcome.savedUnits};
  const next={...old,flyingRound:round,balanceUnits:old.balanceUnits+outcome.winUnits,revision:old.revision+1,
   lastOperationId:id,updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp()};
  const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',id),{
   action:'flying',game:'flying',selected:1,fingerprint:'forged-guarantee',betUnits:0,winUnits:outcome.winUnits,
   createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION,result:{game:'flying',bet:10,
    balanceBefore:990,balanceDebited:990,baseBalance:next.balanceUnits/100,outcome}});
  await assertFails(batch.commit());
 }
 await forge(x=>x.savedUnits=999999);await forge(x=>x.peachAt=3);await forge(x=>x.ladderVersion=1);
 const x=await c.call(request({...base,move:'pop',step:1,selected:1}));
 assert.equal(x.player.flyingRound.savedUnits,1500);assert.equal(x.player.balance,990);
 const second=await client(name+'-other',name,{rng:()=>.99});
 assert.deepEqual((await second.call(request({action:'bootstrap'}))).player.flyingRound,x.player.flyingRound);
 await new Promise(r=>setTimeout(r,350));roll=.99;const loss=request({...base,move:'pop',step:2,selected:2});
 const [a,b]=await Promise.all([c.call(loss),second.call(loss)]);
 assert.ok(a.replayed||b.replayed);assert.equal(a.player.balance,1005);assert.equal(b.player.balance,1005);
 assert.equal(a.outcome.ok,false);assert.equal(a.outcome.winUnits,1500);assert.equal(a.player.flyingRound,null);
 assert.equal((await second.call(loss)).replayed,true);
 await assert.rejects(c.call(request({...base,move:'collect',step:2,selected:-1})),{code:'king-rico/round-conflict'});
});
test('Flying v7 can finish an already-paid legacy round without changing its payout schema',async()=>{
 const name='flying-legacy-'+randomUUID(),c=await client(name);await c.call(request({action:'bootstrap'}));
 const roundId=randomUUID();await environment.withSecurityRulesDisabled(ctx=>updateDoc(doc(ctx.firestore(),'players',c.uid),{
  balanceUnits:99000,flyingRound:{id:roundId,betUnits:1000,step:2,popped:[4,8]}}));
 const x=await c.call(request({action:'flying',game:'flying',bet:10,roundId,move:'collect',step:2,selected:-1}));
 assert.equal(x.player.balance,1005);assert.equal('savedUnits' in x.outcome,false);
});
