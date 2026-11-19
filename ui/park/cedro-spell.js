// Feitiço do cedro (só prévia). O Royal Rico dá cedros (máx. 3). Depois que os rolos param, se uma linha ficou
// "quase" (2 iguais + 1 diferente), o King Rico agita o cedro e o feitiço transforma a casa errada no símbolo que falta.
// Automático: o jogador não toca em nada. A casa nova é uma camada temporária: some sozinha e some no próximo giro.
let engine=null;import('../../cloud/engine.cjs').then(m=>{engine=m.default||m;}).catch(()=>{});
const KEY='kingRico.preview.cedros',MAX=3;
const full=()=>localStorage.getItem('kingRico.preview.cedrosFull')==='1';
export const spell={get:()=>full()?MAX:Math.max(0,Math.min(MAX,+localStorage.getItem(KEY)||0)),set:n=>{if(!full())localStorage.setItem(KEY,String(Math.max(0,Math.min(MAX,n))));paint();}};
const post=async body=>{const r=await fetch(location.origin+'/api/play',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:crypto.randomUUID(),...body})});return r.json();};
window.KingRicoPreviewCredit=async coins=>{try{const j=await post({action:'preview-credit',units:Math.round(coins*100)});const fc=window.__fc;if(fc&&j.player){fc._cloudDeferred=j.player;fc.applyCloudPlayer?.();}}catch{}};
const temp=new Set(),wait=ms=>new Promise(r=>setTimeout(r,ms));
const add=(tag,css)=>{const e=document.createElement(tag);e.style.cssText='position:fixed;pointer-events:none;'+css;document.body.append(e);temp.add(e);return e;};
const kill=e=>{temp.delete(e);e.remove();};
function clearAll(){for(const e of [...temp])kill(e);}
function art(sym){const a=document.querySelector('.park-reels [data-symbol]'),cs=a&&getComputedStyle(a);return {img:cs?.backgroundImage||'url(/assets/symbols-v7.webp)',size:cs?.backgroundSize||'1200% 100%',x:(sym/11*100)+'%'};}
function paint(){const n=spell.get();let d=document.getElementById('kr-cedro-count');const plaque=document.querySelector('.park-prize-value');
 if(!plaque){d?.remove();return;}
 if(!d){d=document.createElement('div');d.id='kr-cedro-count';d.setAttribute('aria-label','Cedros');plaque.parentElement.append(d);}
 const a=art(5);
 d.style.cssText=`position:absolute;z-index:30;left:${plaque.offsetLeft+plaque.offsetWidth/2-36}px;top:${plaque.offsetTop+plaque.offsetHeight-4}px;width:72px;height:22px;display:flex;align-items:center;justify-content:center;gap:5px;pointer-events:none`;
 d.innerHTML=`<i style="width:20px;height:22px;background:${a.img} ${a.x} 50%/${a.size} no-repeat;filter:drop-shadow(0 1px 1px #0008)"></i>`+[0,1,2].map(i=>`<i style="width:9px;height:9px;border-radius:50%;background:${i<n?'radial-gradient(circle at 35% 30%,#fffbe0,#ffd257 50%,#c27a0a)':'rgba(40,10,50,.55)'};box-shadow:0 0 0 1.5px ${i<n?'#8a4a05':'rgba(255,210,87,.5)'}"></i>`).join('');}
const reelsStopped=()=>new Promise(res=>{const t0=Date.now(),k=setInterval(()=>{if(!document.querySelector('.park-reel-cell[data-reel-spinning="true"]')||Date.now()-t0>9000){clearInterval(k);setTimeout(res,250);}},100);});
function findNearMiss(res){const g=res?.outcome?.grid;if(!engine||!Array.isArray(g)||g.length!==9)return null;
 const syms=engine.slotSymbols?.(6)||engine.SYMBOLS,won=new Set((res.outcome.lines||[]).map(String));let best=null;
 engine.ALL_LINES.forEach((L,li)=>{if(won.has(String(li)))return;const v=L.map(i=>g[i]);
  for(let k=0;k<3;k++){const o=v.filter((_,j)=>j!==k);if(o[0]===o[1]&&v[k]!==o[0]&&(syms[o[0]]?.pay||0)>0){const pay=syms[o[0]].pay;if(!best||pay>best.pay)best={line:L,cell:L[k],sym:o[0],pay};}}});return best;}
