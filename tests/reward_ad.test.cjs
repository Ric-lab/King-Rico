const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('the simulated ad requires 30 visible seconds and completes once',()=>{
 let now=0,next,completed=0;const effects=[],values=[],listeners=new Map();
 const document={hidden:false,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 const context={module:{exports:{}},document,performance:{now:()=>now},
  React:{createElement:()=>({}),useState:()=>[0,v=>values.push(v)],useRef:()=>({}),useEffect:fn=>effects.push(fn)},
  window:{ReactDOM:{createPortal:()=>({})}},requestAnimationFrame:fn=>(next=fn,1),cancelAnimationFrame:()=>{next=null}};
 vm.runInNewContext(fs.readFileSync('ui/reward-ad.js','utf8'),context);
 context.module.exports.RewardAd({open:true,onComplete:()=>completed++,onCancel:()=>{}});
 const cleanup=effects[0]();
 const advance=t=>{now=t;const tick=next;next=null;tick?.(now);};
 advance(10000);assert.equal(values.at(-1),10000);assert.equal(completed,0);
 document.hidden=true;listeners.get('visibilitychange')();advance(30000);
 assert.equal(values.at(-1),10000);assert.equal(completed,0);
 document.hidden=false;listeners.get('visibilitychange')();advance(49999);
 assert.equal(values.at(-1),29999);assert.equal(completed,0);
 advance(50000);assert.equal(values.at(-1),30000);assert.equal(completed,1);assert.equal(next,null);
 cleanup();assert.equal(listeners.size,0);
});
