// Trinca do Controle (minijogo). 8×8, arrastar troca vizinhas, sem power-ups.
// O resultado (ganhar/perder) é decidido ANTES de jogar; a barra é conduzida para terminar no limite (suspense).
// Ganhar = 1 cedro (máx. 3). Com 3 cheios, o cedro vira 2,5× a aposta do giro em moedas.
const PIECES=[
 {id:'roleta',src:'/assets/wheel/wheel-symbol-v1.webp',w:1},
 {id:'diamante',src:'/assets/symbols/sym-gem.png',w:1},
 {id:'trevo',src:'/assets/symbols/clover-green-bonus-v1.webp',w:1},
 {id:'coroa',src:'/assets/symbols/sym-crown-lossless.webp',w:1},
 {id:'tiger',src:'/assets/tony/head.webp',w:.7}];
import {spell} from './cedro-spell.js';
const TIGER=4,N=7,KEY='kingRico.preview.cedros',MAX=3;
const A=p=>p; // o build já prefixa '/assets/' para o GitHub Pages
export const cedros={get:()=>Math.max(0,Math.min(MAX,+localStorage.getItem(KEY)||0)),set:n=>{localStorage.setItem(KEY,String(Math.max(0,Math.min(MAX,n))));mountCedroDots();}};
export function mountCedroDots(){return;const plaque=document.querySelector('.park-prize-value');if(!plaque)return;let el=document.getElementById('kr-cedro-dots');
 // 3 bolinhas na borda dourada de baixo do marcador de WIN (dono, 17/11)
 if(!el){el=document.createElement('div');el.id='kr-cedro-dots';el.setAttribute('aria-label','Cedros guardados');plaque.parentElement.append(el);}
 el.style.cssText='position:absolute;z-index:30;left:'+(plaque.offsetLeft+plaque.offsetWidth/2-20)+'px;top:'+(plaque.offsetTop+plaque.offsetHeight-2)+'px;width:40px;display:flex;justify-content:center;gap:4px;pointer-events:none';
 const n=cedros.get();el.innerHTML=Array.from({length:MAX},(_,i)=>`<i style="width:8px;height:8px;border-radius:50%;background:${i<n?'radial-gradient(circle at 35% 30%,#d8ffb0,#3fcf5a 60%,#1c7a32)':'#4a1a3a'};box-shadow:0 0 0 1.5px #ffd257${i<n?',0 0 5px #6cf096':''}"></i>`).join('');}

