const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=require('../cloud/engine.cjs'),cards=require('../cloud/twenty-one.cjs'),{rngFor}=require('./helpers/twenty-one.cjs');
const start=prefix=>{const x=engine.twentyOne(2.5,null,'start','round',rngFor(prefix));return x.round.phase==='dealer'?engine.twentyOne(2.5,x.round,'dealer','round'):x;};
test('21 deals a real 52-card permutation and automatically adjusts aces',()=>{
 const x=start([0,4,13,6]);assert.equal(new Set(x.round.deck).size,52);assert.equal(cards.total(x.round.player),12);
 assert.equal(cards.total([0,13,8]),21);assert.equal(cards.total([0,5,9]),17);
});
test('21 pays a natural at 2.5x including the stake; bank checks before the player acts',()=>{
 let x=start([0,8,9,7]);assert.equal(x.ended,true);assert.equal(x.winUnits,625);assert.equal(x.round.result.reason,'natural');
 x=start([8,0,7,9]);assert.equal(x.round.result.reason,'dealer-21');assert.equal(x.winUnits,0);
 x=start([0,13,9,22]);assert.equal(x.round.result.outcome,'push');assert.equal(x.winUnits,250);
});
test('21 stands on soft 17 and three-card 21 earns an ordinary win',()=>{
 let x=start([9,0,4,5,18]);x=engine.twentyOne(2.5,x.round,'hit','round');assert.equal(x.round.phase,'dealer');
 x=engine.twentyOne(2.5,x.round,'dealer','round');assert.equal(x.round.dealer.length,2);assert.equal(x.winUnits,500);
});
test('21 bust settles the lost stake without another bank draw',()=>{
 let x=start([9,8,7,6,22]);x=engine.twentyOne(2.5,x.round,'hit','round');assert.equal(x.round.result.reason,'player-bust');assert.equal(x.winUnits,0);assert.equal(x.round.dealer.length,2);
});
test('Flying preserves all ten multipliers and the 95% step schedule',()=>{
 assert.deepEqual(engine.FLYING_MULTIPLIERS,[1.2,1.5,2,2.5,3,4,5,8,12,20]);
 assert.equal(engine.flying(2.5,null,'pop','round',0,()=>.79).ok,true);
 assert.equal(engine.flying(2.5,null,'pop','round',0,()=>.8).ok,false);
 let r=null;
 for(let i=0;i<10;i++){
  const x=engine.flying(2.5,r,'pop','round',i,()=>0);assert.equal(x.step,i+1);assert.equal(x.popped.length,i+1);
  assert.equal(x.winUnits,i===9?5000:0);r={id:x.roundId,betUnits:x.betUnits,step:x.step,popped:x.popped};
 }
 assert.equal(engine.flying(2.5,{betUnits:250,step:1,popped:[0]},'collect','round',-1,()=>{throw Error('No redraw');}).winUnits,300);
});
