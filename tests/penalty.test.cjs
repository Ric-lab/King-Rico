const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../cloud/engine.cjs');
test('Penalty offers ten prizes, preserves aim quality and collects each displayed amount',()=>{
  assert.deepEqual(engine.PENALTY_MULTIPLIERS,[1.5,3,5,7,10,15,20,25,50,100]);
  assert.equal(engine.penalty(2.5,null,'shoot','id',1000,()=>.65).goal,true);
  assert.equal(engine.penalty(2.5,null,'shoot','id',1000,()=>.66).goal,false);
  assert.equal(engine.penalty(2.5,null,'shoot','id',500,()=>.33).goal,false);
  assert.equal(engine.penalty(2.5,null,'shoot','id',0,()=>{throw Error('Outside shot must lose');}).goal,false);
  for(const bet of engine.BETS) {
    let round;
    for(let step=1;step<=10;step++) {
      const x=engine.penalty(bet,round,'shoot','id',1000,()=>0);
      assert.equal(x.step,step);assert.equal(x.ladderVersion,2);
      assert.equal(x.winUnits,step===10?engine.units(bet)*100:0);
      assert.equal(x.ended,step===10);round={id:'id',betUnits:x.betUnits,step,ladderVersion:2};
      if(step<10) {
        const collect=engine.penalty(bet,round,'collect','id',0,()=>{throw Error('Collection cannot redraw');});
        assert.equal(collect.winUnits,Math.round(engine.units(bet)*engine.PENALTY_MULTIPLIERS[step-1]));
        assert.equal(collect.ended,true);
      }
    }
  }
});
test('Penalty preserves the five-step table for already saved unversioned rounds',()=>{
  const early=engine.penalty(2.5,{id:'old',betUnits:250,step:1},'collect','old',0,()=>{throw Error('No draw');});
  assert.equal(early.winUnits,300);assert.equal(early.ladderVersion,undefined);
  const final=engine.penalty(2.5,{id:'old',betUnits:250,step:4},'shoot','old',1000,()=>0);
  assert.equal(final.step,5);assert.equal(final.ended,true);assert.equal(final.winUnits,2500);
});