export function openTrinca(fc,{bet=1}={}){return new Promise(done=>{
 const rnd=Math.random,win=rnd()<.9,moves=15+Math.floor(rnd()*16),endAt=win?moves-(rnd()<.55?0:1):moves+1;
 const snd=(f,d=.18,v=.06,w=0)=>{try{fc.bell?.(f,d,v,w);}catch{}},vib=p=>{try{navigator.vibrate?.(p);}catch{}};
 const pick=()=>{let t=rnd()*PIECES.reduce((a,p)=>a+p.w,0);for(let i=0;i<PIECES.length;i++){t-=PIECES[i].w;if(t<=0)return i;}return 0;};
 const g=Array.from({length:N},()=>Array(N).fill(0));
 const runs=()=>{const out=[];for(let r=0;r<N;r++)for(let c=0;c<N;){let e=c;while(e+1<N&&g[r][e+1]===g[r][c])e++;if(e-c>=2)out.push({type:g[r][c],cells:Array.from({length:e-c+1},(_,k)=>[r,c+k])});c=e+1;}
  for(let c=0;c<N;c++)for(let r=0;r<N;){let e=r;while(e+1<N&&g[e+1][c]===g[r][c])e++;if(e-r>=2)out.push({type:g[r][c],cells:Array.from({length:e-r+1},(_,k)=>[r+k,c])});r=e+1;}return out;};
 const hasMove=()=>{for(let r=0;r<N;r++)for(let c=0;c<N;c++)for(const [dr,dc] of [[0,1],[1,0]]){const R=r+dr,C=c+dc;if(R>=N||C>=N)continue;[g[r][c],g[R][C]]=[g[R][C],g[r][c]];const ok=runs().length>0;[g[r][c],g[R][C]]=[g[R][C],g[r][c]];if(ok)return true;}return false;};
 const fill=()=>{do{for(let r=0;r<N;r++)for(let c=0;c<N;c++){do g[r][c]=pick();while((c>1&&g[r][c-1]===g[r][c]&&g[r][c-2]===g[r][c])||(r>1&&g[r-1][c]===g[r][c]&&g[r-2][c]===g[r][c]));}}while(!hasMove());};fill();
 const o=document.createElement('div');o.id='kr-controller-game';o.setAttribute('role','dialog');
 o.innerHTML=`<style>
 #kr-controller-game{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:16px 0;box-sizing:border-box;background:#2a0a4a url(${A('/assets/bleed/stage-bleed.webp')}) center 100%/cover no-repeat;font-family:'Baloo 2',system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}
 #kr-controller-game::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(30,6,50,.15),rgba(30,6,50,.45));pointer-events:none}
 #kr-controller-game .tr-top{position:relative;width:min(96vw,460px);box-sizing:border-box;display:flex;align-items:center;gap:14px;padding:10px 14px;border-radius:22px;background:linear-gradient(180deg,#fffdf6,#f6e7c4);box-shadow:0 0 0 3px #f0b41f,0 0 0 6px #b86e0a,0 8px 16px rgba(60,20,0,.3)}
 #kr-controller-game .tr-moves{flex:0 0 auto;width:72px;height:72px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 40% 30%,#8a4fd8,#5a1f9a 70%);box-shadow:inset 0 -4px 0 rgba(0,0,0,.25),0 0 0 3px #fff3c4,0 0 0 5px #d18a0c;color:#fff;font-weight:800;line-height:1}
 #kr-controller-game .tr-moves b{font-size:34px;text-shadow:0 2px 0 rgba(0,0,0,.3)}#kr-controller-game .tr-moves small{font-size:10px;letter-spacing:1px;opacity:.9}
 #kr-controller-game .tr-bar{flex:1;height:30px;border-radius:15px;background:#5a2a12;box-shadow:inset 0 3px 6px rgba(0,0,0,.5),0 0 0 2px #fff3c4;overflow:hidden;position:relative}
 #kr-controller-game .tr-fill{position:absolute;inset:3px auto 3px 3px;width:0;max-width:calc(100% - 6px);border-radius:12px;background:linear-gradient(180deg,#9dff7a,#2ec962 55%,#1f9a48);box-shadow:inset 0 4px 0 rgba(255,255,255,.5);transition:width .45s cubic-bezier(.3,1.4,.5,1),filter .2s}
 #kr-controller-game .tr-fill.is-hurt{filter:hue-rotate(-110deg) saturate(2.2)}
 #kr-controller-game .tr-goal{flex:0 0 auto;width:60px;height:60px;margin-left:-26px;position:relative;z-index:1;background:url(${A('/assets/symbols/sym-scepter.png')}) center/contain no-repeat;filter:drop-shadow(0 3px 3px rgba(60,20,0,.45))}
 #kr-controller-game .tr-board{position:relative;width:min(96vw,460px);aspect-ratio:1;border-radius:20px;padding:0;background:rgba(70,20,110,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);box-shadow:0 0 0 4px #fff,0 0 0 7px #f0b41f,0 14px 26px rgba(20,40,80,.4);overflow:hidden}
 #kr-controller-game .tr-cell{position:absolute;width:14.2857%;height:14.2857%;box-sizing:border-box;padding:2px}
 #kr-controller-game .tr-cell b{display:block;width:100%;height:100%;border-radius:10px;background:rgba(255,255,255,.55)}
 #kr-controller-game .tr-cell.alt b{background:rgba(255,255,255,.35)}
 #kr-controller-game .tr-p{position:absolute;width:14.2857%;height:14.2857%;padding:2px;box-sizing:border-box;transition:transform .22s cubic-bezier(.3,1.25,.5,1),opacity .2s;z-index:1}
 #kr-controller-game .tr-p i{display:block;width:100%;height:100%;background:center/contain no-repeat;filter:drop-shadow(0 3px 2px rgba(20,30,60,.45))}
 #kr-controller-game .tr-p i.is-tiger{width:76%;height:76%;margin:12%;border-radius:50%;background:var(--tiger) center/92% no-repeat,radial-gradient(circle at 35% 30%,#ff9a7a,#ff4a30 55%,#c0241a);box-shadow:inset 0 -4px 0 rgba(0,0,0,.2),0 0 0 2.5px #fff}
 #kr-controller-game .tr-p.is-sel i{transform:scale(1.12);filter:drop-shadow(0 0 7px #fff) drop-shadow(0 3px 2px rgba(20,30,60,.45))}
 #kr-controller-game .tr-p.is-pop i{animation:trPop .22s ease-in forwards}
 @keyframes trPop{50%{transform:scale(1.3)}to{transform:scale(0);opacity:0}}
 #kr-controller-game .tr-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:rgba(255,252,240,.9);animation:trIn .3s ease-out}
 @keyframes trIn{from{opacity:0;transform:scale(.9)}}
 #kr-controller-game .tr-pts{position:fixed;z-index:9100;pointer-events:none;font:800 var(--fs,30px)/1 'Rammetto One','Baloo 2',sans-serif;color:var(--c,#fff);-webkit-text-stroke:3px #4a1a00;paint-order:stroke;text-shadow:0 3px 0 #4a1a00,0 0 14px var(--c,#fff);transform:translate(-50%,-50%)}
 #kr-controller-game .tr-ring{position:absolute;z-index:3;border-radius:50%;border:5px solid var(--c);box-shadow:0 0 20px var(--c);pointer-events:none}
 #kr-controller-game .tr-flash{position:absolute;inset:0;z-index:4;border-radius:20px;background:var(--c);pointer-events:none;opacity:0}
 #kr-controller-game .tr-board.is-shake{animation:trShake .32s}
 @keyframes trShake{20%{translate:-5px 2px}40%{translate:5px -2px}60%{translate:-3px 1px}80%{translate:3px -1px}}
 #kr-controller-game .tr-end b{font-family:'Rammetto One','Baloo 2',sans-serif;font-size:34px;color:#ffb21a;text-shadow:0 3px 0 #8a4a05}
 #kr-controller-game .tr-end button{padding:14px 56px;border:0;border-radius:999px;font:800 26px/1 'Baloo 2',sans-serif;color:#fff;background:linear-gradient(180deg,#6cf096,#2ec962 60%,#22a650);box-shadow:0 5px 0 #147a36;cursor:pointer}
 </style><div class="tr-top"><div class="tr-moves"><b>${moves}</b><small>JOGADAS</small></div><div class="tr-bar"><div class="tr-fill"></div></div><div class="tr-goal"></div></div><div class="tr-board"></div>`;
 document.body.append(o);
 // X para sair e voltar à slot (sem prêmio).
 {const x=document.createElement('button');x.type='button';x.setAttribute('aria-label','Fechar e voltar');x.textContent='✕';x.style.cssText="position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);right:12px;z-index:50;width:46px;height:46px;border-radius:50%;border:0;font:800 22px/1 'Baloo 2',sans-serif;color:#fff;background:rgba(40,8,60,.8);box-shadow:0 0 0 2.5px #ffd257,0 4px 8px #0006;cursor:pointer";
  x.onclick=()=>{if(!o.isConnected)return;over=true;try{fc.sfxClick?.();}catch{}o.remove();done({won:false,quit:true});};o.append(x);}
 const board=o.querySelector('.tr-board'),fillEl=o.querySelector('.tr-fill'),movesEl=o.querySelector('.tr-moves b');
 const el=Array.from({length:N},()=>Array(N).fill(null));
 const place=(d,r,c)=>{d.style.transform=`translate(${c*100}%,${r*100}%)`;};
 const make=(r,c,from)=>{const d=document.createElement('div');d.className='tr-p';d.innerHTML=g[r][c]===TIGER?`<i class="is-tiger" style="--tiger:url(${A(PIECES[TIGER].src)})"></i>`:`<i style="background-image:url(${A(PIECES[g[r][c]].src)})"></i>`;place(d,from??r,c);board.append(d);el[r][c]=d;if(from!=null)requestAnimationFrame(()=>requestAnimationFrame(()=>place(d,r,c)));return d;};
 for(let r=0;r<N;r++)for(let c=0;c<N;c++){const k=document.createElement('div');k.className='tr-cell'+((r+c)%2?' alt':'');k.innerHTML='<b></b>';k.style.transform=`translate(${c*100}%,${r*100}%)`;board.append(k);}
 for(let r=0;r<N;r++)for(let c=0;c<N;c++)make(r,c);
 let used=0,bar=0,busy=false,over=false,total=0;const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const setBar=v=>{bar=Math.max(0,Math.min(100,v));fillEl.style.width=bar+'%';};
 const plan=k=>win?(k>=endAt?100:Math.min(97,100*Math.pow(k/endAt,.85)+(rnd()*4-2))):Math.min(94,96*Math.pow(Math.min(k,moves)/moves,.85)+(rnd()*3-1.5));
 const resolve=async()=>{let level=0,tiger=false,score=0;for(;;){const rs=runs();if(!rs.length)break;level++;const kill=new Set();for(const r of rs){if(r.type===TIGER)tiger=true;r.cells.forEach(([a,b])=>kill.add(a*N+b));}
   // Valor: trinca 1 · quadra 1,5 · quina reta 2 · quina em L/T 1,75 (dono, 18/11). Tiger não soma.
   const done=new Set();for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=rs[i],b=rs[j];if(done.has(i)||done.has(j)||a.type!==b.type||a.type===TIGER)continue;if(a.cells.some(([x,y])=>b.cells.some(([p,q])=>p===x&&q===y))){score+=1.75;done.add(i);done.add(j);}}
   const groups=[];for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++)if(done.has(i)&&done.has(j)&&rs[i].type===rs[j].type&&rs[i].cells.some(([x,y])=>rs[j].cells.some(([p,q])=>p===x&&q===y))&&!groups.some(gp=>gp.ids.includes(i)))groups.push({ids:[i,j],v:1.75,cells:[...rs[i].cells,...rs[j].cells]});
   rs.forEach((r,i)=>{if(!done.has(i)&&r.type!==TIGER){const v=r.cells.length>=5?2:r.cells.length===4?1.5:1;score+=v;groups.push({v,cells:r.cells});}});
   groups.forEach(gp=>celebrate(gp.v,gp.cells));
   snd([523,659,784,988,1175,1319][Math.min(5,level-1)],.2,.07);vib(level>1?[18,30,18]:22);
   kill.forEach(k=>el[Math.floor(k/N)][k%N].classList.add('is-pop'));await wait(230);kill.forEach(k=>{const r=Math.floor(k/N),c=k%N;el[r][c].remove();el[r][c]=null;g[r][c]=-1;});
   for(let c=0;c<N;c++){let w=N-1;for(let r=N-1;r>=0;r--)if(g[r][c]>=0){if(w!==r){g[w][c]=g[r][c];el[w][c]=el[r][c];g[r][c]=-1;el[r][c]=null;place(el[w][c],w,c);}w--;}
    for(let r=w,k=1;r>=0;r--,k++){g[r][c]=pick();make(r,c,-k);}}
   await wait(260);}
  return {tiger,score};};
 // Cada combinação tem seu efeito e seu valor voa até a barra (dono, 18/11).
 const STY={1:{c:'#ffffff',fs:26,txt:'+1'},1.5:{c:'#7fe3ff',fs:32,txt:'+1,5'},1.75:{c:'#ff9ae6',fs:36,txt:'+1,75'},2:{c:'#ffd257',fs:42,txt:'+2'}};
 const celebrate=(v,cells)=>{const st=STY[v]||STY[1],b=board.getBoundingClientRect(),cw=b.width/N;let x=0,y=0;cells.forEach(([r,c])=>{x+=c;y+=r;});x=b.left+(x/cells.length+.5)*cw;y=b.top+(y/cells.length+.5)*cw;
  if(v>1){const ring=document.createElement('i');ring.className='tr-ring';ring.style.cssText=`--c:${st.c};left:${x-b.left-cw}px;top:${y-b.top-cw}px;width:${cw*2}px;height:${cw*2}px`;board.append(ring);ring.animate([{transform:'scale(.3)',opacity:1},{transform:'scale('+(v>=1.75?2.6:1.8)+')',opacity:0}],{duration:520,easing:'ease-out'}).onfinish=()=>ring.remove();}
  if(v>=1.75){const fl=document.createElement('i');fl.className='tr-flash';fl.style.setProperty('--c',st.c);board.append(fl);fl.animate([{opacity:0},{opacity:.5},{opacity:0}],{duration:360}).onfinish=()=>fl.remove();board.classList.remove('is-shake');void board.offsetWidth;board.classList.add('is-shake');}
  if(v>=1.5){[0,1,2].forEach(k=>snd([784,988,1319][k]*(v>=2?1.25:1),.22,.06,k*.06));vib(v>=2?[30,30,30,30,70]:[25,25,45]);}
  const p=document.createElement('span');p.className='tr-pts';p.textContent=st.txt;p.style.cssText=`--c:${st.c};--fs:${st.fs}px;left:${x}px;top:${y}px`;o.append(p);
  const f=fillEl.getBoundingClientRect(),tx=f.left+Math.max(12,f.width),ty=f.top+f.height/2;
  p.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:'translate(-50%,-50%) scale(1.25)',opacity:1,offset:.2},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.45},{transform:`translate(calc(-50% + ${tx-x}px),calc(-50% + ${ty-y}px)) scale(.5)`,opacity:.9}],{duration:900,easing:'cubic-bezier(.4,0,.6,1)'}).onfinish=()=>{p.remove();fillEl.animate([{filter:'brightness(1.8)'},{filter:'none'}],{duration:260});};};
 const finish=async won=>{over=true;await wait(350);const end=document.createElement('div');end.className='tr-end';
  // Prêmio: giros com a coroa coringa no meio da slot. Mais de 6 pontos = 4 giros (dono, 18/11).
  // Prêmio: +1 cedro (máx. 3). Com 3 guardados, vale 2,5× a aposta em moedas.
  let prize='';if(won){const full=spell.get()>=3,coins=Math.round(bet*2.5*100)/100;if(full)await window.KingRicoPreviewCredit?.(coins);else spell.set(spell.get()+1);
   prize=`<div style="width:96px;height:110px;background:url(${A('/assets/symbols/sym-scepter.png')}) center/contain no-repeat;filter:drop-shadow(0 6px 6px #0008)"></div><span style="font-size:24px;font-weight:800;color:#8a4a05">${full?'+'+coins.toLocaleString('pt-BR')+' MOEDAS':'+1 CEDRO'}</span>`;
   try{fc.sfxWin?.(true);}catch{}vib([40,40,90]);}
  else{snd(330,.4,.07);snd(262,.5,.07,.18);vib([60,60,60]);}
  end.innerHTML=`<b>${won?'VOCÊ CONSEGUIU!':'QUASE!'}</b>${prize}<button type="button">OK</button>`;board.append(end);
  end.querySelector('button').onclick=()=>{try{fc.sfxClick?.();}catch{}o.remove();done({won});};};
 const trySwap=async(r,c,R,C)=>{if(busy||over||R<0||C<0||R>=N||C>=N)return;busy=true;
  [g[r][c],g[R][C]]=[g[R][C],g[r][c]];[el[r][c],el[R][C]]=[el[R][C],el[r][c]];place(el[r][c],r,c);place(el[R][C],R,C);snd(880,.06,.03);vib(15);await wait(210);
  if(!runs().length){[g[r][c],g[R][C]]=[g[R][C],g[r][c]];[el[r][c],el[R][C]]=[el[R][C],el[r][c]];place(el[r][c],r,c);place(el[R][C],R,C);await wait(210);busy=false;return;}
  used++;movesEl.textContent=String(moves-used);const {tiger,score}=await resolve();total+=score;
  if(tiger){setBar(bar-9);fillEl.classList.add('is-hurt');snd(196,.3,.08);vib([50,40,50]);await wait(420);fillEl.classList.remove('is-hurt');}
  await wait(520);setBar(Math.min(win?100:94,Math.max(plan(used),bar+6*Math.max(0,score-1))));
  if(!hasMove()){fill();for(let a=0;a<N;a++)for(let b=0;b<N;b++){el[a][b]?.remove();make(a,b,-N);}await wait(300);}
  busy=false;if(bar>=100)return finish(true);if(used>=moves)return finish(false);};
 let start=null;
 board.addEventListener('pointerdown',e=>{if(busy||over)return;const b=board.getBoundingClientRect(),c=Math.floor((e.clientX-b.left)/(b.width/N)),r=Math.floor((e.clientY-b.top)/(b.height/N));if(r<0||c<0||r>=N||c>=N)return;start={x:e.clientX,y:e.clientY,r,c};el[r][c]?.classList.add('is-sel');try{board.setPointerCapture(e.pointerId);}catch{}});
 board.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)<16)return;const s=start;start=null;el[s.r][s.c]?.classList.remove('is-sel');Math.abs(dx)>Math.abs(dy)?trySwap(s.r,s.c,s.r,s.c+Math.sign(dx)):trySwap(s.r,s.c,s.r+Math.sign(dy),s.c);});
 const clr=()=>{if(start)el[start.r][start.c]?.classList.remove('is-sel');start=null;};board.addEventListener('pointerup',clr);board.addEventListener('pointercancel',clr);
 try{fc.sfxWin?.(false);}catch{}vib([40,40,80]);
});}
