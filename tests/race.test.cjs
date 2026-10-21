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

test('Five-marble races use unbiased 65535-seed coverage, exact 4.8x prizes and monotone faster-track progress',()=>{
 const counts=[0,0,0,0,0];for(let seed=0;seed<65535;seed++)counts[race(2.5,4,seed,'r',2).winner]++;
 assert.deepEqual(counts,[13107,13107,13107,13107,13107]);
 for(let i=0;i<5;i++){const win=race(2.5,i,20+i,'r',2);assert.equal(win.winUnits,1200);assert.equal(win.version,2);}
 for(let seed=0;seed<128;seed++){
  const times=[0,1,2,3,4].map(i=>finishTime(seed,i,2));assert.equal(times.indexOf(Math.min(...times)),seed%5);
  for(let t=0;t<22;t+=.05)for(let i=0;i<5;i++){const p=progress(seed,i,t,2),old=progress(seed,i,Math.max(0,t-.05),2);assert.ok(p>=old-1e-9&&p-old<.012);}
 }
 assert.equal(race(2.5,1,21,'old').winUnits,950,'Historical four-marble payouts must remain unchanged');
 assert.equal('version' in race(2.5,1,21,'old'),false);
});
