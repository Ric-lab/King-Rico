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
