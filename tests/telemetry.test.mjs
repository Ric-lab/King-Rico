import test from 'node:test';
import assert from 'node:assert/strict';
import {createTelemetry,eventParams} from '../cloud/telemetry.mjs';
const data={sessionId:'12345678-1234-4234-8234-123456789012',game:'wheel'};
const nextTurn=()=>new Promise(resolve=>setImmediate(resolve));
function fake() {
  const logs=[];let initialized=0;
  const sdk={isSupported:async()=>true,initializeAnalytics:()=>{initialized++;return {};},
    setConsent:()=>{},setUserId:()=>{},setAnalyticsCollectionEnabled:()=>{},logEvent:(_,name,params)=>logs.push({name,params})};
  return {logs,sdk,get initialized(){return initialized;}};
}
test('analytics stays uninitialized without consent; opt-out drops queued events',async()=>{
  const f=fake(),t=createTelemetry({}, {firebase:{measurementId:'G-TEST'}},f.sdk);
  t.sync({analyticsConsent:false},'one');t.track('screen_viewed',data);await nextTurn();
  assert.equal(f.initialized,0);assert.equal(f.logs.length,0);
  t.sync({analyticsConsent:true},'one');t.track('screen_viewed',data);await nextTurn();
  assert.equal(f.initialized,1);assert.equal(f.logs.length,1);
  t.sync({analyticsConsent:false},'one');t.track('screen_viewed',data);assert.equal(f.logs.length,1);
});
test('switching accounts during analytics initialization discards previous account events',async()=>{
  const f=fake();let supported;f.sdk.isSupported=()=>new Promise(resolve=>supported=resolve);
  const t=createTelemetry({}, {firebase:{measurementId:'G-TEST'}},f.sdk);
  t.sync({analyticsConsent:true},'one');t.track('screen_viewed',data);
  t.sync(null,null);supported(true);await nextTurn();assert.equal(f.logs.length,0);assert.equal(f.initialized,0);
});
test('demo emulators never send analytics and free-text personal fields are rejected',async()=>{
  const f=fake(),t=createTelemetry({}, {firebase:{measurementId:'G-TEST'},emulators:{host:'127.0.0.1'}},f.sdk);
  t.sync({analyticsConsent:true},'one');t.track('screen_viewed',data);await nextTurn();assert.equal(f.initialized,0);
  assert.equal(eventParams('screen_viewed',{...data,email:'someone@example.test'}),null);
  assert.equal(eventParams('client_error',{...data,errorCode:'a free-text stack trace'}),null);
  assert.equal(eventParams('engagement',{...data,seconds:1000}),null);
  assert.ok(eventParams('spin_settled',{...data,bet:2.5,payout:83.25,specialRound:false}));
  assert.ok(eventParams('neck_step',{...data,game:'neck',move:'climb',floor:6,success:true}));
  assert.equal(eventParams('neck_step',{...data,game:'neck',move:'climb',floor:34,success:true}),null);
  assert.ok(eventParams('fingo_step',{...data,game:'fingo',move:'drop',ballsUsed:30,success:true}));
  assert.equal(eventParams('fingo_step',{...data,game:'fingo',move:'drop',ballsUsed:31}),null);
  assert.equal(eventParams('fingo_step',{...data,game:'fingo',move:'collect',ballsUsed:1}),null);
});
