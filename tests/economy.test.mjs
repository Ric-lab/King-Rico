import test from 'node:test';
import assert from 'node:assert/strict';
import engine from '../cloud/engine.cjs';
import {slotMath} from '../scripts/economy-math.mjs';
import {wheelMath,clownMath,ladderMath,fingoMath,cardSimulation} from '../scripts/economy-audit.mjs';

test('Circus has 98% theoretical RTP including five lines, full boards and Happeach minimum',()=>{
  const x=slotMath();assert.ok(Math.abs(x.rtp-.98)<1e-10,JSON.stringify(x));
  assert.ok(x.featureEvery>65 && x.featureEvery<75);
  assert.ok(slotMath({...engine,FEAT_MIN:100}).rtp>1,'Audit must detect a payout regression');
});
test('Wheel, Clown and stopping ladders keep 98% across all legal stakes and choices',()=>{
  for(const bet of engine.BETS){
    for(let selected=0;selected<13;selected++)assert.ok(Math.abs(wheelMath(bet,selected).rtp-.98)<1e-10);
    for(let selected=0;selected<6;selected++)assert.ok(Math.abs(clownMath(bet,selected).rtp-.98)<3e-8);
    for(const game of ['penalty'])for(const floor of ladderMath(game,bet))assert.ok(Math.abs(floor.rtp-.98)<3e-8);
    assert.ok(Math.abs(fingoMath(bet).rtp-.98)<.0001);
  }
  assert.ok(Math.abs(wheelMath(10,1).prizeRate-.39)<1e-12);
});
test('Clown never changes odds from lifetime wins, previous misses or wallet history',()=>{
  for(const stats of [{betUnits:0,winUnits:0},{betUnits:1000000,winUnits:2000000},{betUnits:1000000,winUnits:0}]){
    const x=engine.clown(10,null,'r',0,stats,()=>.99);
    assert.equal(x.hit,-1);assert.equal(x.sumUnits,0);
    assert.deepEqual(engine.clown(10,null,'r',4,stats,()=>.05),engine.clown(10,null,'r',4,undefined,()=>.05));
  }
});
function peachGrid(count){
  const draws=[...Array(count).fill(0),...Array.from({length:9-count},()=>[.99,.2]).flat()];
  return ()=>draws.length?draws.shift():.99;
}
test('Happeach averages contributing stakes, carries a sixth symbol and preserves legacy counters',()=>{
  let x=engine.slot(1,0,peachGrid(2));assert.deepEqual(x.peachBank,{count:2,units:200});
  x=engine.slot(1,2,peachGrid(2),x.peachBank);assert.deepEqual(x.peachBank,{count:4,units:400});
  x=engine.slot(1000,4,peachGrid(2),x.peachBank);
  assert.equal(x.feature.bet,200.8);assert.equal(x.feature.res.win,2008);
  assert.deepEqual(x.peachBank,{count:1,units:100000});
  const next=engine.slot(1,1,peachGrid(1),x.peachBank);assert.deepEqual(next.peachBank,{count:2,units:100100});
  const equal=engine.slot(2.5,4,peachGrid(1),{count:4,units:1000});assert.equal(equal.feature.bet,2.5);
  assert.equal(engine.slot(2.5,4,peachGrid(1)).feature.bet,2.5);
  // A legacy open client may change the counter without knowing the optional bank.
  assert.equal(engine.slot(2.5,4,peachGrid(1),{count:2,units:200}).feature.bet,2.5);
});
test('Fingo always leaves a losing pipe and a sampled miss remains a miss',()=>{
  const rolled=engine.fingoLegacy(10,null,'roll','r',undefined,()=>0);
  assert.ok(rolled.slots.some((n,c)=>n!==rolled.targets[c]));
  const lost=engine.fingoLegacy(10,rolled,'drop','r',0,()=>.99);
  assert.deepEqual(lost.marks,Array(5).fill(false));assert.equal(lost.winUnits,0);
});
test('33 reference strategy is near 98% over reproducible hands, with wins and losses',()=>{
  const x=cardSimulation(100000,28,326729);
  assert.ok(x.rtp>.965 && x.rtp<.995,JSON.stringify(x));
  assert.ok(x.winRate>.4 && x.winRate<.5);assert.ok(x.winRate+x.pushRate<.6);
});


test('session pacing makes common Circus payouts profitable and Fingo completion more frequent',()=>{
  assert.equal(engine.evaluate([1,1,1,2,3,4,5,6,7],10).win,12);
  const modern=fingoMath(),legacy=fingoMath(10,1);
  assert.ok(modern.prizeRate>.49&&modern.prizeRate<.51,JSON.stringify(modern));
  assert.ok(legacy.prizeRate>.27&&legacy.prizeRate<.28,JSON.stringify(legacy));
  assert.ok(Math.abs(modern.rtp-.98)<1e-10);
  assert.ok(wheelMath(10,1).prizeRate>.38&&wheelMath(10,0).prizeRate<.04);
});
test('Fingo keeps paid legacy cards and makes the advertised top prize attainable',()=>{
  const targets=[1,16,31,46,61],base={betUnits:1000,targets,marks:[true,true,true,true,false],used:4,slots:targets};
  const old=engine.fingo(10,base,'drop','old',4,()=>0);
  const modern=engine.fingo(10,{...base,payoutVersion:2},'drop','new',4,()=>0);
  assert.equal(old.winUnits,25000);assert.equal(old.payoutVersion,undefined);
  assert.equal(modern.winUnits,50000);assert.equal(modern.payoutVersion,2);
  assert.equal(engine.fingo(10,base,'drop','old',4,()=>.13).marks[4],false);
  assert.equal(engine.fingo(10,{...base,payoutVersion:2},'drop','new',4,()=>.13).marks[4],true);
});
