const test=require('node:test'),assert=require('node:assert/strict');
const {quality,claw,MULTIPLIERS}=require('../cloud/claw.cjs');
test('Claw uses the displayed target centers and literal accuracy; all nine prizes can be caught',()=>{
 for(let i=0;i<9;i++){
  const x=i%3*320+180,z=Math.floor(i/3)*280+220;assert.equal(quality(i,x,z),1000);
  for(let seed=0;seed<9;seed++){const r=claw(2.5,i,x,z,seed,'round');assert.equal(r.winUnits,Math.round(250*MULTIPLIERS[(i+seed)%9]));assert.equal(r.ended,true);}
 }
});
test('Claw center, edge and miss boundaries agree without a random release lottery',()=>{
 assert.equal(claw(2.5,4,548,500,0,'round').winUnits,750);
 assert.equal(claw(2.5,4,549,500,0,'round').winUnits,250);
 assert.equal(claw(2.5,4,596,500,0,'round').winUnits,250);
 assert.equal(claw(2.5,4,597,500,0,'round').winUnits,0);
 assert.equal(quality(4,0,1000),0);
});
