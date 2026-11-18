// Cedro na slot (só prévia): depois do giro, se uma linha tem 2 iguais pagantes e 1 diferente, a casa diferente brilha.
// Tocar nela gasta 1 cedro, ela vira o símbolo que falta e a linha paga (aposta × pagamento). 1 uso por giro.
import {cedros} from './trinca.js';
let engine=null;import('../../cloud/engine.cjs').then(m=>{engine=m.default||m;}).catch(()=>{});
const post=async body=>{const r=await fetch(location.origin+'/api/play',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:crypto.randomUUID(),...body})});return r.json();};
window.KingRicoPreviewCredit=async coins=>{try{const j=await post({action:'preview-credit',units:Math.round(coins*100)});const fc=window.__fc;if(fc&&j.player){fc._cloudDeferred=j.player;fc.applyCloudPlayer?.();}}catch{}};
let offers=[];const clear=()=>{offers.forEach(o=>o.remove());offers=[];};
function offer(fc,res){clear();const g=res?.outcome?.grid;if(!engine||!Array.isArray(g)||g.length!==9||cedros.get()<1)return;
 const syms=engine.slotSymbols?.(6)||engine.SYMBOLS,bet=fc.state?.bet??res.outcome.bet??1,lines=engine.ALL_LINES,won=new Set((res.outcome.lines||[]).map(String));
 const found=[];lines.forEach((L,li)=>{if(won.has(String(li)))return;const [a,b,c]=L.map(i=>g[i]);
  for(const [x,y,z,odd] of [[a,b,c,L[2]],[a,c,b,L[1]],[b,c,a,L[0]]])if(x===y&&x!==z&&(syms[x]?.pay||0)>0&&!found.some(f=>f.cell===odd)){found.push({cell:odd,sym:x,pay:syms[x].pay,from:L.find(i=>g[i]===x)});}});
 if(!found.length)return;
 const wait=()=>new Promise(r=>{const t0=Date.now(),k=setInterval(()=>{if(!fc.state?.spinning&&!fc.state?.busy||Date.now()-t0>8000){clearInterval(k);r();}},150);});
 wait().then(()=>{const cells=[...document.querySelectorAll('.park-reel-cell')];if(cells.length<9)return;
  for(const f of found){const el=cells[f.cell],src=cells[f.from];if(!el||!src)continue;const r=el.getBoundingClientRect(),o=document.createElement('button');o.type='button';o.setAttribute('aria-label','Usar cedro');
   o.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:60;border:0;border-radius:14px;cursor:pointer;background:transparent;box-shadow:0 0 0 4px #6cf096,0 0 22px 6px #6cf096aa;animation:krCedroPulse 1s ease-in-out infinite`;
   o.innerHTML='<i style="position:absolute;right:4px;top:4px;width:30px;height:30px;background:url(/assets/symbols/sym-scepter.png) center/contain no-repeat;filter:drop-shadow(0 2px 2px #0008)"></i>';
   o.onclick=async()=>{if(cedros.get()<1){clear();return;}cedros.set(cedros.get()-1);clear();el.innerHTML=src.innerHTML;el.animate?.([{transform:'scale(1.25)',filter:'brightness(2)'},{transform:'scale(1)',filter:'none'}],{duration:420});
    try{fc.sfxWin?.(f.pay>=5);navigator.vibrate?.([30,30,60]);}catch{}const coins=Math.round(bet*f.pay*100)/100;await window.KingRicoPreviewCredit(coins);};
   document.body.append(o);offers.push(o);}});}
export function installCedroUse(){const fc=window.__fc;if(!fc||fc._cedroUse)return;fc._cedroUse=true;
 if(!document.getElementById('kr-cedro-kf')){const s=document.createElement('style');s.id='kr-cedro-kf';s.textContent='@keyframes krCedroPulse{50%{box-shadow:0 0 0 6px #b4ffc8,0 0 34px 10px #6cf096}}';document.head.append(s);}
 const orig=fc._parkChargeConfirmed;fc._parkChargeConfirmed=(b,res,a)=>{const v=orig?.(b,res,a);try{offer(fc,res);}catch{}return v;};
 document.addEventListener('pointerdown',e=>{if(e.target.closest?.('[data-spin-btn]'))clear();},true);}
