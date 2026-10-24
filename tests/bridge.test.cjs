const test=require('node:test'),assert=require('node:assert/strict'),engine=require('../cloud/engine.cjs');
test('Bridge draws all six panes before any choice and never redraws during jumps/collection',()=>{
  let draws=0;const x=engine.bridge(10,null,'start','round',-1,()=>draws++%2?.9:.1);
  assert.equal(draws,6);assert.deepEqual(x.safeSides,[0,1,0,1,0,1]);assert.equal(x.winUnits,0);
  let previous={...x,id:'round'};
  for(let step=0;step<6;step++){
    const next=engine.bridge(10,previous,'jump','round',step%2,()=>{throw Error('No redraw');});
    assert.equal(next.step,step+1);assert.equal(next.ok,true);assert.equal(next.ended,step===5);
    assert.equal(next.winUnits,step===5?60000:0);previous=next;
  }
});
test('Bridge early collection, a broken pane and payouts use the original stake',()=>{
  const start=engine.bridge(2.5,null,'start','r',-1,()=>0);
  const one=engine.bridge(2.5,start,'jump','r',0),paid=engine.bridge(2.5,one,'collect','r');
  assert.equal(paid.winUnits,475);assert.equal(paid.ended,true);
  const loss=engine.bridge(2.5,one,'jump','r',1);assert.equal(loss.winUnits,0);assert.equal(loss.ok,false);assert.equal(loss.ended,true);
  for(const bet of engine.BETS)for(const [i,m]of engine.BRIDGE_MULTIPLIERS.entries()){
    const path={...start,betUnits:engine.units(bet),step:i+1};
    assert.equal(engine.bridge(bet,path,'collect','r').winUnits,Math.round(engine.units(bet)*m));
    assert.ok(m/2**(i+1)<=.95+1e-9);
  }
});
