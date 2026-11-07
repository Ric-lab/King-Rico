import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyGift,scratchGrid} from '../ui/park/daily-reward.js';

test('Scratch uses the saved daily sequence, resets gaps and never offers an already paid day',()=>{
 assert.equal(dailyGift(null,20261107),null);
 assert.equal(dailyGift({bonus:{day:'2026-11-07',streak:1}},20261107),null);
 assert.deepEqual(dailyGift({bonus:{day:null,streak:0}},20261107),{today:'2026-11-07',day:1,amount:50});
 for(const [streak,amount] of [[1,100],[2,150],[3,200],[4,250],[5,500],[6,1000],[7,50]])
  assert.equal(dailyGift({bonus:{day:'2026-11-06',streak}},20261107).amount,amount);
 assert.equal(dailyGift({bonus:{day:'2026-11-05',streak:6}},20261107).amount,50);
 assert.equal(dailyGift({bonus:{day:'2026-10-31',streak:1}},20261101).amount,100);
});


test('Scratch layout has exactly nine cells, six misses and three matching prize cells',()=>{
 let seed=701;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),layouts=new Set();
 for(let i=0;i<100;i++){
  const grid=scratchGrid(random);assert.equal(grid.length,9);
  assert.equal(grid.filter(Boolean).length,3);assert.equal(grid.filter(v=>v===false).length,6);
  layouts.add(JSON.stringify(grid));
 }
 assert.ok(layouts.size>1,'Prize positions must vary between cards');
});
