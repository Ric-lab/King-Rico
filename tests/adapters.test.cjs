const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function component(file,cloud,random=Math.random){
 const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
 const script=source.match(/<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];
 const frames=[],timers=[];let now=100;
 class Base{
  constructor(){this.props={startingBalance:1000,defaultBet:10};}
  setState(update,callback){this.state={...this.state,...(typeof update==='function'?update(this.state):update)};callback?.();}
 }
 const context={DCLogic:Base,React:{createRef:()=>({current:null})},Image:class {},window:{KingRicoCloud:cloud},navigator:{},
  Math:Object.assign(Object.create(Math),{random}),console,Date,crypto:require('node:crypto'),performance:{now:()=>now},
  requestAnimationFrame:fn=>(frames.push(fn),frames.length),cancelAnimationFrame:()=>{},
  setTimeout:(fn,ms)=>(timers.push({fn,ms}),timers.length),clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{}};
 const Class=vm.runInNewContext(script+'\nComponent;',context),instance=new Class();
 return {instance,context,frame:()=>{now=10000;frames.shift()?.();},timers:()=>{let count=0;while(timers.length && ++count<1000)timers.shift().fn();assert.ok(count<1000);}};
}
test('Circus uses the committed grid and debit even when local balance differs',async()=>{
 const outcome={grid:[1,2,3,4,5,6,7,8,0],res:{win:0,cells:[],lines:[],full:false,peach:[]},feature:null};
 let request,payout;
 const cloud={enabled:true,spin:async(...args)=>(request=args,{balanceBefore:500,outcome}),settings:()=>{},error:()=>{throw Error('Unexpected error');}};
 const {instance:g}=component('Fortune Circus.dc.html',cloud,()=>{throw Error('Client randomness must not choose the grid');});
 g.state.balance=1000;g.spinFx=()=>{};g.danceClear=()=>{};g.startWhirr=()=>{};g.sfxWhoosh=()=>{};
 g.reelsStart=()=>{};g.later=fn=>{payout=fn;};
 g.reelStop=(i,time,options)=>{options.onTile();options.onDone();};g.stopWhirr=()=>{};
 g.payout=res=>assert.equal(res,outcome.res);
 await g.doSpin();assert.deepEqual(request,['circus',10]);
 assert.equal(g.state.balance,490);assert.deepEqual(Array.from(g.state.grid),outcome.grid);
 payout();
});
test('Neck animates committed outcomes and collects once without a local lottery',async()=>{
 const player={balance:990.25,settings:{sfxLvl:0,vibLvl:0,neckBetIdx:3},neckRound:{id:'round',betUnits:1000,floor:1,peachAt:0,savedUnits:0}};
 const requests=[];
 const cloud={enabled:true,player,neck:async(...args)=>{
   requests.push(args);const collected=args[0]==='collect';cloud.player={...player,balance:collected?1001.25:990.25,neckRound:collected?null:player.neckRound};
   return {player:cloud.player,balanceDebited:990.25,outcome:{move:args[0],roundId:args[2],betUnits:1000,peachAt:0,floor:1,savedUnits:0,ok:true,ended:collected,winUnits:collected?1100:0}};
 },error:()=>{throw Error('Unexpected error');}};
 const {instance:n,timers}=component('Fortune Neck.dc.html',cloud,()=>{throw Error('No local lottery');});n.tone=()=>{};n.buzz=()=>{};
 await n.climb();timers();assert.equal(requests[0][0],'start');assert.equal(n.state.floor,1);assert.equal(n.state.balance,990.25);
 await n.collect();timers();assert.equal(requests.length,2);assert.equal(requests[1][0],'collect');assert.equal(n.state.balance,1001.25);assert.equal(n.state.round,false);
 assert.equal(n.renderVals().balanceText,'1.001,25');
});
test('Neck restores the current account round and refuses an offline debit',async()=>{
 let errors=0;
 const player={balance:990.25,settings:{neckBetIdx:1,sfxLvl:0,vibLvl:0},neckRound:{id:'round',betUnits:250,floor:7,peachAt:6,savedUnits:390}};
 const cloud={enabled:true,player,neck:async()=>{throw Error('offline');},error:()=>errors++};
 const {instance:n}=component('Fortune Neck.dc.html',cloud,()=>{throw Error('No local lottery');});n.tone=()=>{};n.buzz=()=>{};
 n._cloudDeferred=player;n.applyCloudPlayer();assert.equal(n.state.floor,7);assert.equal(n.state.saved,3.9);assert.equal(n.state.roundBet,2.5);
 await n.climb();assert.equal(errors,1);assert.equal(n.state.balance,990.25);assert.equal(n.state.floor,7);assert.equal(n.state.busy,false);
});
test('Circus refuses offline spins without drawing locally or debiting coins',async()=>{
 let errors=0;
 const cloud={enabled:true,spin:async()=>{throw Error('network');},error:()=>errors++};
 const {instance:g}=component('Fortune Circus.dc.html',cloud,()=>{throw Error('No local fallback');});
 g.state.balance=1000;await g.doSpin();
 assert.equal(g.state.balance,1000);assert.equal(g.state.spinning,false);assert.equal(errors,1);
});
test('Circus special rounds render the serialized committed plan without choosing new symbols',()=>{
 const result=[6,3,0,7,4,1,8,5,2].map(i=>({i,v:i===6?2:-1}));
 const plan={sym:2,rounds:[{result}]};
 const {instance:g}=component('Fortune Circus.dc.html',{enabled:true},()=>{throw Error('No local special-round lottery');});
 g._cloudSpin={outcome:{feature:plan}};g._cloudFeatureRound=0;g.state.feature={sym:2,round:0};
 g.startWhirr=()=>{};g.reelsStart=()=>{};g.later=()=>{};
 g.reelStop=(i,time,options)=>{options.onTile();options.onDone();};
 g.respin(2,10);
 assert.equal(g._cloudFeatureRound,1);assert.equal(g.state.grid[6],2);
 assert.deepEqual(Array.from(g.state.locked),[6]);
 assert.ok(Array.from(g.state.grid).every((value,i)=>value===(i===6?2:-1)));
});
test('Wheel lands on the committed sector and uses the persisted debit',async()=>{
 let request;
 const cloud={enabled:true,spin:async(...args)=>(request=args,{balanceDebited:490,outcome:{target:7,winUnits:0}}),settings:()=>{},error:()=>{throw Error('Unexpected error');}};
 const {instance:w,frame}=component('Fortune Wheel.dc.html',cloud,()=>.5);
 w.state.pick={t:'n',v:0};w.drag={samples:[[0,0]]};w.rot=300;
 w.tone=()=>{};w.buzz=()=>{};w.tick=()=>{};w.kick=()=>{};
 await w.up();assert.deepEqual(request,['wheel',10,0]);assert.equal(w.state.balance,490);
 frame();assert.equal(w.state.landed,7);assert.equal(w.state.spinning,false);
});
test('Home uses the persisted cloud bonus',async()=>{
 const cloud={enabled:true,bonus:async()=>({amount:50,player:{balance:1050,bonus:{day:'2026-10-12',streak:1}}})};
 const {instance:home}=component('Home.dc.html',cloud);
 home.buzz=()=>{};home.react=()=>{};await home.collectBonus();
 assert.equal(home.state.balance,1050);assert.equal(home.state.last,20261012);assert.equal(home.state.streak,1);
});
test('Penalty waits for the committed shot and never adds its prize locally',async()=>{
  const requests=[],player={balance:1000.75,settings:{penaltyBetIdx:1},penaltyRound:null};
  const cloud={enabled:true,player,penalty:async(...args)=>{
    requests.push(args);return {balanceDebited:997.75,outcome:{goal:true,betUnits:250,roundId:'round',step:1,winUnits:args[0]==='collect'?300:0}};
  },settings:()=>{},error:()=>{throw Error('Unexpected error');}};
  const {instance:g}=component('Fortune Penalty.dc.html',cloud,()=>{throw Error('No local lottery');});
  g.state={...g.state,balance:1000.25,betIdx:1,roundId:'round'};g.ac=()=>{};g.tone=()=>{};g.buzz=()=>{};g.flyCoins=done=>done();
  assert.equal((await g.onSwipe(1000)).goal,true);assert.equal(g.state.balance,997.75);
  assert.deepEqual(requests[0],['shoot',2.5,'round',0,1000]);
  g.state.flying=false;g.state.step=1;await g.collectBtn();
  g.state.win={w:3};g.closeWin();assert.equal(g.state.balance,1000.75);assert.equal(requests.length,2);
});
test('Penalty refuses an offline shot and preserves its wallet',async()=>{
  let errors=0;const cloud={enabled:true,penalty:async()=>{throw Error('offline');},error:()=>errors++};
  const {instance:g}=component('Fortune Penalty.dc.html',cloud);g.state.roundId='round';
  assert.equal(await g.onSwipe(1000),null);assert.equal(g.state.balance,1000);assert.equal(g.state.flying,false);assert.equal(errors,1);
});
test('Fingo restores the cloud round and animates its committed roll without a local debit',async()=>{
 const targets=[1,16,31,46,61],round={id:'round',betUnits:250,targets,marks:[true,false,false,false,false],used:3,slots:null};
 const player={balance:997.75,settings:{sfxLvl:0,vibLvl:1,fingoBetIdx:1},fingoRound:round};
 let calls=0;
 const cloud={enabled:true,player,fingo:async(...args)=>{calls++;assert.deepEqual(args,['roll',2.5,'round',3]);return {player,outcome:{...round,roundId:'round',slots:targets}};},error:()=>{throw Error('Unexpected error');}};
 const {instance:f}=component('Fortune Fingo.dc.html',cloud);f._cloudDeferred=player;f.applyCloudPlayer();
 assert.equal(f.state.balance,997.75);assert.equal(f.state.balls,27);assert.equal(f.state.active,true);
 f.roll=(slots)=>{assert.deepEqual(slots,targets);};f.tone=()=>{};f.buzz=()=>{};
 await f.onSpin();assert.equal(calls,1);assert.equal(f.state.balance,997.75);
});
test('Fingo does not change the wallet or roll locally if its cloud request fails',async()=>{
 let errors=0;
 const player={balance:1000,settings:{},fingoRound:null};
 const cloud={enabled:true,player,fingo:async()=>{throw Error('Offline');},error:()=>errors++};
 const {instance:f}=component('Fortune Fingo.dc.html',cloud);f.roll=()=>{throw Error('No local fallback');};
 await f.onSpin();assert.equal(f.state.balance,1000);assert.equal(f.state.active,false);assert.equal(errors,1);
});
test('Fingo shows an already committed prize without crediting it again on dismissal',()=>{
 const cloud={enabled:true,player:{balance:1240.25,settings:{},fingoRound:null}};
 const {instance:f}=component('Fortune Fingo.dc.html',cloud);f.state.win={w:250,title:'FINGO!'};f.state.balance=990.25;
 f.flyCoins=done=>done();f.closeWin();assert.equal(f.state.balance,1240.25);assert.equal(f.state.win,null);
 f.closeWin();assert.equal(f.state.balance,1240.25);
});
test('the daily gift uses the saved weekly reward without a scratch lottery',()=>{
 const cloud={enabled:true,dayKey:()=>20261015};
 const {instance:home}=component('Home.dc.html',cloud,()=>.99);
 home.props.testGift=true;home.props.testDay=7;
 const cycle=home.cycle();assert.equal(cycle.today,20261015);assert.equal(cycle.idx,0);
 assert.equal(home.prize(cycle),50);
 // A wallet restored after the first render may already be on a later day.
 home.state.last=20261014;home.state.streak=3;
 assert.equal(home.prize(home.cycle()),200);
});
test('Circus recharges the cloud wallet once without reusing the already claimed daily gift',async()=>{
 let finish,calls=0;
 const cloud={enabled:true,recharge:()=>{calls++;return new Promise(resolve=>{finish=resolve;});},
  bonus:()=>{throw Error('Recharge must not use the daily gift');},error:()=>{throw Error('Unexpected error');}};
 const {instance:g}=component('Fortune Circus.dc.html',cloud);g.cloudBusy=()=>false;g.state.balance=0;
 const first=g.recharge(),second=g.recharge();assert.equal(calls,1);
 finish({amount:1000,player:{balance:1000}});await Promise.all([first,second]);
 assert.equal(g.state.balance,1000);assert.equal(g._recharging,false);assert.equal(g.state.auto,false);
});
test('Circus does not mint local coins if the cloud recharge fails',async()=>{
 let errors=0;
 const cloud={enabled:true,recharge:async()=>{throw Error('Offline');},error:()=>errors++};
 const {instance:g}=component('Fortune Circus.dc.html',cloud);g.cloudBusy=()=>false;g.state.balance=0;
 await g.recharge();assert.equal(g.state.balance,0);assert.equal(g._recharging,false);assert.equal(errors,1);
});
test('Home and Wheel preserve cents earned in Circus',()=>{
 const cloud={enabled:false};
 const {instance:home}=component('Home.dc.html',cloud);home.state.balance=1050.25;
 assert.equal(home.renderVals().balanceText,'1.050,25');
 const {instance:wheel}=component('Fortune Wheel.dc.html',cloud);wheel.state.balance=1050.25;
 assert.equal(wheel.renderVals().balanceText,'1.050,25');
});
test('Clown refuses offline throws, restores progress and never credits a dismissed prize',async()=>{
 let errors=0;const player={balance:997.5,settings:{clownBetIdx:1,sfxLvl:0,vibLvl:0},clownRound:{id:'round',betUnits:250,used:3,sumUnits:38,results:[1.5,0,0]}};
 const cloud={enabled:true,player,clown:async()=>{throw Error('offline');},settings:()=>{},error:()=>errors++};
 const {instance:g}=component('Fortune Clown.dc.html',cloud);g._cloudDeferred=player;g.applyCloudPlayer();
 assert.equal(g.state.left,7);assert.equal(g.state.sum,.38);assert.equal(g.state.betIdx,1);
 await g.shoot([{x:226,y:670},{x:226,y:442}]);assert.equal(errors,1);assert.equal(g.state.balance,997.5);assert.equal(g.state.busy,false);
 cloud.player={...player,clownRound:null,balance:1001.3};g.state.win={w:3.8};g.closeWin();g.closeWin();assert.equal(g.state.balance,1001.3);
 let called=0;g.shoot=()=>called++;g.drag={id:1,pts:[{x:226,y:670},{x:226,y:442}]};g.cancel();g.up({pointerId:1});assert.equal(called,0);
});
test('Clown stays still without hits and adds clockwise rotation only after six restored hits',()=>{
 const {instance:g}=component('Fortune Clown.dc.html',{});g.faceRef.current={style:{}};
 g.state.active=true;g.state.results=[0,0,0,0,0,0];g.moveFace(0);g.moveFace(1000);
 assert.equal(g.off,0);assert.equal(g.angle,0);
 g.state.results=[1.5,0,1.5,1.5,1.5,1.5];g.moveFace(1016);
 assert.notEqual(g.off,0);assert.equal(g.angle,0);
 const results=[1.5,1.5,1.5,1.5,1.5,1.5];
 g._cloudDeferred={balance:990,settings:{},clownRound:{id:'round',betUnits:1000,used:6,sumUnits:900,results}};g.applyCloudPlayer();
 g.moveFace(1032);const first=g.angle;g.moveFace(1048);
 assert.ok(first>0 && g.angle>first);assert.notEqual(g.off,0);
 g.state.results=[];g.state.active=false;g.moveFace(1064);
 assert.equal(g.angle,0);assert.equal(g.off,0);assert.equal(g.dy,0);
});
test('Clown rotates about its lowered center and aims in the same local coordinates',async()=>{
 let selected;const cloud={enabled:true,player:{balance:990,settings:{}},clown:async(...args)=>{selected=args[3];throw Error('offline');},error:()=>{}};
 const {instance:g}=component('Fortune Clown.dc.html',cloud);
 g.off=30;g.dy=-10;g.angle=Math.PI/2;
 const center=g.facePoint({x:226.5,y:360});assert.equal(center.x,256.5);assert.equal(center.y,374);
 const mouth=g.facePoint({x:226.5,y:442});assert.equal(mouth.x,174.5);assert.equal(mouth.y,374);
 const holes=[{x:226.5,y:442},{x:225.6,y:353.6},{x:174.9,y:293.4},{x:276.4,y:293.4},{x:84.7,y:376.8},{x:365.7,y:376.8}];
 for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.8]){
  g.angle=angle;
  for(const [i,hole] of holes.entries()){
   const point=g.facePoint(hole),local=g.facePoint(point,true);
   assert.ok(Math.hypot(local.x-hole.x,local.y-hole.y)<1e-9);
   await g.shoot([{x:226,y:670},point]);assert.equal(selected,i);
  }
 }
});

