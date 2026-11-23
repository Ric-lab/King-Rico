import test from 'node:test';import assert from 'node:assert/strict';
import {planDiceRoll,START_Z,DIE_HALF} from '../games/villain-dice/roll.mjs';
test('gesture plans reach actual rest; the last poses never turn to another face',()=>{
 for(const dx of [-200,-70,0,70,200])for(const dy of [-340,-90,120]){
  const p=planDiceRoll({dx,dy,duration:230});assert.ok(p.flatness>.8);assert.ok(p.restSpeed<.1);assert.ok(p.duration>1&&p.duration<=4.2);
  const rest=p.frames.at(-1);for(const f of p.frames.slice(-60)){const dot=Math.min(1,Math.abs(f.q.reduce((n,v,i)=>n+v*rest.q[i],0)));assert.ok(2*Math.acos(dot)<.12,'No late quarter-turn after the roll is already slow');}for(const f of p.frames.slice(-30)){assert.deepEqual(f.q,rest.q);assert.deepEqual(f.p,rest.p);}
  assert.ok(p.frames[0].p[2]>=START_Z-.1);assert.ok(rest.p[1]>=DIE_HALF-.02);
 }
});
