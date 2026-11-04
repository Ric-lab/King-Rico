import {createPreview} from './model.mjs';
const KEY='kingRico.parque.mobile-preview.v1',networkFetch=globalThis.fetch.bind(globalThis);
let tail=Promise.resolve();
async function execute(data){
 let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
 const model=createPreview(saved||{});
 try{const result=await model.run(data);localStorage.setItem(KEY,JSON.stringify(model.exportState()));return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});}
 catch(e){return new Response(JSON.stringify({error:e.message}),{status:400,headers:{'Content-Type':'application/json'}});}
}
globalThis.fetch=(url,options={})=>{
 const target=new URL(typeof url==='string'?url:url.url,location.href);
 if(target.origin!==location.origin||target.pathname!=='/api/play')return networkFetch(url,options);
 const data=JSON.parse(options.body||'{}');
 if(navigator.locks?.request)return navigator.locks.request(KEY,()=>execute(data));
 const op=tail.then(()=>execute(data));tail=op.catch(()=>{});return op;
};
