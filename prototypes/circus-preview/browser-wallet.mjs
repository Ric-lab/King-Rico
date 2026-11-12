import {createPreview} from './model.mjs';
import engine from '../../cloud/engine.cjs';
const KEY='kingRico.parque.mobile-preview.v1',networkFetch=globalThis.fetch.bind(globalThis);
let tail=Promise.resolve();
// Prévia engatilhada: sem ?demo= o 1º giro de cada carregamento já mostra a última mudança. ?demo=off = jogo normal.
const DEFAULT_DEMO=null;
const demoMode=(q=>q==='off'?null:q||DEFAULT_DEMO)(new URLSearchParams(location.search).get('demo'));
let demoSpin=['bigwin','spacewin','tony','tucker','ray','wheel'].includes(demoMode);
async function execute(data){
 let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
 if(demoMode==='tucker'&&data.action==='state')data.previewTuckerSetup=true;
 const demo=demoSpin&&data.action==='spin'&&data.game==='circus';
 const symbols=engine.slotSymbols(6);
 const total=symbols.reduce((n,s)=>n+s.w,0),draws=demo?(demoMode==='spacewin'?Array(9).fill(7):[8,8,8,0,2,6,7,10,5]).flatMap(symbol=>[.99,(symbols.slice(0,symbol).reduce((n,s)=>n+s.w,0)+symbols[symbol].w/2)/total]):[];
 if(demo&&demoMode!=='tony')draws.unshift(.99);
 if(demo&&demoMode==='tony'){data.previewTony=true;draws.splice(0,draws.length,0,.5);}
 if(demo&&demoMode==='tucker')data.previewTucker=true;
 if(demo&&demoMode==='ray')data.previewRay=true;if(demo&&demoMode==='wheel')data.previewWheel=true;
 const model=createPreview(saved||{},demo&&demoMode!=='wheel'?()=>draws.shift()??.99:Math.random);
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
