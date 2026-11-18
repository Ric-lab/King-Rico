// Cedro na slot (só prévia). Depois que os rolos PARAM, se uma linha tem 2 iguais pagantes + 1 diferente:
// escurece o resto, acende só as 3 casas da linha, a casa que falta pulsa com o cedro e um dedo mostrando "toque".
// Tocar: o cedro voa das bolinhas até a casa, a casa gira e vira o símbolo, a linha acende, toca a vitória e o prêmio entra no saldo.
// Só a melhor chance (maior pagamento) é oferecida. 1 uso por giro; girar de novo cancela.
import {cedros} from './trinca.js';
let engine=null;import('../../cloud/engine.cjs').then(m=>{engine=m.default||m;}).catch(()=>{});
const post=async body=>{const r=await fetch(location.origin+'/api/play',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:crypto.randomUUID(),...body})});return r.json();};
window.KingRicoPreviewCredit=async coins=>{try{const j=await post({action:'preview-credit',units:Math.round(coins*100)});const fc=window.__fc;if(fc&&j.player){fc._cloudDeferred=j.player;fc.applyCloudPlayer?.();}}catch{}};
let layer=null,token=0;const clear=()=>{token++;layer?.remove();layer=null;};
const reelsStopped=()=>new Promise(res=>{const t0=Date.now(),k=setInterval(()=>{const busy=document.querySelector('.park-reel-cell[data-reel-spinning="true"]')||window.__fc?.state?.spinning;if(!busy||Date.now()-t0>9000){clearInterval(k);setTimeout(res,450);}},120);});
function best(res){const g=res?.outcome?.grid;if(!engine||!Array.isArray(g)||g.length!==9)return null;const syms=engine.slotSymbols?.(6)||engine.SYMBOLS,won=new Set((res.outcome.lines||[]).map(String));let b=null;
 engine.ALL_LINES.forEach((L,li)=>{if(won.has(String(li)))return;const v=L.map(i=>g[i]);for(let k=0;k<3;k++){const a=v[(k+1)%3],c=v[(k+2)%3];if(a===c&&a!==v[k]&&(syms[a]?.pay||0)>0&&(!b||syms[a].pay>b.pay))b={line:L,cell:L[k],from:L[(k+1)%3],pay:syms[a].pay};}});return b;}
