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