test('Flying restores persisted balloons and refuses an offline pop without drawing or debiting',async()=>{
 let errors=0;const player={balance:997.5,settings:{flyingBetIdx:1,sfxLvl:0,vibLvl:0},flyingRound:{id:'round',betUnits:250,step:2,popped:[4,8]}};
 const cloud={enabled:true,player,flying:async()=>{throw Error('offline');},settings:()=>{},error:()=>errors++};
 // Effects may be random; restoring IDs and refusing a request are not lotteries.
 const {instance:f}=component('Fortune Flying Clown.dc.html',cloud,()=>.5);
 f._cloudDeferred=player;f.applyCloudPlayer();assert.equal(f.balls.length,8);assert.equal(f.state.step,2);assert.equal(f.state.balance,997.5);
 assert.ok(!f.balls.some(b=>b.id===4||b.id===8));await f.popIdx(0);
 assert.equal(f.state.balance,997.5);assert.equal(f.balls.length,8);assert.equal(f.state.busy,false);assert.equal(errors,1);
});

test('Home waits for the saved profile before deciding whether the daily gift is due',()=>{
 let watch;const cloud={enabled:true,dayKey:()=>20261021,watch:fn=>(watch=fn,()=>{})};
 const {instance:home,context}=component('Home.dc.html',cloud);
 context.window.addEventListener=()=>{};home.componentDidMount();
 assert.equal(home.state.loaded,false);assert.equal(home.renderVals().bonusOpen,false);
 watch({balance:1050,rechargeCount:2,settings:{sfxLvl:0,vibLvl:0},bonus:{day:'2026-10-21',streak:1}});
 assert.equal(home.state.loaded,true);assert.equal(home.renderVals().bonusOpen,false);assert.equal(home.state.rechargeCount,2);
});
test('Home counts one recharge while confirmation is pending and never changes the daily gift',async()=>{
 let finish,calls=0;const player={balance:2050,rechargeCount:1,bonus:{day:'2026-10-21',streak:1}};
 const cloud={enabled:true,player,dayKey:()=>20261021,recharge:source=>{assert.equal(source,'home');calls++;return new Promise(r=>finish=r)},error:()=>{throw Error('Unexpected failure')}};
 const {instance:home}=component('Home.dc.html',cloud);home.state.loaded=true;home.state.last=20261021;home.state.streak=1;home.buzz=()=>{};
 home.recharge();home.recharge();assert.equal(calls,0);assert.equal(home.state.adOpen,true);
 const first=home.finishAd();await home.finishAd();assert.equal(calls,1);finish({amount:1000,player});await first;
 assert.equal(home.state.adOpen,false);assert.equal(home.state.balance,2050);assert.equal(home.state.rechargeCount,1);assert.equal(home.state.last,20261021);assert.equal(home.state.streak,1);assert.equal(home.state.recharging,false);
 assert.equal(home.state.rewardOpen,true);assert.equal(home.state.rewardPending,1000);
 assert.equal(home.renderVals().balanceText,'1.050');
 home.recharge();assert.equal(home.state.adOpen,false);assert.equal(calls,1);
 home.rewardProgress(250);assert.equal(home.state.rewardPending,750);assert.equal(home.renderVals().balanceText,'1.300');
 home.rewardDone();home.rewardDone();assert.equal(home.state.rewardPending,0);assert.equal(home.state.rewardOpen,false);assert.equal(home.state.balance,2050);assert.equal(calls,1);
 assert.equal(home.renderVals().balanceText,'2.050');
});

