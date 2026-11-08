import test from 'node:test';
import assert from 'node:assert/strict';
import {flightValue} from '../ui/park/bigwin-flight.js';
test('Flight reveals the committed win monotonically without changing its final value',()=>{
 for(const [bet,total] of [[1,5],[2.5,33.3],[10,200],[1000,2664000]]){
  let last=0;
  for(let i=0;i<=100;i++){const value=flightValue(total,bet,i/100);assert.ok(value.amount>=last&&value.amount<=total);last=value.amount;}
  assert.deepEqual(flightValue(total,bet,1),{multiple:total/bet,amount:total});
  assert.equal(flightValue(total,bet,100).amount,total);
 }
});

import {boardingPose} from '../ui/park/king-boarding.js';
test('Boarding uses the original drawn crouch, rise, peak, fall and landing poses',()=>{
 assert.deepEqual([-.1,.05,.3,.7,.95].map(p=>boardingPose(p).frame),['crouch2','cheerRise','cheer','cheerFall','land']);
 assert.ok(boardingPose(-.1).sy<1);assert.ok(boardingPose(.05).sy>1);
 assert.ok(boardingPose(.92).sy<1);assert.equal(boardingPose(1).sy,1);
});
