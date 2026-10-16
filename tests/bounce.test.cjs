const test=require('node:test'),assert=require('node:assert/strict');
const {track,outcome,prize}=require('../cloud/bounce.cjs');
const id='550e8400-e29b-41d4-a716-446655440000';
test('Bounce track is stable across reload, teaches center first and has visible varied challenges',()=>{
 const a=track(id),b=track(id);assert.deepEqual(a,b);assert.notDeepEqual(a,track(id.replace(/0$/,'1')));
 assert.equal(a[1].x,0);assert.equal(a[2].x,0);
 assert.ok(a.some(r=>r.moving));assert.ok(a.some(r=>r.gold));
 assert.ok(a.every(r=>r.size>=.95&&r.size<=1.7));
});
test('Bounce guarantees the first golden contact, cashes the confirmed step and uses integer cents',()=>{
 const rows=track(id),gold=rows.find(r=>r.gold).k;let round=null,r;
 r=outcome(2.5,round,'start',id);round={id,...r};
 for(let k=1;k<=gold+4;k++){r=outcome(2.5,round,'land',id);round={id,...r};}
 assert.equal(round.guardStep,gold);
 assert.equal(outcome(2.5,round,'fall',id).winUnits,prize(250,gold));
 assert.equal(outcome(2.5,round,'collect',id).winUnits,prize(250,gold+4));
 assert.equal(prize(250,1),275);assert.equal(outcome(10,null,'fall',id).winUnits,0);
});
