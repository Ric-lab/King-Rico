// Trinca do Controle (minijogo). 8×8, arrastar troca vizinhas, sem power-ups.
// O resultado (ganhar/perder) é decidido ANTES de jogar; a barra é conduzida para terminar no limite (suspense).
// Ganhar = 1 cedro (máx. 3). Com 3 cheios, o cedro vira 2,5× a aposta do giro em moedas.
const PIECES=[
 {id:'roleta',src:'/assets/wheel/wheel-symbol-v1.webp',w:1},
 {id:'diamante',src:'/assets/symbols/sym-gem.png',w:1},
 {id:'circo',src:'/assets/symbols/sym-tent-lossless.webp',w:1},
 {id:'moeda',src:'/assets/symbols/sym-coin.webp',w:1},
 {id:'tiger',src:'/assets/tony/head.webp',w:.75}];
const TIGER=4,N=8,KEY='kingRico.preview.cedros',MAX=3;
const A=p=>p; // o build já prefixa '/assets/' para o GitHub Pages
export const cedros={get:()=>Math.max(0,Math.min(MAX,+localStorage.getItem(KEY)||0)),set:n=>{localStorage.setItem(KEY,String(Math.max(0,Math.min(MAX,n))));mountCedroDots();}};
export function mountCedroDots(){const plaque=document.querySelector('.park-prize-value');if(!plaque)return;let el=document.getElementById('kr-cedro-dots');
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
 #kr-controller-game{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:linear-gradient(180deg,rgba(40,10,70,.35),rgba(20,4,40,.7)),radial-gradient(120% 90% at 50% 20%,#7a2bb8,#2a0848 70%);backdrop-filter:blur(6px);font-family:'Baloo 2',system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}
 #kr-controller-game .tr-top{width:min(92vw,420px);display:flex;align-items:center;gap:12px}
 #kr-controller-game .tr-bar{flex:1;height:26px;border-radius:13px;background:rgba(10,2,24,.55);box-shadow:inset 0 2px 5px #0008,0 0 0 2.5px #f0b41f;overflow:hidden;position:relative}
 #kr-controller-game .tr-fill{position:absolute;inset:0 auto 0 0;width:0;border-radius:13px;background:linear-gradient(90deg,#8f6bff,#00cfff,#00f27b,#ffda24,#ff9400);box-shadow:inset 0 3px 0 rgba(255,255,255,.45);transition:width .45s cubic-bezier(.3,1.4,.5,1),filter .2s}
 #kr-controller-game .tr-fill.is-hurt{filter:brightness(.7) sepia(1) hue-rotate(-40deg) saturate(4)}
 #kr-controller-game .tr-goal{width:34px;height:34px;flex:0 0 auto;background:url(${A('/assets/symbols/sym-scepter.png')}) center/contain no-repeat;filter:drop-shadow(0 2px 2px #0007)}
 #kr-controller-game .tr-moves{min-width:62px;height:44px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff6df;box-shadow:0 3px 0 #b88a2e,0 0 0 2.5px #f0b41f;color:#6b2e05;font-weight:800;line-height:1}
 #kr-controller-game .tr-moves b{font-size:24px}#kr-controller-game .tr-moves small{font-size:11px;letter-spacing:1px}
 #kr-controller-game .tr-board{position:relative;width:min(94vw,430px);aspect-ratio:1;border-radius:16px;padding:0;background:rgba(18,4,40,.55);box-shadow:0 0 0 3px rgba(255,236,170,.9),0 0 0 6px #b8780c,0 14px 30px #0009;overflow:hidden}
 #kr-controller-game .tr-cell{position:absolute;width:12.5%;height:12.5%;box-sizing:border-box;padding:2px}
 #kr-controller-game .tr-cell b{display:block;width:100%;height:100%;border-radius:9px;background:rgba(150,110,220,.28)}
 #kr-controller-game .tr-cell.alt b{background:rgba(150,110,220,.16)}
 #kr-controller-game .tr-p{position:absolute;width:12.5%;height:12.5%;padding:3px;box-sizing:border-box;transition:transform .22s cubic-bezier(.3,1.25,.5,1),opacity .2s;z-index:1}
 #kr-controller-game .tr-p i{display:block;width:100%;height:100%;background:center/contain no-repeat;filter:drop-shadow(0 3px 2px #0007)}
 #kr-controller-game .tr-p.is-sel i{transform:scale(1.12);filter:drop-shadow(0 0 6px #fff6c0) drop-shadow(0 3px 2px #0007)}
 #kr-controller-game .tr-p.is-pop i{animation:trPop .22s ease-in forwards}
 @keyframes trPop{50%{transform:scale(1.3)}to{transform:scale(0);opacity:0}}
 #kr-controller-game .tr-end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:rgba(20,4,40,.82);animation:trIn .3s ease-out}
 @keyframes trIn{from{opacity:0;transform:scale(.9)}}
 #kr-controller-game .tr-end b{font-family:'Rammetto One','Baloo 2',sans-serif;font-size:34px;color:#ffd257;text-shadow:0 3px 0 #6b2e05}
 #kr-controller-game .tr-end button{padding:14px 56px;border:0;border-radius:999px;font:800 26px/1 'Baloo 2',sans-serif;color:#fff;background:linear-gradient(180deg,#6cf096,#2ec962 60%,#22a650);box-shadow:0 5px 0 #147a36;cursor:pointer}
 </style><div class="tr-top"><div class="tr-goal"></div><div class="tr-bar"><div class="tr-fill"></div></div><div class="tr-moves"><b>${moves}</b><small>JOGADAS</small></div></div><div class="tr-board"></div>`;
 document.body.append(o);
 const board=o.querySelector('.tr-board'),fillEl=o.querySelector('.tr-fill'),movesEl=o.querySelector('.tr-moves b');
 const el=Array.from({length:N},()=>Array(N).fill(null));
 const place=(d,r,c)=>{d.style.transform=`translate(${c*100}%,${r*100}%)`;};
 const make=(r,c,from)=>{const d=document.createElement('div');d.className='tr-p';d.innerHTML=`<i style="background-image:url(${A(PIECES[g[r][c]].src)})"></i>`;place(d,from??r,c);board.append(d);el[r][c]=d;if(from!=null)requestAnimationFrame(()=>requestAnimationFrame(()=>place(d,r,c)));return d;};
 for(let r=0;r<N;r++)for(let c=0;c<N;c++){const k=document.createElement('div');k.className='tr-cell'+((r+c)%2?' alt':'');k.innerHTML='<b></b>';k.style.transform=`translate(${c*100}%,${r*100}%)`;board.append(k);}
 for(let r=0;r<N;r++)for(let c=0;c<N;c++)make(r,c);
 let used=0,bar=0,busy=false,over=false;const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const setBar=v=>{bar=Math.max(0,Math.min(100,v));fillEl.style.width=bar+'%';};
 const plan=k=>win?(k>=endAt?100:Math.min(97,100*Math.pow(k/endAt,.85)+(rnd()*4-2))):Math.min(94,96*Math.pow(Math.min(k,moves)/moves,.85)+(rnd()*3-1.5));
 const resolve=async()=>{let level=0,tiger=false;for(;;){const rs=runs();if(!rs.length)break;level++;const kill=new Set();for(const r of rs){if(r.type===TIGER)tiger=true;r.cells.forEach(([a,b])=>kill.add(a*N+b));}
   snd([523,659,784,988,1175,1319][Math.min(5,level-1)],.2,.07);vib(level>1?[18,30,18]:22);
   kill.forEach(k=>el[Math.floor(k/N)][k%N].classList.add('is-pop'));await wait(230);kill.forEach(k=>{const r=Math.floor(k/N),c=k%N;el[r][c].remove();el[r][c]=null;g[r][c]=-1;});
   for(let c=0;c<N;c++){let w=N-1;for(let r=N-1;r>=0;r--)if(g[r][c]>=0){if(w!==r){g[w][c]=g[r][c];el[w][c]=el[r][c];g[r][c]=-1;el[r][c]=null;place(el[w][c],w,c);}w--;}
    for(let r=w,k=1;r>=0;r--,k++){g[r][c]=pick();make(r,c,-k);}}
   await wait(260);}
  return tiger;};
 const finish=async won=>{over=true;await wait(350);const end=document.createElement('div');end.className='tr-end';
  let prize='';if(won){const n=cedros.get();if(n<MAX){cedros.set(n+1);prize=`<div style="width:110px;height:110px;background:url(${A('/assets/symbols/sym-scepter.png')}) center/contain no-repeat;filter:drop-shadow(0 6px 6px #0008)"></div>`;}
   else{const coins=Math.round(bet*2.5*100)/100;try{fc.sfxCoins?.();}catch{}prize=`<span style="font-size:40px;font-weight:800;color:#fff3c4">+${coins.toLocaleString('pt-BR')}</span>`;try{window.KingRicoPreviewCredit?.(coins);}catch{}}
   try{fc.sfxWin?.(true);}catch{}vib([40,40,90]);}
  else{snd(330,.4,.07);snd(262,.5,.07,.18);vib([60,60,60]);}
  end.innerHTML=`<b>${won?'VOCÊ CONSEGUIU!':'QUASE!'}</b>${prize}<button type="button">OK</button>`;board.append(end);
  end.querySelector('button').onclick=()=>{try{fc.sfxClick?.();}catch{}o.remove();done({won});};};
 const trySwap=async(r,c,R,C)=>{if(busy||over||R<0||C<0||R>=N||C>=N)return;busy=true;
  [g[r][c],g[R][C]]=[g[R][C],g[r][c]];[el[r][c],el[R][C]]=[el[R][C],el[r][c]];place(el[r][c],r,c);place(el[R][C],R,C);snd(880,.06,.03);vib(15);await wait(210);
  if(!runs().length){[g[r][c],g[R][C]]=[g[R][C],g[r][c]];[el[r][c],el[R][C]]=[el[R][C],el[r][c]];place(el[r][c],r,c);place(el[R][C],R,C);await wait(210);busy=false;return;}
  used++;movesEl.textContent=String(moves-used);const tiger=await resolve();
  if(tiger){setBar(bar-9);fillEl.classList.add('is-hurt');snd(196,.3,.08);vib([50,40,50]);await wait(420);fillEl.classList.remove('is-hurt');}
  setBar(plan(used));
  if(!hasMove()){fill();for(let a=0;a<N;a++)for(let b=0;b<N;b++){el[a][b]?.remove();make(a,b,-N);}await wait(300);}
  busy=false;if(bar>=100)return finish(true);if(used>=moves)return finish(false);};
 let start=null;
 board.addEventListener('pointerdown',e=>{if(busy||over)return;const b=board.getBoundingClientRect(),c=Math.floor((e.clientX-b.left)/(b.width/N)),r=Math.floor((e.clientY-b.top)/(b.height/N));if(r<0||c<0||r>=N||c>=N)return;start={x:e.clientX,y:e.clientY,r,c};el[r][c]?.classList.add('is-sel');try{board.setPointerCapture(e.pointerId);}catch{}});
 board.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)<16)return;const s=start;start=null;el[s.r][s.c]?.classList.remove('is-sel');Math.abs(dx)>Math.abs(dy)?trySwap(s.r,s.c,s.r,s.c+Math.sign(dx)):trySwap(s.r,s.c,s.r+Math.sign(dy),s.c);});
 const clr=()=>{if(start)el[start.r][start.c]?.classList.remove('is-sel');start=null;};board.addEventListener('pointerup',clr);board.addEventListener('pointercancel',clr);
 try{fc.sfxWin?.(false);}catch{}vib([40,40,80]);
});}