test('closing the simulated ad before completion grants no coins and can be reopened',()=>{
 let calls=0;const cloud={enabled:true,recharge:()=>calls++};const {instance:home}=component('Home.dc.html',cloud);
 home.state.loaded=true;home.state.balance=1050;home.recharge();assert.equal(home.state.adOpen,true);
 home.cancelAd();assert.equal(home.state.adOpen,false);assert.equal(home.state.balance,1050);assert.equal(calls,0);
 home.recharge();assert.equal(home.state.adOpen,true);assert.equal(home.state.adComplete,false);
});

test('a failed ad reward can be confirmed again without another countdown',async()=>{
 let calls=0,errors=0;const player={balance:2050,rechargeCount:1};
 const cloud={enabled:true,player,recharge:async()=>{if(++calls===1)throw Error('offline');return {amount:1000,player}},error:()=>errors++};
 const {instance:home}=component('Home.dc.html',cloud);home.state.loaded=true;home.state.balance=1050;home.buzz=()=>{};
 home.recharge();await home.finishAd();assert.equal(errors,1);assert.equal(home.state.adOpen,true);
 assert.equal(home.state.adComplete,true);assert.equal(home.state.adError,true);assert.equal(home.state.balance,1050);
 await home.finishAd();assert.equal(calls,2);assert.equal(home.state.adOpen,false);assert.equal(home.state.balance,2050);
});

test('Home daily reward badge reaches 5/5, blocks another ad and renews for a new day',()=>{
 let key=20261022;const cloud={enabled:true,dayKey:()=>key};const {instance:home}=component('Home.dc.html',cloud);
 home.state.loaded=true;home.state.rechargeDaily={dayIndex:home.rechargeDay(),count:5};
 assert.equal(home.renderVals().rechargeCounter,'5/5');assert.equal(home.renderVals().rechargeDisabled,true);
 home.recharge();assert.equal(home.state.adOpen,false);
 key=20261023;assert.equal(home.renderVals().rechargeCounter,'0/5');assert.equal(home.renderVals().rechargeDisabled,false);
 home.recharge();assert.equal(home.state.adOpen,true);
});
