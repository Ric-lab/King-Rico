const test=require('node:test'),assert=require('node:assert/strict'),engine=require('../cloud/engine.cjs'),park=require('../cloud/park.cjs');
test('Win tiers depend on the total stake, never the absolute coin amount',()=>{
 for(const bet of engine.BETS){
  for(const [ratio,tier]of [[.6,'regular'],1,1.6,5,19.99].map(x=>Array.isArray(x)?x:[x,'regular']).concat([[20,'big'],[34.99,'big'],[35,'mega'],[49.99,'mega'],[50,'super'],[200,'super']]))assert.equal(engine.circusProfile.tier(bet*ratio,bet).id,tier);
 }
 assert.equal(engine.circusProfile.tier(1200,1000).id,'regular');
 assert.equal(engine.circusProfile.tier(20,1).id,'big');
});
test('V3 pays total-stake multiples on all eight lines and leaves old receipts unchanged',()=>{
 for(const bet of engine.BETS){
  const grid=[1,1,1,2,3,4,5,6,7];
  assert.equal(engine.evaluate(grid,bet,1).win,engine.coins(engine.units(bet*1.2)));
  assert.equal(engine.evaluate(grid,bet,2).win,engine.coins(engine.units(bet*1.2)));
  assert.equal(engine.evaluate(grid,bet,3).win,engine.coins(engine.units(bet*.6)));
  assert.equal(engine.evaluate(Array(9).fill(9),bet,3).win,bet*4000);
  assert.equal(engine.evaluate([1,2,3,1,4,5,1,6,7],bet,3).win,engine.coins(engine.units(bet*.6)));
 }
});
test('V3 ticket insertion re-evaluates coins with its own paytable',()=>{
 const x={grid:[1,1,1,0,2,3,4,5,6]};x.res=engine.evaluate(x.grid,10,3);x.winUnits=engine.units(x.res.win);
 park.placeTickets(x,10,()=>.45,3);
 assert.equal(x.winUnits,engine.units(engine.evaluate(x.grid,10,3).win));
 assert.ok(x.winUnits<1200);assert.equal(x.grid.filter(n=>n===10).length,3);
});

test('V3 special round uses its saved stake and reaches the 20x presentation tier',()=>{
 const x=engine.feature(2.5,()=>.99,3);assert.equal(x.res.win,50);
 assert.equal(engine.circusProfile.tier(x.res.win,2.5).id,'big');
 assert.equal(engine.feature(2.5,()=>.99,2).res.win,25);
});

test('Complete v3 park stays near its coin budget and reserves rare presentation tiers',()=>{
 const {audit}=require('../scripts/circus-lines-audit.cjs'),x=audit(3,300000,17843);
 assert.ok(x.coinRtp>.92&&x.coinRtp<.99,JSON.stringify(x));
 const rare=x.bigWinRate+x.megaWinRate+x.superWinRate;
 assert.ok(rare>.006&&rare<.014,JSON.stringify(x));
});
