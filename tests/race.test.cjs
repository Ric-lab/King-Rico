const test=require('node:test'),assert=require('node:assert/strict');
const {race,finishTime,progress,circusPair,V4_SEEDS}=require('../cloud/race.cjs');
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

test('Circus v4: 640 seeds give every winner 1/5 and every ordered 1º-2º pair 1/20, with exact 4.8x and 19.2x prizes',()=>{
 assert.equal(V4_SEEDS,640);const wins=[0,0,0,0,0],pairs={};
 for(let seed=0;seed<640;seed++){const [w,s]=circusPair(seed);assert.notEqual(w,s);wins[w]++;pairs[w+'-'+s]=(pairs[w+'-'+s]||0)+1;}
 assert.deepEqual(wins,[128,128,128,128,128]);assert.equal(Object.keys(pairs).length,20);assert.ok(Object.values(pairs).every(n=>n===32));
 for(let seed=0;seed<40;seed++){const [w,s]=circusPair(seed);
  assert.equal(race(2.5,w,seed,'r',4).winUnits,1200);assert.equal(race(2.5,(w+1)%5,seed,'r',4).winUnits,0);
  assert.equal(race(2.5,w,seed,'r',4,s).winUnits,4800);assert.equal(race(2.5,s,seed,'r',4,w).winUnits,0);assert.equal(race(2.5,w,seed,'r',4,(s+1)%5===w?(s+2)%5:(s+1)%5).winUnits,0);
  const x=race(10,w,seed,'r',4,s);assert.deepEqual([x.winner,x.second,x.version,x.selected2],[w,s,4,s]);}
 let rtpWin=0,rtpPair=0;for(let seed=0;seed<640;seed++)for(let a=0;a<5;a++){rtpWin+=race(1,a,seed,'r',4).winUnits;for(let b=0;b<5;b++)if(a!==b)rtpPair+=race(1,a,seed,'r',4,b).winUnits;}
 assert.equal(rtpWin/(640*5*100),.96);assert.equal(rtpPair/(640*20*100),.96);
});
