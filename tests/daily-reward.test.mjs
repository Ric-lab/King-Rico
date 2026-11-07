import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyGift} from '../ui/park/daily-reward.js';

test('Scratch uses the saved daily sequence, resets gaps and never offers an already paid day',()=>{
 assert.equal(dailyGift(null,20261107),null);
 assert.equal(dailyGift({bonus:{day:'2026-11-07',streak:1}},20261107),null);
 assert.deepEqual(dailyGift({bonus:{day:null,streak:0}},20261107),{today:'2026-11-07',day:1,amount:50});
 for(const [streak,amount] of [[1,100],[2,150],[3,200],[4,250],[5,500],[6,1000],[7,50]])
  assert.equal(dailyGift({bonus:{day:'2026-11-06',streak}},20261107).amount,amount);
 assert.equal(dailyGift({bonus:{day:'2026-11-05',streak:6}},20261107).amount,50);
 assert.equal(dailyGift({bonus:{day:'2026-10-31',streak:1}},20261101).amount,100);
});
