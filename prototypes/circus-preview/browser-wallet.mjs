import {createPreview} from './model.mjs';
import engine from '../../cloud/engine.cjs';
const KEY='kingRico.parque.mobile-preview.v1',networkFetch=globalThis.fetch.bind(globalThis);
let tail=Promise.resolve();
const demoMode=new URLSearchParams(location.search).get('demo');
let demoSpin=['bigwin','spacewin'].includes(demoMode);
async function execute(data){
 let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
 const demo=demoSpin&&data.action==='spin'&&data.game==='circus';
 const total=engine.SYMBOLS.reduce((n,s)=>n+s.w,0),draws=demo?(demoMode==='spacewin'?Array(9).fill(2):[8,8,8,0,1,2,3,4,5]).flatMap(symbol=>[.99,(engine.SYMBOLS.slice(0,symbol).reduce((n,s)=>n+s.w,0)+engine.SYMBOLS[symbol].w/2)/total]):[];
 const model=createPreview(saved||{},demo?()=>draws.shift()??.99:Math.random);
 try{const result=await model.run(data);if(demo)demoSpin=false;localStorage.setItem(KEY,JSON.stringify(model.exportState()));return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});}
 catch(e){return new Response(JSON.stringify({error:e.message}),{status:400,headers:{'Content-Type':'application/json'}});}
}
globalThis.fetch=(url,options={})=>{
 const target=new URL(typeof url==='string'?url:url.url,location.href);
 if(target.origin!==location.origin||target.pathname!=='/api/play')return networkFetch(url,options);
 const data=JSON.parse(options.body||'{}');
 if(navigator.locks?.request)return navigator.locks.request(KEY,()=>execute(data));
 const op=tail.then(()=>execute(data));tail=op.catch(()=>{});return op;
};
