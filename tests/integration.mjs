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
  assert.ok(paid.replayed || replay.replayed);assert.equal(paid.player.balance,1000.75);assert.equal(paid.player.penaltyRound,null);
  assert.equal((await c.call(shot)).replayed,true);
  assert.equal((await getDoc(ref)).data().balanceUnits,100075);
  await assert.rejects(c.call(request({...base,move:'collect',step:1,quality:0})),{code:'king-rico/round-conflict'});
  await assertFails(updateDoc(doc(c.db,'players',c.uid,'operations',collect.requestId),{winUnits:99999}));
  assert.equal((await other.call(request({action:'bootstrap'}))).player.peaches,2);
});
test('Penalty Rules validate losses, all five steps, automatic prize and blocked recharge',async()=>{
  const identity='penalty-final-'+randomUUID(),c=await client(identity,identity,{rng:()=>0});
  await c.call(request({action:'bootstrap'}));
  const ref=doc(c.db,'players',c.uid),roundId=randomUUID();
  const base={action:'penalty',game:'penalty',bet:1000,roundId,move:'shoot',quality:1000};
  for(let step=0;step<5;step++) {
    const shot={...base,step,requestId:step===0?roundId:randomUUID()},result=await c.call(shot);
    assert.equal(result.player.balance,step===4?10000:0);assert.equal((await c.call(shot)).replayed,true);
    if(step===0) assert.equal((await c.call(request({action:'recharge'}))).reason,'penalty-round');
    await new Promise(resolve=>setTimeout(resolve,350));
  }
  const id=randomUUID(),miss={...base,requestId:id,roundId:id,step:0,quality:0};
  const loss=await c.call(miss);assert.equal(loss.player.balance,9000);assert.equal(loss.player.penaltyRound,null);
  assert.equal((await c.call(miss)).replayed,true);
  assert.equal((await getDoc(ref)).data().balanceUnits,900000);
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
      penaltyRound:x.ended?null:{id:x.roundId,betUnits:x.betUnits,step:x.step},...profileChanges};
    const batch=writeBatch(c.db);batch.set(ref,next);
    batch.set(doc(c.db,'players',c.uid,'operations',id),{action:'penalty',game:'penalty',selected:-1,fingerprint:'forged',betUnits:0,
      winUnits:x.winUnits,createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION,
      result:{game:'penalty',bet:x.betUnits/100,balanceBefore:old.balanceUnits/100,balanceDebited:old.balanceUnits/100,
        baseBalance:next.balanceUnits/100,player:publicPlayer(next),outcome:x}});
    await assertFails(batch.commit());
  }
  await forged({step:4});await forged({betUnits:1000});await forged({quality:0});
  await forged({winUnits:99999,ended:true});await forged({}, {peaches:4});
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
test('Fingo Rules settle the final ball and forbid recharge while the exhausted wallet has a round',async()=>{
  const name='fingo-last-'+randomUUID(),c=await client(name,name,{rng:()=>0});
  await c.call(request({action:'bootstrap'}));
  const ref=doc(c.db,'players',c.uid),targets=[1,16,31,46,61],roundId=randomUUID();
  async function seed(marks) {
    await environment.withSecurityRulesDisabled(context=>updateDoc(doc(context.firestore(),'players',c.uid),{
      balanceUnits:0,lastSpinAt:null,fingoRound:{id:roundId,betUnits:250,targets,marks,used:20,slots:targets}}));
  }
  await seed([true,true,true,true,false]);
  assert.equal((await c.call(request({action:'recharge'}))).reason,'fingo-round');
  const last=request({action:'fingo',game:'fingo',bet:2.5,roundId,move:'drop',used:20,selected:4});
  const paid=await c.call(last);assert.equal(paid.outcome.winUnits,100);assert.equal(paid.player.balance,1);assert.equal(paid.player.fingoRound,null);
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
  const blocked=await c.call(request({action:'recharge'}));
  assert.equal(blocked.amount,0);assert.equal(blocked.reason,'neck-round');
  await forged();
  await seed({neckRound:null});
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

test('Bounce Rules persist the wager/checkpoint, reject forged progress and pay exactly once',async()=>{
 const identity='bounce-'+randomUUID(),c=await client(identity);await c.call(request({action:'bootstrap'}));
 const roundId=randomUUID(),base={action:'bounce',game:'bounce',bet:2.5,roundId},start={...base,requestId:roundId,move:'start',step:0};
 const [a,b]=await Promise.all([c.call(start),c.call(start)]);assert.equal(a.player.balance,997.5);assert.ok(a.replayed||b.replayed);
 const other=await client(identity+'-device',identity);assert.equal((await other.call(request({action:'bootstrap'}))).player.bounceRound.step,0);
 const ref=doc(c.db,'players',c.uid);
 await assertFails(updateDoc(ref,{bounceRound:null,revision:2,updatedAt:serverTimestamp()}));
 await new Promise(r=>setTimeout(r,300));
 const land=request({...base,move:'land',step:0});await c.call(land);assert.equal((await c.call(land)).replayed,true);
 await assert.rejects(other.call(request({...base,move:'land',step:0})),{code:'king-rico/round-conflict'});
 async function forged(changes={},profileChanges={}) {
   const old=(await getDoc(ref)).data(),id=randomUUID(),r=old.bounceRound;
   const x={move:'collect',roundId,betUnits:250,step:1,guardStep:0,ended:true,winUnits:275,...changes};
   const next={...old,balanceUnits:old.balanceUnits+x.winUnits,bounceRound:null,revision:old.revision+1,lastOperationId:id,
     updatedAt:serverTimestamp(),lastSpinAt:serverTimestamp(),...profileChanges};
   const batch=writeBatch(c.db);batch.set(ref,next);batch.set(doc(c.db,'players',c.uid,'operations',id),{
     action:'bounce',game:'bounce',selected:-1,fingerprint:'forged',betUnits:0,winUnits:x.winUnits,createdAt:serverTimestamp(),rulesVersion:engine.RULES_VERSION,
     result:{game:'bounce',bet:x.betUnits/100,balanceBefore:old.balanceUnits/100,balanceDebited:old.balanceUnits/100,baseBalance:next.balanceUnits/100,player:publicPlayer(next),outcome:x}});
   await assertFails(batch.commit());
 }
 await forged({step:4,winUnits:350});await forged({winUnits:99999});await forged({betUnits:1000});await forged({guardStep:1});await forged({}, {peaches:3});
 const collect=request({...base,move:'collect',step:1}),[paid,replay]=await Promise.all([c.call(collect),other.call(collect)]);
 assert.equal(paid.player.balance,1000.25);assert.equal(paid.player.bounceRound,null);assert.ok(paid.replayed||replay.replayed);
 assert.equal((await c.call(start)).replayed,true);assert.equal((await getDoc(ref)).data().balanceUnits,100025);
});
test('Bounce Rules keep the first golden guarantee and block refill until the round ends',async()=>{
 const {default:bounce}=await import('../cloud/bounce.cjs');let roundId;do{roundId=randomUUID();}while(!bounce.track(roundId,2)[2].gold);
 const c=await client('bounce-gold-'+randomUUID());await c.call(request({action:'bootstrap'}));
 const base={action:'bounce',game:'bounce',bet:1000,roundId};await c.call({...base,requestId:roundId,move:'start',step:0});
 assert.equal((await c.call(request({action:'recharge'}))).reason,'bounce-round');
 for(let step=0;step<2;step++){await new Promise(r=>setTimeout(r,300));await c.call(request({...base,move:'land',step}));}
 const fall=request({...base,move:'fall',step:2}),paid=await c.call(fall);assert.equal(paid.player.balance,1200);assert.equal((await c.call(fall)).replayed,true);
 assert.equal((await c.call(request({action:'recharge'}))).amount,0);
});