async function cast(fc,res,m){const cells=[...document.querySelectorAll('.park-reel-cell')],tc=cells[m.cell]?.getBoundingClientRect();if(!tc)return;
 const king=document.querySelector('.park-hero-king'),kr=king?.getBoundingClientRect();
 const from=kr?{x:kr.left+kr.width*.22,y:kr.top+kr.height*.3}:{x:innerWidth-40,y:120},to={x:tc.left+tc.width/2,y:tc.top+tc.height/2};
 // 1. King Rico agita o cedro
 if(king)king.animate([{transform:'rotate(6deg)'},{transform:'rotate(-6deg) translateY(-8px) scale(1.04)'},{transform:'rotate(12deg) translateY(-4px)'},{transform:'rotate(6deg)'}],{duration:560,easing:'ease-in-out'});
 const glow=add('i',`left:${from.x-34}px;top:${from.y-34}px;width:68px;height:68px;border-radius:50%;z-index:60;background:radial-gradient(circle,#fff 0,#b8ffcf 30%,#3fdc84aa 55%,transparent 72%)`);
 glow.animate([{transform:'scale(.2)',opacity:0},{transform:'scale(1.3)',opacity:1,offset:.6},{transform:'scale(1)',opacity:.9}],{duration:420,fill:'forwards'});
 try{fc.bell?.(1568,.25,.05);fc.bell?.(2093,.3,.04,.12);}catch{}navigator.vibrate?.(20);
 await wait(420);
 // 2. Feitiço viaja em arco até a casa
 const orb=add('i',`left:0;top:0;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;z-index:61;background:radial-gradient(circle,#fff 0,#d6ffe2 35%,#3fdc84 70%,transparent 72%);box-shadow:0 0 18px 6px #7dffb0`);
 const mid={x:(from.x+to.x)/2,y:Math.min(from.y,to.y)-90},T=520,t0=performance.now();kill(glow);
 await new Promise(done=>{const step=now=>{const k=Math.min(1,(now-t0)/T),e=k*k*(3-2*k),x=(1-e)*(1-e)*from.x+2*(1-e)*e*mid.x+e*e*to.x,y=(1-e)*(1-e)*from.y+2*(1-e)*e*mid.y+e*e*to.y;orb.style.transform=`translate(${x}px,${y}px)`;
  if(Math.random()<.6){const s=add('i',`left:${x-4}px;top:${y-4}px;width:8px;height:8px;border-radius:50%;z-index:60;background:${Math.random()<.5?'#ffd257':'#b8ffcf'}`);s.animate([{transform:'scale(1)',opacity:1},{transform:`translate(${(Math.random()-.5)*30}px,${10+Math.random()*24}px) scale(.2)`,opacity:0}],{duration:420}).onfinish=()=>kill(s);}
  if(k<1)requestAnimationFrame(step);else done();};requestAnimationFrame(step);});
 kill(orb);
 // 3. Explosão e troca do símbolo (camada temporária por cima da casa)
 try{fc.sfxWin?.(m.pay>=5);}catch{}navigator.vibrate?.([30,30,70]);
 const a=art(m.sym),swap=add('div',`left:${tc.left}px;top:${tc.top}px;width:${tc.width}px;height:${tc.height}px;z-index:58;border-radius:12px;background:linear-gradient(180deg,#fffdf6,#f3ece0);box-shadow:inset 0 0 0 3px #7dffb0,0 0 22px #3fdc84aa`);
 const sy=document.createElement('i');sy.style.cssText=`position:absolute;inset:6%;background:${a.img} ${a.x} 50%/${a.size} no-repeat`;swap.append(sy);
 swap.animate([{transform:'scale(.3) rotate(-20deg)',opacity:0},{transform:'scale(1.18) rotate(4deg)',opacity:1,offset:.6},{transform:'scale(1)',opacity:1}],{duration:420,easing:'cubic-bezier(.2,1.2,.4,1)'});
 const ring=add('i',`left:${to.x-70}px;top:${to.y-70}px;width:140px;height:140px;border-radius:50%;z-index:59;border:5px solid #7dffb0;box-shadow:0 0 24px #3fdc84`);
 ring.animate([{transform:'scale(.2)',opacity:1},{transform:'scale(1.6)',opacity:0}],{duration:520,easing:'ease-out'}).onfinish=()=>kill(ring);
 for(let i=0;i<12;i++){const s=add('i',`left:${to.x-4}px;top:${to.y-4}px;width:8px;height:8px;border-radius:50%;z-index:60;background:${i%2?'#ffd257':'#b8ffcf'};box-shadow:0 0 8px #fff`),an=i/12*Math.PI*2;
  s.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${Math.cos(an)*90}px,${Math.sin(an)*90}px) scale(.3)`,opacity:0}],{duration:520,easing:'cubic-bezier(.15,.8,.3,1)'}).onfinish=()=>kill(s);}
 // 4. Linha acende e paga
 const hl=m.line.map(i=>{const r=cells[i]?.getBoundingClientRect();return r&&add('i',`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:12px;z-index:59;box-shadow:0 0 0 4px #fff3b0,0 0 26px #ffd257`);}).filter(Boolean);
 const bet=fc.state?.bet??res.outcome.bet??1,coins=Math.round(bet*m.pay*100)/100;
 const t=add('b',`left:${to.x}px;top:${to.y}px;z-index:62;transform:translate(-50%,-50%);font:800 34px/1 'Baloo 2',sans-serif;color:#fff3c4;-webkit-text-stroke:3px #4a1a00;paint-order:stroke;text-shadow:0 3px 0 #4a1a00`);t.textContent='+'+coins.toLocaleString('pt-BR');
 t.animate([{transform:'translate(-50%,-20%) scale(.5)',opacity:0},{transform:'translate(-50%,-90%) scale(1.15)',opacity:1,offset:.3},{transform:'translate(-50%,-150%) scale(1)',opacity:0}],{duration:1400,fill:'forwards'});
 await window.KingRicoPreviewCredit(coins);try{fc.sfxCoins?.();}catch{}
 await wait(1500);
 [swap,t,...hl].forEach(e=>{if(!temp.has(e))return;e.animate([{opacity:1},{opacity:0}],{duration:300,fill:'forwards'}).onfinish=()=>kill(e);});}
let running=false;
async function onSpin(fc,res){clearAll();if(!spell.get()||running)return;running=true;try{await reelsStopped();const m=findNearMiss(res);if(!m)return;spell.set(spell.get()-1);await cast(fc,res,m);}finally{running=false;}}
export function installCedroSpell(){const fc=window.__fc;if(!fc||fc._cedroSpell)return;fc._cedroSpell=true;
 localStorage.removeItem('kingRico.preview.wildSpins');document.getElementById('kr-wild-crown')?.remove();document.getElementById('kr-wild-count')?.remove();
 const orig=fc._parkChargeConfirmed;fc._parkChargeConfirmed=(b,res,a)=>{const v=orig?.(b,res,a);onSpin(fc,res).catch(()=>{});return v;};
 // Garantia contra a casa "travada": qualquer novo giro apaga as camadas do feitiço.
 document.addEventListener('pointerdown',e=>{if(e.target.closest?.('[data-spin-btn],.park-spin-button,.park-reels'))clearAll();},true);
 globalThis.KingRicoCedroPaint=paint;addEventListener('resize',paint);paint();setTimeout(paint,800);}
