import test from 'node:test';
import assert from 'node:assert/strict';
import engine from '../cloud/engine.cjs';
import {previewSymbols,withControllerDraw} from '../prototypes/circus-preview/controller-symbol.mjs';
test('controller draws belong only to the test wallet and preserve production weights',()=>{
 const before=structuredClone(engine.slotSymbols(6));
 assert.equal(before[15].w,0);assert.equal(before[15].active,false);
 const symbols=previewSymbols(),total=symbols.reduce((n,s)=>n+s.w,0);
 const middle=(symbols.slice(0,15).reduce((n,s)=>n+s.w,0)+symbols[15].w/2)/total;
 assert.equal(withControllerDraw(()=>engine.pick((()=>{let i=0;return()=>i++%2===0?.99:middle})(),6)),15);
 assert.deepEqual(engine.slotSymbols(6),before);
 assert.throws(()=>withControllerDraw(()=>{throw Error('interrupted');}),/interrupted/);
 assert.deepEqual(engine.slotSymbols(6),before);
 // A controller line is a reserved special, never an invisible cash payout.
 assert.equal(engine.evaluate([15,15,15,0,2,6,7,8,10],10,6).win,0);
});
test('normal preview randomness includes individual controllers without forcing trincas',()=>{
 let seed=97531;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 let count=0,scattered=0;
 withControllerDraw(()=>{for(let n=0;n<2000;n++){const grid=Array.from({length:9},()=>engine.pick(rng,6)),hits=grid.filter(s=>s===15).length;count+=hits;if(hits===1)scattered++;}});
 assert.ok(count>500&&count<1300,count);assert.ok(scattered>300,scattered);
 assert.equal(engine.slotSymbols(6)[15].w,0);
});
test('test-wallet receipt records the controller draw once without paying an undefined bonus',async()=>{
 const {createPreview}=await import('../prototypes/circus-preview/model.mjs');
 const {randomUUID}=await import('node:crypto');
 const symbols=previewSymbols(),total=symbols.reduce((n,s)=>n+s.w,0);
 const grid=[15,15,15,0,2,6,7,8,10];
 const draws=[.99,...grid.flatMap(s=>[.99,(symbols.slice(0,s).reduce((n,x)=>n+x.w,0)+symbols[s].w/2)/total])];
 const model=createPreview({},()=>draws.shift()??.99);
 await model.run({action:'state'});
 const request={action:'spin',game:'circus',bet:10,requestId:randomUUID(),slotVersion:6,previewControllerEnabled:true};
 const a=await model.run(request),b=await model.run(request);
 assert.deepEqual(a.outcome.grid,grid);assert.equal(a.outcome.winUnits,0);
 assert.equal(a.player.balance,4990);assert.equal(b.player.balance,a.player.balance);
 assert.equal(b.replayed,true);assert.equal(a.park.spins,1);assert.equal(b.park.spins,1);
 assert.equal(engine.slotSymbols(6)[15].w,0);
});
