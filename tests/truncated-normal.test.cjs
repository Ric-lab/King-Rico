const test=require('node:test'),assert=require('node:assert/strict');
const {boundedNormalInt}=require('../cloud/truncated-normal.cjs');
test('bounded bell distribution concentrates in the middle with rare edges',()=>{
 let seed=77413;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32),counts=[0,0,0];
 for(let n=0;n<100000;n++)counts[boundedNormalInt(1,3,rng)-1]++;
 assert.ok(counts[1]>94000&&counts[1]<96000,counts);assert.ok(counts[0]>1500&&counts[0]<3000,counts);assert.ok(counts[2]>1500&&counts[2]<3000,counts);
});
test('integer sampler is bounded, deterministic at a single available value and cannot hang',()=>{
 assert.equal(boundedNormalInt(0,0,()=>{throw Error('Must not draw');}),0);
 for(const draw of[0,1,.5]){const v=boundedNormalInt(50,300,()=>draw);assert.ok(v>=50&&v<=300);}
 assert.throws(()=>boundedNormalInt(4,1,Math.random));
});
