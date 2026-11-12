const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 let at=0,angle=0,id=0;const frames=new Map(),tones=[],listeners=new Set(),fc={state:{sound:true,sfxLvl:2},ac(){},out(){return null},tone(...a){tones.push(a);}},rotor={isConnected:true};
 const ctx={window:{addEventListener:(n,f)=>listeners.add(f),removeEventListener:(n,f)=>listeners.delete(f)},document:{hidden:false},performance:{now:()=>at},requestAnimationFrame:f=>(frames.set(++id,f),id),cancelAnimationFrame:i=>frames.delete(i),getComputedStyle:()=>({transform:angle}),DOMMatrix:class{constructor(v){this.a=Math.cos(v*Math.PI/180);this.b=Math.sin(v*Math.PI/180);}}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('ui/park/wheel-sound.js','utf8').replace('export function','function'),ctx);
 const sound=ctx.createWheelSound(fc,rotor,13);return {sound,tones,fc,ctx,rotor,frames,listeners,step(a,ms){angle=a;at+=ms;const f=[...frames.values()][0];frames.clear();f?.(at);}};
}
test('wheel uses the original two-note wooden timbre on actual pocket crossings, then stops',()=>{
 const x=setup();x.sound.start();x.step(2,40);assert.equal(x.tones.length,0);x.step(20,40);assert.equal(x.tones.length,2);
 assert.deepEqual(x.tones.map(a=>a.slice(1)),[[.026,'triangle',.075],[.018,'sine',.055]]);
 x.step(21,40);assert.equal(x.tones.length,2);x.step(55,40);assert.equal(x.tones.length,4);
 x.sound.stop();assert.equal(x.frames.size,0);assert.equal(x.listeners.size,0);
});
test('mute, hidden page and detached wheel never play ticks',()=>{
 const x=setup();x.sound.start();x.fc.state.sfxLvl=0;x.step(30,40);x.fc.state.sfxLvl=2;x.fc.state.sound=false;x.step(60,40);
 x.fc.state.sound=true;x.ctx.document.hidden=true;x.step(90,40);assert.equal(x.tones.length,0);
 x.rotor.isConnected=false;x.step(120,40);assert.equal(x.frames.size,0);
});
test('sound failure is isolated and does not leave animation callbacks after stop',()=>{
 const x=setup();x.fc.tone=()=>{throw Error('Unavailable audio');};x.sound.start();assert.doesNotThrow(()=>x.step(30,40));x.sound.stop();assert.equal(x.frames.size,0);
});
