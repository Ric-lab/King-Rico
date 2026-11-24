const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
// Execute the actual simple Rules helper bodies against Map.get adapters.
// Compare both decisions and resourceDice arguments with the pre-refactor rule.
test('lazy die metadata validation preserves all old predicates and arguments',()=>{
 const rules=fs.readFileSync('firestore.rules','utf8');
 const source=name=>{const a=rules.indexOf('    function '+name+'('),b=rules.indexOf('\n    function ',a+1);return rules.slice(a,b);};
 const wrap=value=>value&&typeof value==='object'?new Proxy(value,{get(o,k){if(k==='get')return (key,fallback)=>Object.hasOwn(o,key)?wrap(o[key]):fallback;return wrap(o[k]);}}):value;
 const mark=(e,n)=>({n,version:e.version,value:e.dice?.value??null});
 const run=new Function('resourceDice','v6Maximum','int',source('boundedDiePayload')+'\n'+source('dicePayload')+'\nreturn dicePayload;');
 const get=(o,k,fallback=null)=>Object.hasOwn(o,k)?o[k]:fallback;
 function original(x,stock,wheels,maximum){
  const t=get(x,'tony'),bird=get(x,'tucker'),e=t!=null?t:bird!=null?bird:get(x,'ray');
  const modern=e!=null&&get(e,'version',0)===5,n=!modern?0:t!=null?maximum:bird!=null?wheels:stock;
  return !modern?true:n===0?get(e,'dice')==null:mark(e,Math.min(5,n));
 }
 const values=[undefined,null,{version:3},{version:4,dice:{value:0}},{version:5},{version:5,dice:{value:0}},{version:5,dice:{value:1}}];
 let count=0;
 for(const maximum of [0,1,5,25]){
  const validate=run(mark,()=>maximum*1000,Math.trunc);
  for(const t of values)for(const bird of values)for(const ray of values)for(let stock=0;stock<=5;stock++)for(let wheels=0;wheels<=4;wheels++){
   const x={tony:t,tucker:bird,ray};
   assert.deepEqual(validate(wrap(x),wrap({peaches:wheels}),wrap({result:{bet:10}}),wrap({cedros:stock})),original(x,stock,wheels,maximum));count++;
  }
 }
 assert.equal(count,41160);
});
