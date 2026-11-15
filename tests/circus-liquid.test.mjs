import test from 'node:test';
import assert from 'node:assert/strict';
import {nextPourLevel} from '../ui/park/motion.js';
test('successive pours continue after the old two-pour ceiling, without completing the meter',()=>{
 let shown=3;const levels=[];
 for(let n=0;n<12;n++){const next=nextPourLevel(3,3,shown);assert.equal(next.from,shown);assert.ok(next.show>shown&&next.show<4);shown=next.show;levels.push(shown);}
 assert.ok(levels[4]>levels[3]);assert.ok(levels[11]-levels[10]>0);
 assert.deepEqual(nextPourLevel(3,4,shown),{from:shown,show:4});
 assert.equal(nextPourLevel(9,9,9.95).show<10,true);
 assert.deepEqual(nextPourLevel(9,10,9.95),{from:9.95,show:10});
 assert.deepEqual(nextPourLevel(10,0,10),{from:0,show:0});
});
