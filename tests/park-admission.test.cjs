const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({paid=false,loading=true}={}){
 let resolveReady,resolveEntry,choices=0;
 const handlers={},watches=[],observers=[];
 const Cloud={player:null,ready:new Promise(r=>resolveReady=r),watch:fn=>watches.push(fn)};
 const document={documentElement:{dataset:{}},body:{},getElementById:()=>loading?{}:null};
 const context={document,window:{addEventListener:(name,fn)=>handlers[name]=fn},MutationObserver:class{constructor(fn){observers.push(fn);}observe(){}disconnect(){}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../ui/park/admission.js'),'utf8').replace('export function','function')+'\nthis.install=installAdmission;',context);
 context.install({Cloud,authorized:()=>paid,requestEntry:()=>{choices++;return new Promise(r=>resolveEntry=r);}});
 return {document,get choices(){return choices;},ready(){Cloud.player={};resolveReady();},loaded(){loading=false;observers.forEach(fn=>fn());},confirm(){paid=true;watches.forEach(fn=>fn());resolveEntry();},unpaid(){paid=false;watches.forEach(fn=>fn());},event(type,exempt=false){const e={type,key:'Enter',target:{closest:()=>exempt},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};handlers[type](e);return e;}};
}
test('blocks early input, waits for loading and opens admission before a play',async()=>{
 const f=fixture();assert.equal(f.event('pointerdown').stopped,true);
 f.ready();await tick();assert.equal(f.choices,0);
 f.loaded();await tick();assert.equal(f.choices,1);
 assert.equal(f.event('pointerup').stopped,true);assert.equal(f.event('click').stopped,true);
 assert.equal(f.event('click',true).stopped,undefined);
 f.confirm();await tick();assert.equal(f.document.documentElement.dataset.parkAdmission,'ready');
 assert.equal(f.event('pointerdown').stopped,undefined);
});
test('a new entry discards the triggering gesture and never replays it',async()=>{
 const f=fixture({paid:true,loading:false});f.ready();await tick();assert.equal(f.choices,0);
 f.unpaid();for(const type of ['pointerdown','pointerup','click','keydown'])assert.equal(f.event(type).stopped,true);
 await tick();assert.equal(f.choices,1);f.confirm();await tick();assert.equal(f.choices,1);
 assert.equal(f.event('click').stopped,undefined);
});
test('authorized entry and restored round do not prompt again',async()=>{
 const f=fixture({paid:true,loading:false});f.ready();await tick();
 assert.equal(f.choices,0);assert.equal(f.event('click').stopped,undefined);
});
for(const [name,index]of [['clown',0],['penalty',1],['flying',1],['fingo',1]])test(`${name}: confirming entry cannot execute a previously rejected play`,async()=>{
 let calls=0,entries=0;
 const Cloud={park:{passes:{}},player:{},watch(){},spin:async()=>({}),[name]:async(...args)=>{calls++;return {bet:args[index]};}};
 for(const other of ['clown','penalty','flying','fingo'])Cloud[other]??=async()=>({});
 const context={layout:{},CustomEvent:class{},window:{KingRicoCloud:Cloud,dispatchEvent(){}},document:{readyState:'loading',querySelector:()=>({content:name}),addEventListener(){}},crypto:{randomUUID:()=>''},setTimeout,clearTimeout};
 const source=fs.readFileSync(require.resolve('../ui/park/index.js'),'utf8').replace(/^import .*;\n/gm,'').replace('export const format','const format');
 vm.runInNewContext(source,context);
 context.choose=()=>{entries++;return Promise.resolve('coins');};vm.runInNewContext('entry=choose;',context);
 await assert.rejects(Cloud[name]('shoot',10,'round',0,1000),e=>e.code==='king-rico/entry-required');
 await tick();assert.equal(entries,1);assert.equal(calls,0);
 Cloud.park.passes[name]={method:'coins'};vm.runInNewContext('sync();',context);
 await tick();assert.equal(calls,0);
 const result=await Cloud[name]('shoot',10,'round',0,1000);assert.equal(calls,1);assert.equal(result.bet,25);
 Cloud.player[name+'Round']={betUnits:4000};delete Cloud.park.passes[name];vm.runInNewContext('sync();',context);
 const continued=await Cloud[name]('shoot',10,'round',1,1000);assert.equal(continued.bet,40);assert.equal(entries,1);
});
