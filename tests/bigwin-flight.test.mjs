import test from 'node:test';
import assert from 'node:assert/strict';
import {flightValue,flightAltitude,flightCurve} from '../ui/park/bigwin-flight.js';
test('Flight reveals the committed win monotonically without changing its final value',()=>{
 for(const [bet,total] of [[1,5],[2.5,33.3],[10,200],[1000,2664000]]){
  let last=0;
  for(let i=0;i<=100;i++){const value=flightValue(total,bet,i/100);assert.ok(value.amount>=last&&value.amount<=total);last=value.amount;}
  assert.deepEqual(flightValue(total,bet,1),{multiple:total/bet,amount:total});
  assert.equal(flightValue(total,bet,100).amount,total);
 }
});

import {boardingPose,celebrationPose} from '../ui/park/king-boarding.js';
test('Boarding keeps original takeoff poses and turns sideways before cockpit landing',()=>{
 assert.deepEqual([-.1,.05,.3,.7,.95].map(p=>boardingPose(p).frame),['crouch2','cheerRise','cheer','cheerFall','pilotSide']);
 assert.ok(boardingPose(-.1).sy<1);assert.ok(boardingPose(.05).sy>1);
 assert.ok(boardingPose(.92).sy<1);assert.equal(boardingPose(1).sy,1);
});

test('Approach keeps celebrating and larger wins climb to higher atmosphere without changing payouts',()=>{
 assert.ok(new Set([50,300,650,850,1100].map(t=>celebrationPose(t).frame)).size>=4);
 assert.ok(celebrationPose(400).lift>0);
 assert.equal(flightAltitude(5,1),0);assert.ok(flightAltitude(20,1)>.3);assert.equal(flightAltitude(200,1),1);
 for(const m of [5,20,200])assert.ok(flightAltitude(m,.3)<=flightAltitude(m,.9));
});

test('Flight heading follows its ascending curve and trail ends at the aircraft anchor',()=>{
 for(const width of [320,390,430]){
  const sx=width*.52,sy=420;
  assert.ok(Math.abs(flightCurve(width,844,sx,sy,0).x-sx)<1e-8);
  assert.ok(Math.abs(flightCurve(width,844,sx,sy,0).y-sy)<1e-8);
  for(const p of [.1,.5,.9]){
   const pose=flightCurve(width,844,sx,sy,p),next=flightCurve(width,844,sx,sy,p+.00001);
   const tangent=Math.atan2(next.y-pose.y,next.x-pose.x)*180/Math.PI;
   assert.ok(pose.angle<-30&&pose.angle>-90);
   assert.ok(Math.abs(tangent-pose.angle)<.01);
   assert.ok(pose.path.endsWith(`${pose.x} ${pose.y}`));
  }
 }
});
