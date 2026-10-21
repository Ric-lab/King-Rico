import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrizeWorld,BIN,CHUTE} from '../games/claw/physics.mjs';
import layout from '../games/claw/layout.cjs';
test('3D prizes settle in the bin, reproduce after reload and remain distinct capture targets',()=>{
 for(const seed of[0,4,8]){
  const a=createPrizeWorld(seed),b=createPrizeWorld(seed),targets=a.targets();
  assert.deepEqual(targets,b.targets());assert.equal(targets.length,9);
  for(const[t,i]of targets.map((p,i)=>[p,i])){
   assert.ok(t.y>BIN.floor+.18&&t.y<3);assert.ok(t.x>BIN.left&&t.x<BIN.right&&t.z>BIN.back&&t.z<BIN.front);
   assert.equal(layout.encodeAim(targets,t.x,t.z).selected,i);assert.equal(layout.encodeAim(targets,t.x,t.z).quality,1000);
  }
  a.destroy();b.destroy();
 }
});
function liftAndRelease(p,index,dt){
 const body=p.toys[index].body,start={x:body.position.x,y:body.position.y+.2,z:body.position.z};
 p.attach(index,start.x,start.y,start.z);
 for(let t=0;t<1.5;t+=dt){const f=Math.min(1,(t+dt)/1.5);p.anchor(start.x,start.y+(3.5-start.y)*f,start.z,dt);p.step(dt);}
 assert.ok(body.position.y>3,'The constraint must physically lift the body out of the pile');
 for(let t=0;t<1.5;t+=dt){const f=Math.min(1,(t+dt)/1.5);p.anchor(start.x+(CHUTE.x-start.x)*f,3.5,start.z+(CHUTE.z-start.z)*f,dt);p.step(dt);}
 p.release();for(let t=0;t<3;t+=dt)p.step(dt);
 assert.ok(p.delivered(index),'The toy must pass through the opening into the receiving well');
 assert.ok(body.position.y>.35&&body.position.y<.86,'The delivered body rests on the tray instead of falling through the cabinet');
}
test('All nine prizes can be lifted by a constraint and fall through the actual chute',()=>{
 for(let i=0;i<9;i++){const p=createPrizeWorld(0);liftAndRelease(p,i,1/60);p.destroy();}
});
test('The same capture survives slower rendering without tunnelling through the tray',()=>{
 for(const dt of[1/30,.15,.25]){const p=createPrizeWorld(3);liftAndRelease(p,4,dt);p.destroy();}
});
test('Off-centre grips clear the chute, including the pose that used to jam on its rim',()=>{
 const smooth=x=>x*x*(3-2*x);
 for(const seed of[0,3,8])for(const index of[0,4,8])for(const offset of[-.13,.13]){
  const p=createPrizeWorld(seed),body=p.toys[index].body;
  const start={x:body.position.x+offset,y:body.position.y+.2,z:body.position.z+offset*.5};
  p.attach(index,start.x,start.y,start.z);
  for(let i=0;i<66;i++){const f=smooth((i+1)/66);p.anchor(start.x,start.y+(3.58-start.y)*f,start.z,1/60);p.step(1/60);}
  for(let i=0;i<57;i++){const f=smooth((i+1)/57);p.anchor(start.x+(CHUTE.x-start.x)*f,3.58,start.z+(CHUTE.z-start.z)*f,1/60);p.step(1/60);}
  for(let i=0;i<9;i++){p.anchor(CHUTE.x,3.58,CHUTE.z,1/60);p.step(1/60);}
  p.release();for(let i=0;i<150;i++)p.step(1/60);
  assert.ok(p.delivered(index),`seed ${seed}, prize ${index}, grip ${offset} must reach the tray`);p.destroy();
 }
});
