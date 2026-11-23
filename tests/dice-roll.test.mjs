import test from 'node:test';import assert from 'node:assert/strict';
import {planDiceRoll,START_Z,DIE_HALF,diceTableBounds} from '../games/villain-dice/roll.mjs';
test('gesture plans reach actual rest; the last poses never turn to another face',()=>{
 for(const dx of [-200,-70,0,70,200])for(const dy of [-340,-90,120]){
  const p=planDiceRoll({dx,dy,duration:230});assert.ok(p.flatness>.8);assert.ok(p.restSpeed<.1);assert.ok(p.duration>1&&p.duration<=4.8);
  const rest=p.frames.at(-1);for(const f of p.frames.slice(-60)){const dot=Math.min(1,Math.abs(f.q.reduce((n,v,i)=>n+v*rest.q[i],0)));assert.ok(2*Math.acos(dot)<.12,'No late quarter-turn after the roll is already slow');}for(const f of p.frames.slice(-30)){assert.deepEqual(f.q,rest.q);assert.deepEqual(f.p,rest.p);}
  assert.ok(Math.abs(p.frames[0].p[2]-diceTableBounds().startZ)<Math.abs(p.vz)/120+.05);assert.ok(rest.p[1]>=DIE_HALF-.02);
 }
});

test('light flick uses the whole phone table, with real walls and stable final pose',()=>{
 for(const [width,height] of [[390,844],[320,740],[844,390]]){
  const bounds=diceTableBounds(width,height);
  assert.ok(bounds.startZ>0);if(height>width)assert.ok(bounds.startZ>bounds.halfZ*.5);
  for(const dx of [-200,0,200]){
   const p=planDiceRoll({dx,dy:-300,duration:180,width,height});
   assert.ok(p.vz<-9,'A short flick must have enough momentum');
   assert.ok(p.restSpeed<.1);assert.ok(p.flatness>.8);
   assert.ok(Math.max(...p.frames.map(f=>f.p[2]))-Math.min(...p.frames.map(f=>f.p[2]))>bounds.halfZ*.5,'Roll traverses more than a small center tray');
   for(const f of p.frames){assert.ok(Math.abs(f.p[0])<bounds.halfX+.05);assert.ok(Math.abs(f.p[2])<bounds.halfZ+.05);}
  }
 }
});
