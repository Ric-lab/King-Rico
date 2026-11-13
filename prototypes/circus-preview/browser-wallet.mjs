import {createPreview} from './model.mjs';
import engine from '../../cloud/engine.cjs';
const KEY='kingRico.parque.mobile-preview.v1',networkFetch=globalThis.fetch.bind(globalThis);
let tail=Promise.resolve();
// Prévia engatilhada: sem ?demo= o 1º giro de cada carregamento já mostra a última mudança. ?demo=off = jogo normal.
const DEFAULT_DEMO='ticket';
const demoMode=(q=>q==='off'?null:q||DEFAULT_DEMO)(new URLSearchParams(location.search).get('demo'));
let demoSpin=['bigwin','spacewin','tony','tucker','ray','wheel','cedar','ticket'].includes(demoMode);
// Seletor da prévia (menu → 🎯): o modo escolhido vale para TODOS os giros até trocar; recarregar zera (aleatório).
let forced=null;
const SYM={ticket:10,circus:2,cape:0,coin:6,diamond:8,crown:7,cedar:5};
const trio=s=>{const f=[0,2,6,7,8,10].filter(x=>x!==s);return [s,s,s,f[0],f[1],f[2],f[3],f[4],f[0]];};
const gridFor=m=>m in SYM?trio(SYM[m]):m==='peach'?[11,11,0,2,6,7,8,10,2]:m==='lose'?[0,2,6,7,8,10,2,6,0]:m==='spacewin'?Array(9).fill(7):m==='bigwin'?[7,7,7,7,7,7,0,2,6]:[7,7,7,7,7,7,0,2,6];
const PICKS=[
 ['ticket','Ingresso',"/assets/symbols-v7.webp|1200% 100%|90.909% 50%"],['circus','Circo',"/assets/symbols-v7.webp|1200% 100%|18.182% 50%"],['cape','Capa',"/assets/symbols-v7.webp|1200% 100%|0.000% 50%"],['coin','Moeda',"/assets/symbols-v7.webp|1200% 100%|54.545% 50%"],
 ['diamond','Diamante',"/assets/symbols-v7.webp|1200% 100%|72.727% 50%"],['crown','Coroa',"/assets/symbols-v7.webp|1200% 100%|63.636% 50%"],['tony','Tiger','/assets/tony/head.webp|contain|50% 50%'],['tucker','Toucan','/assets/tucker/head.webp|contain|50% 50%'],
 ['ray','Ray','/assets/ray/head-v1.webp|contain|50% 50%'],['cedar','Cedro',"/assets/symbols-v7.webp|1200% 100%|45.455% 50%"],['peach','Happeach',"/assets/symbols-v7.webp|1200% 100%|100.000% 50%"],['controller','Controle','/ui/park/controller-reserved.svg|contain|50% 50%',true],
 ['lose','Sem trinca',''],['bigwin','Big win',''],['spacewin','Super win',''],['wheel','Roleta','']];
