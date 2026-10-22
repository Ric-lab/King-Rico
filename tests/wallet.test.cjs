const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 let now=0,id=0;const frames=new Map(),timers=new Map(),coins=[];
 const wallet={textContent:'',isConnected:true,matches:()=>true,querySelector:()=>null,getBoundingClientRect:()=>({x:20,y:20,width:130,height:36}),closest:s=>s.includes('data-home-scroll')?null:wallet};
 const window={KingRicoCloud:{uid:'account'},matchMedia:()=>({matches:false})};
 const context={window,innerWidth:390,innerHeight:844,performance:{now:()=>now},
  requestAnimationFrame:f=>{frames.set(++id,f);return id;},cancelAnimationFrame:i=>frames.delete(i),
  setTimeout:(f,ms)=>{timers.set(++id,{f,at:now+ms});return id;},clearTimeout:i=>timers.delete(i),
  document:{body:{appendChild(){}},createElement(){let finish;const n={style:{},remove(){},animate(){const finished=new Promise(r=>finish=r);return {finished,cancel(){}};},finish:()=>finish()};coins.push(n);return n;}}};
 wallet.animate=()=>{};
 vm.runInNewContext(fs.readFileSync('ui/wallet.js','utf8'),context);
 const api=window.KingRicoWallet;api.set(wallet,1000);now=500;
 return {wallet,api,coins,window,step:t=>{now=t;const pending=[...frames.values()];frames.clear();pending.forEach(f=>f(now));},timeout:t=>{now=t;for(const [i,v]of timers)if(v.at<=t){timers.delete(i);v.f();}}};
}
test('debits count down smoothly, preserve cents and launch no coins',()=>{
 const t=setup();t.api.set(t.wallet,800.25);assert.equal(t.wallet.textContent,'1.000');
 t.step(650);const middle=Number(t.wallet.textContent.replaceAll('.','').replace(',','.'));
 assert.ok(middle>800.25&&middle<1000);assert.equal(t.coins.length,0);
 t.step(900);assert.equal(t.wallet.textContent,'800,25');
});
test('a held prize starts counting on the first arrival while other coins still fly',async()=>{
 const t=setup();t.api.set(t.wallet,2000,{hold:true});t.step(800);assert.equal(t.wallet.textContent,'1.000');assert.equal(t.coins.length,0);
 t.api.set(t.wallet,2000);assert.equal(t.coins.length,10);t.step(1000);assert.equal(t.wallet.textContent,'1.000');
 t.coins[0].finish();await Promise.resolve();t.step(1300);
 const n=Number(t.wallet.textContent.replaceAll('.',''));assert.ok(n>1000&&n<2000);
 t.step(2100);assert.equal(t.wallet.textContent,'2.000');
});
test('animation failure and missing RAF cannot trap the final balance',()=>{
 const t=setup();t.wallet.animate=null;t.api.set(t.wallet,2050.25);t.timeout(4000);
 assert.equal(t.wallet.textContent,'2.050,25');
});
test('account restoration snaps to its snapshot without prize effects',()=>{
 const t=setup();t.window.KingRicoCloud.uid='other-account';t.api.set(t.wallet,5000);
 assert.equal(t.wallet.textContent,'5.000');assert.equal(t.coins.length,0);
});
