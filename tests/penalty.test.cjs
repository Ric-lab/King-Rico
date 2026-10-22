const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../cloud/engine.cjs');
test('Penalty keeps the five prizes, skill penalty and first-shot odds',()=>{
  assert.deepEqual(engine.PENALTY_MULTIPLIERS,[1.2,1.8,3,5,10]);
  assert.equal(engine.penalty(2.5,null,'shoot','id',1000,()=>.79).goal,true);
  assert.equal(engine.penalty(2.5,null,'shoot','id',1000,()=>.82).goal,false);
  assert.equal(engine.penalty(2.5,null,'shoot','id',500,()=>.41).goal,false);
  assert.equal(engine.penalty(2.5,null,'shoot','id',0,()=>{throw Error('Outside shot must lose');}).goal,false);
  let round;
  for(let step=1;step<=5;step++) {
    const x=engine.penalty(2.5,round,'shoot','id',1000,()=>0);
    assert.equal(x.step,step);assert.equal(x.winUnits,step===5?2500:0);
    assert.equal(x.ended,step===5);round={id:'id',betUnits:x.betUnits,step};
    if(step<5) {
      const collect=engine.penalty(2.5,round,'collect','id',0,()=>{throw Error('Collection cannot redraw');});
      assert.equal(collect.winUnits,Math.round(250*engine.PENALTY_MULTIPLIERS[step-1]));
      assert.equal(collect.ended,true);
    }
  }
});
