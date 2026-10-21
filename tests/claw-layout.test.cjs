const test=require('node:test'),assert=require('node:assert/strict');
const {createLayout,encodeAim,decodeAim}=require('../games/claw/layout.cjs');
const {claw}=require('../cloud/claw.cjs');
test('Every visible pile target maps to the same ledger prize at its actual center, for every seed',()=>{
 for(let seed=0;seed<9;seed++){
  const layout=createLayout(seed);assert.equal(layout.length,9);
  for(const[p,selected]of layout.map((p,i)=>[p,i])){
   const hit=encodeAim(layout,p.x,p.z);assert.equal(hit.selected,selected);assert.equal(hit.quality,1000);
   const result=claw(2.5,hit.selected,hit.aimX,hit.aimZ,seed,'round');assert.ok(result.winUnits>=300);
   const restored=decodeAim(layout,selected,hit.aimX,hit.aimZ);assert.ok(Math.abs(restored.x-p.x)<.001&&Math.abs(restored.z-p.z)<.001);
  }
 }
});
test('Irregular layout does not snap an edge or miss to a paid center; encoding preserves physical error',()=>{
 for(let seed=0;seed<9;seed++){
  const layout=createLayout(seed),p=layout[4];
  for(const[dx,q,win]of[[0,1000,750],[48,700,750],[49,694,250],[80,500,250],[96,400,250],[97,394,0]]){
   const hit=encodeAim(layout,p.x+dx/1000*3.1,p.z);
   assert.equal(hit.selected,4);assert.equal(hit.quality,q);
   const restored=decodeAim(layout,4,hit.aimX,hit.aimZ);
   assert.ok(Math.abs(restored.x-(p.x+dx/1000*3.1))<=.00156);
   assert.equal(claw(2.5,4,hit.aimX,hit.aimZ,0,'round').winUnits,win);
  }
 }
});
test('Pile poses reproduce across reloads and span distinct depths, tilts and sizes',()=>{
 assert.deepEqual(createLayout(3),createLayout(3));assert.notDeepEqual(createLayout(3),createLayout(4));
 const poses=createLayout(0);assert.ok(new Set(poses.map(p=>p.y)).size>4);assert.ok(poses.some(p=>p.angle<-.3)&&poses.some(p=>p.angle>.3));
 assert.ok(Math.max(...poses.map(p=>p.size))-Math.min(...poses.map(p=>p.size))>.2);
});