async function offer(fc,res){clear();if(cedros.get()<1)return;const my=++token;await reelsStopped();if(my!==token)return;const b=best(res);if(!b||cedros.get()<1)return;
 const cells=[...document.querySelectorAll('.park-reel-cell')];if(cells.length<9)return;const R=i=>cells[i].getBoundingClientRect(),t=R(b.cell);
 layer=document.createElement('div');layer.id='kr-cedro-offer';layer.style.cssText='position:fixed;inset:0;z-index:60;pointer-events:none';
 const holes=b.line.map(i=>{const r=R(i);return `<rect x="${r.left}" y="${r.top}" width="${r.width}" height="${r.height}" rx="12"/>`;}).join('');
 layer.innerHTML=`<svg width="100%" height="100%" style="position:absolute;inset:0"><defs><mask id="krCm"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${holes}</g></mask></defs><rect width="100%" height="100%" fill="rgba(20,4,36,.62)" mask="url(#krCm)"/></svg>`+
  b.line.filter(i=>i!==b.cell).map(i=>{const r=R(i);return `<i style="position:absolute;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:12px;box-shadow:0 0 0 3px #ffd257,0 0 16px #ffd257aa"></i>`;}).join('')+
  `<button type="button" aria-label="Usar cedro" style="position:absolute;left:${t.left}px;top:${t.top}px;width:${t.width}px;height:${t.height}px;border:0;border-radius:12px;background:rgba(108,240,150,.18);cursor:pointer;pointer-events:auto;box-shadow:0 0 0 4px #6cf096,0 0 26px 8px #6cf096aa;animation:krCedroPulse .9s ease-in-out infinite">
   <i style="position:absolute;inset:14%;background:url(/assets/symbols/sym-scepter.png) center/contain no-repeat;filter:drop-shadow(0 4px 4px #0009);animation:krCedroBob .9s ease-in-out infinite"></i>
   <i style="position:absolute;left:58%;top:62%;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.92);box-shadow:0 0 0 7px rgba(255,255,255,.3);animation:krCedroTap 1.2s ease-in-out infinite"></i></button>`;
 document.body.append(layer);try{navigator.vibrate?.(20);fc.bell?.(1319,.2,.05);}catch{}
 layer.querySelector('button').onclick=async()=>{if(cedros.get()<1)return clear();cedros.set(cedros.get()-1);const el=cells[b.cell],src=cells[b.from],btn=layer.querySelector('button');btn.style.pointerEvents='none';btn.style.animation='none';
  const dots=document.getElementById('kr-cedro-dots')?.getBoundingClientRect(),fly=document.createElement('i');fly.style.cssText=`position:fixed;z-index:61;left:0;top:0;width:60px;height:60px;background:url(/assets/symbols/sym-scepter.png) center/contain no-repeat;filter:drop-shadow(0 4px 4px #0009)`;document.body.append(fly);
  const x0=(dots?dots.left+dots.width/2:innerWidth/2)-30,y0=(dots?dots.top:innerHeight/2)-30,x1=t.left+t.width/2-30,y1=t.top+t.height/2-30;try{fc.sfxWhoosh?.();}catch{}
  await fly.animate([{transform:`translate(${x0}px,${y0}px) scale(.5)`},{transform:`translate(${(x0+x1)/2}px,${Math.min(y0,y1)-80}px) scale(1.2)`,offset:.5},{transform:`translate(${x1}px,${y1}px) scale(1)`}],{duration:520,easing:'cubic-bezier(.4,0,.5,1)'}).finished.catch(()=>{});fly.remove();
  btn.innerHTML='';try{navigator.vibrate?.([30,30,60]);}catch{}
  await el.animate([{transform:'rotateY(0)'},{transform:'rotateY(90deg)'}],{duration:160,easing:'ease-in'}).finished.catch(()=>{});el.innerHTML=src.innerHTML;
  await el.animate([{transform:'rotateY(-90deg) scale(1.15)',filter:'brightness(2)'},{transform:'rotateY(0) scale(1)',filter:'none'}],{duration:260,easing:'ease-out'}).finished.catch(()=>{});
  layer.querySelectorAll('i').forEach(i=>i.style.boxShadow='0 0 0 4px #fff3b0,0 0 26px #ffd257');btn.style.boxShadow='0 0 0 4px #fff3b0,0 0 26px #ffd257';btn.style.background='transparent';
  try{fc.sfxWin?.(b.pay>=5);}catch{}const bet=fc.state?.bet??res.outcome.bet??1,coins=Math.round(bet*b.pay*100)/100;
  const tag=document.createElement('b');tag.textContent='+'+coins.toLocaleString('pt-BR');tag.style.cssText=`position:fixed;z-index:62;left:${t.left+t.width/2}px;top:${t.top}px;transform:translate(-50%,-50%);font:800 34px/1 'Baloo 2',sans-serif;color:#fff3c4;-webkit-text-stroke:3px #4a1a00;paint-order:stroke;text-shadow:0 3px 0 #4a1a00`;document.body.append(tag);
  tag.animate([{transform:'translate(-50%,-20%) scale(.5)',opacity:0},{transform:'translate(-50%,-80%) scale(1.15)',opacity:1,offset:.3},{transform:'translate(-50%,-140%) scale(1)',opacity:0}],{duration:1300}).onfinish=()=>tag.remove();
  await window.KingRicoPreviewCredit(coins);try{fc.sfxCoins?.();}catch{}setTimeout(clear,1100);};}
export function installCedroUse(){const fc=window.__fc;if(!fc||fc._cedroUse)return;fc._cedroUse=true;
 if(!document.getElementById('kr-cedro-kf')){const s=document.createElement('style');s.id='kr-cedro-kf';s.textContent='@keyframes krCedroPulse{50%{box-shadow:0 0 0 6px #b4ffc8,0 0 36px 12px #6cf096}}@keyframes krCedroBob{50%{transform:translateY(-6px) rotate(-6deg)}}@keyframes krCedroTap{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(.8);opacity:.6}}';document.head.append(s);}
 const orig=fc._parkChargeConfirmed;fc._parkChargeConfirmed=(b,res,a)=>{const v=orig?.(b,res,a);offer(fc,res).catch(()=>{});return v;};
 document.addEventListener('pointerdown',e=>{if(e.target.closest?.('[data-spin-btn]'))clear();},true);addEventListener('resize',clear);}
