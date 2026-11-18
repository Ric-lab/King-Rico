// Coroa coringa do Rei (só prévia). Prêmio do Royal Rico: 3 (ou 4) giros com a coroa fixa na casa do meio.
// A coroa vale por qualquer símbolo pagante: linhas que passam pelo meio e têm as outras 2 casas iguais pagam.
// Sem decisão do jogador: é só girar. Contador = coroinhas embaixo do WIN.
let engine=null;import('../../cloud/engine.cjs').then(m=>{engine=m.default||m;}).catch(()=>{});
const KEY='kingRico.preview.wildSpins',CROWN='/assets/symbols/sym-crown-lossless.webp';
export const wild={get:()=>Math.max(0,Math.min(4,+localStorage.getItem(KEY)||0)),set:n=>{localStorage.setItem(KEY,String(Math.max(0,Math.min(4,n))));paint();}};
const post=async body=>{const r=await fetch(location.origin+'/api/play',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:crypto.randomUUID(),...body})});return r.json();};
window.KingRicoPreviewCredit=async coins=>{try{const j=await post({action:'preview-credit',units:Math.round(coins*100)});const fc=window.__fc;if(fc&&j.player){fc._cloudDeferred=j.player;fc.applyCloudPlayer?.();}}catch{}};
const center=()=>document.querySelectorAll('.park-reel-cell')[4];
let holding=false;
function paint(){const n=wild.get();let c=document.getElementById('kr-wild-crown'),d=document.getElementById('kr-wild-count');
 document.getElementById('kr-cedro-dots')?.remove();
 if(!n){d?.remove();if(!holding)c?.remove();return;}
 const cell=center();if(!cell)return;const r=cell.getBoundingClientRect();
 if(!c){c=document.createElement('div');c.id='kr-wild-crown';c.innerHTML=`<i></i><b>CORINGA</b>`;document.body.append(c);c.animate([{transform:'scale(2.2)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:500,easing:'cubic-bezier(.2,1.3,.4,1)'});}
 c.style.cssText=`position:fixed;z-index:40;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:12px;pointer-events:none;background:radial-gradient(circle,#fff6c8 0,#ffd257 55%,#f0a018 100%);box-shadow:0 0 0 3px #fff3b0,0 0 22px 6px #ffd257aa;animation:krWildGlow 1.6s ease-in-out infinite`;
 c.querySelector('i').style.cssText=`position:absolute;inset:8% 12% 22%;background:url(${CROWN}) center/contain no-repeat;filter:drop-shadow(0 4px 3px #6b2e0599)`;
 c.querySelector('b').style.cssText="position:absolute;left:0;right:0;bottom:5%;text-align:center;font:800 13px/1 'Baloo 2',sans-serif;letter-spacing:1px;color:#6b2e05";
 const plaque=document.querySelector('.park-prize-value');if(!plaque)return;
 if(!d){d=document.createElement('div');d.id='kr-wild-count';d.setAttribute('aria-label','Giros com coringa');plaque.parentElement.append(d);}
 d.style.cssText=`position:absolute;z-index:30;left:${plaque.offsetLeft+plaque.offsetWidth/2-40}px;top:${plaque.offsetTop+plaque.offsetHeight-6}px;width:80px;display:flex;justify-content:center;gap:3px;pointer-events:none`;
 d.innerHTML=Array.from({length:n},()=>`<i style="width:16px;height:16px;background:url(${CROWN}) center/contain no-repeat;filter:drop-shadow(0 1px 1px #0008)"></i>`).join('');}
const reelsStopped=()=>new Promise(res=>{const t0=Date.now(),k=setInterval(()=>{if(!document.querySelector('.park-reel-cell[data-reel-spinning="true"]')||Date.now()-t0>9000){clearInterval(k);setTimeout(res,300);}},120);});
async function onSpin(fc,res){const n=wild.get();if(!n)return;const g=res?.outcome?.grid;holding=true;wild.set(n-1);try{await score(fc,res,g);}finally{holding=false;setTimeout(paint,900);}}
async function score(fc,res,g){
 if(!engine||!Array.isArray(g)||g.length!==9)return;await reelsStopped();
 const syms=engine.slotSymbols?.(6)||engine.SYMBOLS,won=new Set((res.outcome.lines||[]).map(String));let pay=0;const hit=[];
 engine.ALL_LINES.forEach((L,li)=>{if(!L.includes(4)||won.has(String(li)))return;const o=L.filter(i=>i!==4).map(i=>g[i]);if(o[0]===o[1]&&(syms[o[0]]?.pay||0)>0){pay+=syms[o[0]].pay;hit.push(L);}});
 const cells=[...document.querySelectorAll('.park-reel-cell')];
 if(!pay)return;
 hit.forEach(L=>L.forEach(i=>{const r=cells[i]?.getBoundingClientRect();if(!r)return;const f=document.createElement('i');f.style.cssText=`position:fixed;z-index:41;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:12px;pointer-events:none;box-shadow:0 0 0 4px #fff3b0,0 0 26px #ffd257`;document.body.append(f);f.animate([{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.8},{opacity:0}],{duration:1500}).onfinish=()=>f.remove();}));
 try{fc.sfxWin?.(pay>=5);navigator.vibrate?.([30,30,70]);}catch{}
 const bet=fc.state?.bet??res.outcome.bet??1,coins=Math.round(bet*pay*100)/100,r=center()?.getBoundingClientRect();
 if(r){const t=document.createElement('b');t.textContent='+'+coins.toLocaleString('pt-BR');t.style.cssText=`position:fixed;z-index:42;left:${r.left+r.width/2}px;top:${r.top}px;transform:translate(-50%,-50%);font:800 34px/1 'Baloo 2',sans-serif;color:#fff3c4;-webkit-text-stroke:3px #4a1a00;paint-order:stroke;text-shadow:0 3px 0 #4a1a00;pointer-events:none`;document.body.append(t);
  t.animate([{transform:'translate(-50%,-20%) scale(.5)',opacity:0},{transform:'translate(-50%,-80%) scale(1.15)',opacity:1,offset:.3},{transform:'translate(-50%,-140%) scale(1)',opacity:0}],{duration:1400}).onfinish=()=>t.remove();}
 await window.KingRicoPreviewCredit(coins);try{fc.sfxCoins?.();}catch{}}
export function installWildCrown(){const fc=window.__fc;if(!fc||fc._wildCrown)return;fc._wildCrown=true;
 if(!document.getElementById('kr-wild-kf')){const s=document.createElement('style');s.id='kr-wild-kf';s.textContent='@keyframes krWildGlow{50%{box-shadow:0 0 0 4px #fff,0 0 34px 10px #ffd257}}';document.head.append(s);}
 const orig=fc._parkChargeConfirmed;fc._parkChargeConfirmed=(b,res,a)=>{const v=orig?.(b,res,a);onSpin(fc,res).catch(()=>{});return v;};
 addEventListener('resize',()=>{document.getElementById('kr-wild-crown')?.remove();paint();});paint();}