function badge(){let b=document.getElementById('kr-preview-pick');if(!forced){b?.remove();return;}if(!b){b=document.createElement('button');b.id='kr-preview-pick';b.type='button';b.onclick=openPicker;b.style.cssText='position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:99998;padding:8px 16px;border:0;border-radius:999px;font:800 15px/1 Baloo\\ 2,system-ui,sans-serif;color:#4a1a00;background:linear-gradient(180deg,#fff1a8,#f0a018);box-shadow:0 3px 0 #8a4a05,0 6px 14px #0006';document.body.append(b);}b.textContent='🎯 '+(PICKS.find(p=>p[0]===forced)?.[1]||forced)+' · trocar';}
function openPicker(){document.getElementById('kr-preview-picker')?.remove();const o=document.createElement('div');o.id='kr-preview-picker';o.setAttribute('role','dialog');
 o.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(12,2,24,.88);font-family:Baloo\\ 2,system-ui,sans-serif';
 const card=document.createElement('div');card.style.cssText='width:min(92vw,420px);padding:16px;border-radius:22px;background:linear-gradient(180deg,#5a1a86,#2a0846);box-shadow:0 0 0 3px #f0b41f,0 16px 40px #000a;display:flex;flex-direction:column;gap:12px';
 card.innerHTML='<div style="text-align:center;font-weight:800;font-size:18px;letter-spacing:1px;color:#ffd257">PRÓXIMOS GIROS (PRÉVIA)</div>';
 const g=document.createElement('div');g.style.cssText='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px';
 const mk=(id,label,img,off)=>{const b=document.createElement('button');b.type='button';const on=forced===id;b.disabled=!!off;
  b.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 2px;border:0;border-radius:14px;cursor:pointer;color:#fff3c4;font-weight:800;font-size:13px;line-height:1.1;font-family:inherit;background:'+(on?'linear-gradient(180deg,#fff1a8,#f0a018)':'rgba(255,255,255,.1)')+';box-shadow:inset 0 0 0 2px '+(on?'#fff':'rgba(255,210,87,.35)')+';opacity:'+(off?.4:1)+(on?';color:#4a1a00':'');
  if(img){const [u,sz,pos]=img.split('|');const i=document.createElement('div');i.style.cssText='width:44px;height:44px;background:url('+u+') no-repeat;background-size:'+sz+';background-position:'+pos;b.append(i);}
  else{const i=document.createElement('div');i.style.cssText='width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:26px';i.textContent=id==='lose'?'✕':id==='wheel'?'◎':id==='random'?'🎲':'★';b.append(i);}
  b.append(document.createTextNode(label+(off?' (em breve)':'')));b.onclick=()=>{forced=id==='random'?null:id;o.remove();badge();};g.append(b);};
 mk('random','Aleatório','');PICKS.forEach(p=>mk(...p));card.append(g);
 const ok=document.createElement('button');ok.type='button';ok.textContent='FECHAR';ok.style.cssText='align-self:center;padding:10px 40px;border:0;border-radius:999px;font-weight:800;font-size:18px;font-family:inherit;color:#4a1a00;background:linear-gradient(180deg,#ffe27a,#f0a018);box-shadow:0 4px 0 #8a4a05;cursor:pointer';ok.onclick=()=>o.remove();card.append(ok);
 o.onclick=e=>{if(e.target===o)o.remove();};o.append(card);document.body.append(o);}
globalThis.KingRicoPreviewPicker=openPicker;
async function execute(data){
 let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
 if(demoMode==='tucker'&&data.action==='state')data.previewTuckerSetup=true;
 const mode=forced||demoMode,demo=(forced||demoSpin)&&data.action==='spin'&&data.game==='circus';
 const symbols=engine.slotSymbols(6);
 const total=symbols.reduce((n,s)=>n+s.w,0),draws=demo?(forced?gridFor(mode):mode==='ticket'?[10,10,10,0,2,6,7,8,5]:mode==='cedar'?[5,5,5,0,2,6,7,8,10]:mode==='spacewin'?Array(9).fill(7):[7,7,7,7,7,7,0,2,6]).flatMap(symbol=>symbol===5?[.1]:symbol===11?[.001]:[.99,(symbols.slice(0,symbol).reduce((n,s)=>n+s.w,0)+symbols[symbol].w/2)/total]):[];
 if(demo&&mode!=='tony')draws.unshift(.99);
 if(demo&&mode==='tony'){data.previewTony=true;draws.splice(0,draws.length,0,.5);}
 if(demo&&mode==='tucker')data.previewTucker=true;
 if(demo&&mode==='ray')data.previewRay=true;if(demo&&mode==='wheel')data.previewWheel=true;
 const model=createPreview(saved||{},demo&&mode!=='wheel'?()=>draws.shift()??.99:Math.random);
 try{const result=await model.run(data);if(demo&&!forced)demoSpin=false;localStorage.setItem(KEY,JSON.stringify(model.exportState()));return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});}
 catch(e){return new Response(JSON.stringify({error:e.message}),{status:400,headers:{'Content-Type':'application/json'}});}
}
globalThis.fetch=(url,options={})=>{
 const target=new URL(typeof url==='string'?url:url.url,location.href);
 if(target.origin!==location.origin||target.pathname!=='/api/play')return networkFetch(url,options);
 const data=JSON.parse(options.body||'{}');
 if(navigator.locks?.request)return navigator.locks.request(KEY,()=>execute(data));
 const op=tail.then(()=>execute(data));tail=op.catch(()=>{});return op;
};
