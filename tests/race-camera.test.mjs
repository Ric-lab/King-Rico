import test from 'node:test';
import assert from 'node:assert/strict';
import race from '../cloud/race.cjs';
import {LENGTH,RADIUS,PINS,DRUMS,halfWidth} from '../games/race/course.mjs';
import {plan,distance,lanes,settledAt} from '../games/race/script.mjs';
test('Circus staging: the crossing order is the settled pair, motion is monotonic and nothing overlaps',()=>{
 for(let seed=0;seed<640;seed+=7){
  const [w,s]=race.circusPair(seed),p=plan(seed,[w,s]),order=[0,1,2,3,4].sort((a,b)=>p.times[a]-p.times[b]);
  assert.deepEqual(order.slice(0,2),[w,s]);assert.ok(p.times[w]>21&&settledAt(p)<26,JSON.stringify(p.times));
  let last=[0,0,0,0,0],prev=null;
  for(let t=0;t<settledAt(p);t+=1/60){
   const d=[0,1,2,3,4].map(i=>distance(p,i,t)),l=lanes(p,t,d,prev);prev=l;
   d.forEach((x,i)=>{assert.ok(x>=last[i]-1e-9,'monotonic');assert.ok(Math.abs(l[i])<=halfWidth(Math.min(x,LENGTH+8))-RADIUS+.05);});last=d;
   for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)assert.ok(Math.hypot(d[i]-d[j],l[i]-l[j])>2*RADIUS-.01,JSON.stringify({seed,t,i,j}));
  }
 }
});
