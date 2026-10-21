const test=require('node:test'),assert=require('node:assert/strict');
const {race,finishTime,progress}=require('../cloud/race.cjs');
test('All four marbles have equal seed coverage and literal 3.8x winnings in exact cents',()=>{
 const count=[0,0,0,0];for(let seed=0;seed<65536;seed++)count[race(2.5,0,seed,'r').winner]++;
 assert.deepEqual(count,[16384,16384,16384,16384]);
 for(let winner=0;winner<4;winner++)for(let selected=0;selected<4;selected++){
  const r=race(2.5,selected,winner,'r');assert.equal(r.winUnits,selected===winner?950:0);assert.equal(r.betUnits,250);assert.equal(r.ended,true);
 }
});
test('Every visible marble advances continuously and the saved winner crosses first, without a late swap',()=>{
 let overtakes=0;
 for(let seed=0;seed<192;seed++){
  const times=[0,1,2,3].map(i=>finishTime(seed,i));assert.equal(times.indexOf(Math.min(...times)),seed%4);
  let leader=-1;
  for(let t=0;t<22;t+=.05){
   const positions=[0,1,2,3].map(i=>progress(seed,i,t));
   for(let i=0;i<4;i++){const old=progress(seed,i,Math.max(0,t-.05));assert.ok(positions[i]>=old-1e-10);assert.ok(positions[i]-old<.008);}
   const current=positions.indexOf(Math.max(...positions));if(t>.5&&t<15&&current!==leader&&leader>=0)overtakes++;leader=current;
  }
  for(let i=0;i<4;i++){assert.equal(progress(seed,i,0),0);assert.equal(progress(seed,i,times[i]),1);assert.deepEqual(progress(seed,i,5),progress(seed,i,5));}
 }
 assert.ok(overtakes>50,'There should be real position changes during the race');
});
