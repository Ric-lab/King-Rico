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
test('Fingo restores the cloud round and animates its committed roll without a local debit',async()=>{
 const targets=[1,16,31,46,61],round={id:'round',betUnits:250,targets,marks:[true,false,false,false,false],used:3,slots:null};
 const player={balance:997.75,settings:{sfxLvl:0,vibLvl:1,fingoBetIdx:1},fingoRound:round};
 let calls=0;
 const cloud={enabled:true,player,fingo:async(...args)=>{calls++;assert.deepEqual(args,['roll',2.5,'round',3]);return {player,outcome:{...round,roundId:'round',slots:targets}};},error:()=>{throw Error('Unexpected error');}};
 const {instance:f}=component('Fortune Fingo.dc.html',cloud);f._cloudDeferred=player;f.applyCloudPlayer();
 assert.equal(f.state.balance,997.75);assert.equal(f.state.balls,18);assert.equal(f.state.active,true);
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
test('the cloud scratch card displays the credited daily gift instead of a local cash draw',()=>{
 const cloud={enabled:true,dayKey:()=>20261015};
 const {instance:home}=component('Home.dc.html',cloud,()=>.99);
 home.props.testGift=true;home.props.testDay=7;
 const cycle=home.cycle();assert.equal(cycle.today,20261015);assert.equal(cycle.idx,0);
 assert.equal(home.prize(cycle),50);assert.equal(home._prize.cells.filter(n=>n===50).length,3);
 // A wallet restored after the first render may already be on a later day.
 home.state.last=20261014;home.state.streak=3;
 assert.equal(home.prize(home.cycle()),200);assert.equal(home._prize.cells.filter(n=>n===200).length,3);
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
