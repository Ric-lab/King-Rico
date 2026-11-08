import test from 'node:test';
import assert from 'node:assert/strict';
import {flightValue,flightAltitude} from '../ui/park/bigwin-flight.js';
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
