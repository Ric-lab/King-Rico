const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function component(file,cloud,random=Math.random){
 const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
 const script=source.match(/<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];
 const frames=[];let now=100;
 class Base{
  constructor(){this.props={startingBalance:1000,defaultBet:10};}
  setState(update,callback){this.state={...this.state,...(typeof update==='function'?update(this.state):update)};callback?.();}
 }
 const context={DCLogic:Base,React:{createRef:()=>({current:null})},window:{KingRicoCloud:cloud},navigator:{},
  Math:Object.assign(Object.create(Math),{random}),console,Date,performance:{now:()=>now},
  requestAnimationFrame:fn=>(frames.push(fn),frames.length),cancelAnimationFrame:()=>{},
  setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{}};
 const Class=vm.runInNewContext(script+'\nComponent;',context),instance=new Class();
 return {instance,context,frame:()=>{now=10000;frames.shift()?.();}};
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
test('Home and Wheel preserve cents earned in Circus',()=>{
 const cloud={enabled:false};
 const {instance:home}=component('Home.dc.html',cloud);home.state.balance=1050.25;
 assert.equal(home.renderVals().balanceText,'1.050,25');
 const {instance:wheel}=component('Fortune Wheel.dc.html',cloud);wheel.state.balance=1050.25;
 assert.equal(wheel.renderVals().balanceText,'1.050,25');
});
