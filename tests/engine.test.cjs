const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const engine = require('../cloud/engine.cjs');
const source=fs.readFileSync(path.join(__dirname,'../Fortune Circus.dc.html'),'utf8');
const methods=source.slice(source.indexOf('  lineSymbol(g, line) {'),source.indexOf('  countUp(total, title, modal) {'));
const symbols=vm.runInNewContext('('+source.match(/const SYMBOLS = (\[[\s\S]*?\]);/)[1]+')');
const reference=vm.runInNewContext(`new (class {${methods}})()`,{
  SYMBOLS:symbols,WILD:9,PEACH:11,PEACH_PAY:25,LINES:engine.LINES
});
const plain=value=>JSON.parse(JSON.stringify(value));
function seeded(seed=17843){ return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;}; }
test('Fingo preserves the design table and settles the five-number game by balls used',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../Fortune Fingo.dc.html'),'utf8');
  assert.deepEqual(plain(vm.runInNewContext(source.match(/const TRIO = (\[[^\]]+\])/)[1])),engine.FINGO_MULTIPLIERS);
  assert.equal(Number(source.match(/BALLS = (\d+)/)[1]),engine.FINGO_BALLS);
  assert.equal(Number(source.match(/HIT = ([.\d]+)/)[1]),engine.FINGO_HIT);
  let previous=null;
  for(let used=0;used<5;used++) {
    const rolled=engine.fingo(2.5,previous,'roll','round',undefined,()=>0);
    assert.equal(rolled.winUnits,0);assert.equal(rolled.used,used);
    const drop=engine.fingo(2.5,rolled,'drop','round',used,()=>0);
    assert.equal(drop.used,used+1);assert.equal(drop.marks[used],true);
    assert.equal(drop.ended,used===4);assert.equal(drop.winUnits,used===4?6250:0);
    previous={...drop,slots:null};
  }
});
test('Fingo always offers a golden target and ends an incomplete round at 21 balls',()=>{
  let previous=null;
  for(let used=0;used<21;used++) {
    const rolled=engine.fingo(10,previous,'roll','round',undefined,()=>.99);
    assert.ok(rolled.slots.some((n,c)=>!rolled.marks[c] && n===rolled.targets[c]));
    for(let c=0;c<5;c++) assert.ok(rolled.slots[c]>=c*15+1 && rolled.slots[c]<=c*15+15);
    const drop=engine.fingo(10,rolled,'drop','round',4,()=>.99);
    assert.equal(drop.winUnits,0);assert.equal(drop.ended,used===20);
    previous={...drop,slots:null};
  }
});
test('shared evaluation matches the actual game on 20,000 generated grids',()=>{
  assert.deepEqual(plain(symbols),engine.SYMBOLS);
  const rng=seeded();
  for(let i=0;i<20000;i++) {
    const grid=Array.from({length:9},()=>[0,1,2,3,4,5,6,7,8,9,11,-1][Math.floor(rng()*12)]);
    const bet=engine.BETS[i%engine.BETS.length];
    assert.deepEqual(engine.evaluate(grid,bet),plain(reference.evaluate(grid,bet)));
  }
});
test('wild substitutes normal symbols, but Happeach never pays a line',()=>{
  const normal=[1,9,1,2,3,4,5,6,7];
  assert.equal(engine.evaluate(normal,10).win,10);
  assert.equal(engine.evaluate([11,11,11,2,3,4,5,6,7],10).win,0);
  assert.equal(engine.evaluate(Array(9).fill(1),10).win,500);
});
test('slot caps Happeach per spin and settles the whole special round',()=>{
  const rng=seeded(); let triggered=0;
  for(let i=0;i<2000;i++) {
    const result=engine.slot(2.5,4,rng);
    assert.ok(result.res.peach.length<=2);
    assert.ok(Number.isInteger(result.winUnits));
    if(result.feature){
      triggered++; assert.ok(result.feature.rounds.length>=1 && result.feature.rounds.length<=5);
      assert.ok(result.feature.res.win>=25); assert.ok(result.peaches<5);
      assert.equal(result.winUnits,engine.units(result.res.win)+engine.units(result.feature.res.win));
    }
  }
  assert.ok(triggered>0,'Special rounds must actually execute');
});
test('wheel uses 9.5% hit probability, including zero, and pays total x10',()=>{
  for(let selected=0;selected<12;selected++) {
    assert.deepEqual(engine.wheel(2.5,selected,()=>.094),{target:selected,winUnits:2500});
    const miss=engine.wheel(2.5,selected,()=>.095);
    assert.notEqual(miss.target,selected);assert.equal(miss.winUnits,0);
  }
});
test('coin arithmetic retains cents from fractional slot rewards',()=>{
  assert.equal(engine.units(83.25),8325); assert.equal(engine.coins(8325),83.25);
});
test('daily bonus uses the São Paulo calendar day, prevents duplicates and resets gaps',()=>{
  const now=Date.parse('2026-10-12T01:00:00Z');
  assert.equal(engine.dayKey(now),'2026-10-11');
  assert.deepEqual(engine.bonusFor(null,0,now),{day:'2026-10-11',streak:1,amount:50});
  assert.equal(engine.bonusFor('2026-10-11',1,now).amount,0);
  assert.equal(engine.bonusFor('2026-10-10',6,now).amount,1000);
  assert.equal(engine.bonusFor('2026-10-10',7,now).amount,50);
  assert.equal(engine.bonusFor('2026-10-08',5,now).amount,50);
});
test('Neck preserves the design table, first-floor odds, guaranteed prize and maximum payout',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../Fortune Neck.dc.html'),'utf8');
  const table=vm.runInNewContext(source.match(/const M = (\[[^;]+\]);/)[1]);
  assert.deepEqual(plain(table),engine.NECK_MULTIPLIERS);assert.equal(table.length,33);
  assert.ok(table.every(m=>!String(m).includes('6')));
  assert.equal(Number(source.match(/const T = ([0-9.]+)/)[1]),engine.NECK_BASE);
  let values=[.99,.8];
  assert.equal(engine.neck(10,null,'start','round',()=>values.shift()).ok,false);
  values=[.99,.8-1/2**32];const first=engine.neck(10,null,'start','round',()=>values.shift());
  assert.equal(first.floor,1);assert.equal(first.winUnits,0);assert.equal(first.peachAt,0);
  const round={id:'round',betUnits:1000,floor:6,peachAt:6,savedUnits:1550};
  const miss=engine.neck(10,round,'climb','round',()=>.99);assert.equal(miss.winUnits,1550);assert.equal(miss.ended,true);
  const collect=engine.neck(10,round,'collect','round',()=>{throw Error('Collection must not draw');});assert.equal(collect.winUnits,1550);
  const last=engine.neck(10,{...round,floor:32},'climb','round',()=>0);assert.equal(last.winUnits,50000);assert.equal(last.ended,true);
  assert.equal(engine.neckPrize(2.5,14),830);
});
