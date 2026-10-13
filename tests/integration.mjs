import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {initializeApp,deleteApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,GoogleAuthProvider,signInWithCredential,signOut} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator,doc,getDoc,setDoc,updateDoc,deleteDoc,writeBatch,serverTimestamp} from 'firebase/firestore';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {createGameStore} from '../cloud/store.mjs';
const apps=[];let environment;
before(async()=>{
  environment=await initializeTestEnvironment({projectId:'demo-king-rico',firestore:{host:'127.0.0.1',port:8085,rules:await readFile('firestore.rules','utf8')}});
});
after(async()=>{await Promise.all(apps.map(deleteApp));await environment?.cleanup();});
const request=data=>({requestId:randomUUID(),...data});
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
