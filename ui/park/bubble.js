// Bubble Rico (minijogo do Controle, irmão do Royal Rico). Arrastar mira, soltar atira; 3+ iguais estouram, soltas caem.
// Mesmo contrato do Royal Rico: a rodada (round) vem do servidor com ganhar/perder decidido; a barra é conduzida
// para terminar no limite (suspense). Vitória = 10× a aposta, creditada uma vez por KingRicoCloud.royalComplete.
const COLORS=[
 {id:'roleta',c:'#ff5fb0',d:'#b8206e',src:'/assets/wheel/wheel-symbol-v1.webp',w:1},
 {id:'diamante',c:'#4ab4ff',d:'#1a5fb8',src:'/assets/symbols/sym-gem.png',w:1},
 {id:'trevo',c:'#43d46e',d:'#178a3c',src:'/assets/symbols/clover-green-bonus-v1.webp',w:1},
 {id:'coroa',c:'#ffcc2a',d:'#c07a00',src:'/assets/symbols/sym-crown-lossless.webp',w:1},
 {id:'tiger',c:'#ff7a3a',d:'#c0341a',src:'/assets/tony/head.webp',w:.55}];
const TIGER=4,COLS=8,ROWS=15,START_ROWS=7;

export function openBubble(fc,{round=window.KingRicoPark?.state?.royal}={}){return new Promise(done=>{
 if(!round){done({won:false});return;}
 const rnd=Math.random,win=round.won,moves=round.moves,endAt=round.endAt;
 const snd=(f,d=.18,v=.06,w=0)=>{try{fc.bell?.(f,d,v,w);}catch{}},vib=p=>{try{navigator.vibrate?.(p);}catch{}};
 const pickColor=(pool)=>{const list=pool&&pool.length?pool:[0,1,2,3,4];let t=rnd()*list.reduce((a,i)=>a+COLORS[i].w,0);for(const i of list){t-=COLORS[i].w;if(t<=0)return i;}return list[0];};
 const imgs=COLORS.map(k=>{const im=new Image();im.src=k.src;return im;});
 const o=document.createElement('div');o.id='kr-controller-game';o.className='is-bubble';o.setAttribute('role','dialog');o.setAttribute('aria-label','Bubble Rico');
 o.innerHTML=`<style>
 #kr-controller-game.is-bubble{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px 0;box-sizing:border-box;background:#2a0a4a url(/assets/bleed/stage-bleed.webp) center 100%/cover no-repeat;font-family:'Baloo 2',system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none}
 #kr-controller-game.is-bubble::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(30,6,50,.15),rgba(30,6,50,.45));pointer-events:none}
 #kr-controller-game .tr-top{position:relative;width:min(96vw,460px);box-sizing:border-box;display:flex;align-items:center;gap:14px;padding:10px 14px;border-radius:22px;background:linear-gradient(180deg,#fffdf6,#f6e7c4);box-shadow:0 0 0 3px #f0b41f,0 0 0 6px #b86e0a,0 8px 16px rgba(60,20,0,.3)}
 #kr-controller-game .tr-moves{flex:0 0 auto;width:72px;height:72px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 40% 30%,#8a4fd8,#5a1f9a 70%);box-shadow:inset 0 -4px 0 rgba(0,0,0,.25),0 0 0 3px #fff3c4,0 0 0 5px #d18a0c;color:#fff;font-weight:800;line-height:1}
 #kr-controller-game .tr-moves b{font-size:34px;text-shadow:0 2px 0 rgba(0,0,0,.3)}#kr-controller-game .tr-moves small{font-size:10px;letter-spacing:1px;opacity:.9}
 #kr-controller-game .tr-bar{flex:1;height:30px;border-radius:15px;background:#5a2a12;box-shadow:inset 0 3px 6px rgba(0,0,0,.5),0 0 0 2px #fff3c4;overflow:hidden;position:relative}
 #kr-controller-game .tr-fill{position:absolute;inset:3px auto 3px 3px;width:0;max-width:calc(100% - 6px);border-radius:12px;background:linear-gradient(180deg,#9dff7a,#2ec962 55%,#1f9a48);box-shadow:inset 0 4px 0 rgba(255,255,255,.5);transition:width .45s cubic-bezier(.3,1.4,.5,1),filter .2s}
 #kr-controller-game .tr-fill.is-hurt{filter:hue-rotate(-110deg) saturate(2.2)}
 #kr-controller-game .tr-goal{flex:0 0 auto;width:60px;height:60px;margin-left:-26px;position:relative;z-index:1;background:url(/assets/symbols/sym-coin.webp) center/contain no-repeat;filter:drop-shadow(0 3px 3px rgba(60,20,0,.45))}
 #kr-controller-game .bb-board{position:relative;width:min(96vw,460px);aspect-ratio:4/5;max-height:calc(100vh - 150px);border-radius:20px;background:rgba(70,20,110,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);box-shadow:0 0 0 4px #fff,0 0 0 7px #f0b41f,0 14px 26px rgba(20,40,80,.4);overflow:hidden}
 #kr-controller-game .bb-board canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
 #kr-controller-game .bb-hand{position:absolute;left:50%;bottom:18%;width:54px;height:54px;margin-left:-27px;border-radius:50%;background:rgba(255,255,255,.92);box-shadow:0 0 0 8px rgba(255,255,255,.3),0 4px 10px rgba(0,0,0,.4);pointer-events:none;animation:bbHand 1.6s ease-in-out infinite}
 @keyframes bbHand{0%{transform:translate(0,0);opacity:0}15%{opacity:1}60%{transform:translate(-40px,-90px);opacity:1}100%{transform:translate(-46px,-100px);opacity:0}}
 #kr-controller-game .tr-pts{position:fixed;z-index:9100;pointer-events:none;font:800 var(--fs,30px)/1 'Rammetto One','Baloo 2',sans-serif;color:var(--c,#fff);-webkit-text-stroke:3px #4a1a00;paint-order:stroke;text-shadow:0 3px 0 #4a1a00,0 0 14px var(--c,#fff);transform:translate(-50%,-50%)}
 #kr-controller-game .tr-end{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:rgba(255,252,240,.9);animation:bbIn .3s ease-out}
 @keyframes bbIn{from{opacity:0;transform:scale(.9)}}
 #kr-controller-game .tr-end b{font-family:'Rammetto One','Baloo 2',sans-serif;font-size:34px;color:#ffb21a;text-shadow:0 3px 0 #8a4a05}
 #kr-controller-game .tr-end button{padding:14px 56px;border:0;border-radius:999px;font:800 26px/1 'Baloo 2',sans-serif;color:#fff;background:linear-gradient(180deg,#6cf096,#2ec962 60%,#22a650);box-shadow:0 5px 0 #147a36;cursor:pointer}
 </style><div class="tr-top"><div class="tr-moves"><b>${moves}</b><small>TIROS</small></div><div class="tr-bar"><div class="tr-fill"></div></div><div class="tr-goal"><b style="position:absolute;bottom:-8px;right:-8px;border-radius:10px;padding:1px 7px;background:#6829a8;color:#fff;border:2px solid #ffd257;font-size:18px">10×</b></div></div><div class="bb-board" aria-busy="false"><canvas></canvas><i class="bb-hand"></i></div>`;
 document.body.append(o);
 let over=false;
 {const x=document.createElement('button');x.type='button';x.setAttribute('aria-label','Fechar e voltar');x.textContent='✕';x.style.cssText="position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);right:12px;z-index:50;width:46px;height:46px;border-radius:50%;border:0;font:800 22px/1 'Baloo 2',sans-serif;color:#fff;background:rgba(40,8,60,.8);box-shadow:0 0 0 2.5px #ffd257,0 4px 8px #0006;cursor:pointer";
  x.onclick=async()=>{if(!o.isConnected||over)return;over=true;x.disabled=true;try{await window.KingRicoCloud.royalComplete(round.id,true);stop();o.remove();done({won:false,quit:true});}catch(e){over=false;x.disabled=false;window.KingRicoCloud.error(e);}};o.append(x);}
 const board=o.querySelector('.bb-board'),cv=board.querySelector('canvas'),ctx=cv.getContext('2d'),fillEl=o.querySelector('.tr-fill'),movesEl=o.querySelector('.tr-moves b');
 let W=0,H=0,d=0,r=0,h=0,SX=0,SY=0;
 const fit=()=>{const b=board.getBoundingClientRect(),dpr=Math.min(3,window.devicePixelRatio||1);W=b.width;H=b.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);d=W/8.5;r=d/2;h=d*.866;SX=W/2;SY=H-d*1.05;};
 fit();addEventListener('resize',fit);
 // Grade hexagonal: linhas ímpares deslocadas meio passo para a direita.
 const g=Array.from({length:ROWS},()=>Array(COLS).fill(-1));
 const px=(row,c)=>r+c*d+(row%2?r:0),py=row=>r+row*h;
 const nb=(row,c)=>{const o2=row%2?[[0,-1],[0,1],[-1,0],[-1,1],[1,0],[1,1]]:[[0,-1],[0,1],[-1,-1],[-1,0],[1,-1],[1,0]];return o2.map(([a,b])=>[row+a,c+b]).filter(([a,b])=>a>=0&&a<ROWS&&b>=0&&b<COLS);};
 for(let row=0;row<START_ROWS;row++)for(let c=0;c<COLS;c++){const n=nb(row,c).filter(([a,b])=>g[a][b]>=0&&(a<row||(a===row&&b<c)));g[row][c]=n.length&&rnd()<.45?g[n[0][0]][n[0][1]]:pickColor();}
 const present=()=>{const s=new Set();for(const row of g)for(const v of row)if(v>=0)s.add(v);return [...s];};
 let cur=pickColor(present()),next=pickColor(present());
 let used=0,bar=0,busy=false,aim=null,shot=null,fx=[],raf=0,hinted=false;
 const wait=ms=>new Promise(res=>setTimeout(res,ms));
 const setBar=v=>{bar=Math.max(0,Math.min(100,v));fillEl.style.width=bar+'%';};
 const plan=k=>win?(k>=endAt?100:Math.min(97,100*Math.pow(k/endAt,.85)+(rnd()*4-2))):Math.min(94,96*Math.pow(Math.min(k,moves)/moves,.85)+(rnd()*3-1.5));
 const drawBubble=(x,y,col,s=1,a=1)=>{if(s<=0||a<=0)return;const k=COLORS[col],R=r*.94*s;ctx.save();ctx.globalAlpha=a;
  const gr=ctx.createRadialGradient(x-R*.35,y-R*.4,R*.1,x,y,R);gr.addColorStop(0,'#ffffff');gr.addColorStop(.25,k.c);gr.addColorStop(1,k.d);
  ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.fillStyle=gr;ctx.fill();ctx.lineWidth=Math.max(1.5,R*.08);ctx.strokeStyle='rgba(255,255,255,.85)';ctx.stroke();
  const im=imgs[col];if(im.complete&&im.naturalWidth){const S=R*1.25;ctx.drawImage(im,x-S/2,y-S/2,S,S);}
  ctx.beginPath();ctx.ellipse(x-R*.35,y-R*.45,R*.28,R*.16,-.6,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fill();ctx.restore();};
 // Trajetória com quique nas paredes até encostar numa bolha ou no teto.
 const trace=(ang)=>{let x=SX,y=SY,vx=Math.cos(ang),vy=-Math.sin(ang);const pts=[[x,y]],step=r/3;for(let i=0;i<900;i++){x+=vx*step;y+=vy*step;if(x<r){x=r;vx=Math.abs(vx);pts.push([x,y]);}if(x>W-r){x=W-r;vx=-Math.abs(vx);pts.push([x,y]);}if(y<=r||hit(x,y)){pts.push([x,y]);break;}}return pts;};
 const hit=(x,y)=>{const row0=Math.max(0,Math.floor((y-r)/h)-1);for(let row=row0;row<Math.min(ROWS,row0+3);row++)for(let c=0;c<COLS;c++)if(g[row][c]>=0&&Math.hypot(px(row,c)-x,py(row)-y)<d*.86)return true;return false;};
 const snap=(x,y)=>{const est=Math.round((y-r)/h);let best=null;for(let row=Math.max(0,est-1);row<=Math.min(ROWS-1,est+1);row++)for(let c=0;c<COLS;c++){if(g[row][c]>=0)continue;if(row>0&&!nb(row,c).some(([a,b])=>g[a][b]>=0))continue;const dd=Math.hypot(px(row,c)-x,py(row)-y);if(!best||dd<best.dd)best={row,c,dd};}
  if(!best)for(let c=0;c<COLS;c++)if(g[0][c]<0){const dd=Math.abs(px(0,c)-x);if(!best||dd<best.dd)best={row:0,c,dd};}return best;};
 const render=()=>{ctx.clearRect(0,0,W,H);
  ctx.save();ctx.strokeStyle='rgba(255,236,170,.35)';ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(0,py(ROWS-2)+r);ctx.lineTo(W,py(ROWS-2)+r);ctx.stroke();ctx.restore();
  for(let row=0;row<ROWS;row++)for(let c=0;c<COLS;c++)if(g[row][c]>=0)drawBubble(px(row,c),py(row),g[row][c]);
  if(aim&&!shot){const pts=trace(aim.ang);ctx.save();ctx.fillStyle='rgba(255,255,255,.9)';let acc=0;for(let i=1;i<pts.length;i++){const [x0,y0]=pts[i-1],[x1,y1]=pts[i],L=Math.hypot(x1-x0,y1-y0);for(let t=(d*.55-acc)%(d*.55);t<L;t+=d*.55){if(t<0)continue;const k=t/L;ctx.beginPath();ctx.arc(x0+(x1-x0)*k,y0+(y1-y0)*k,Math.max(2.5,r*.16),0,Math.PI*2);ctx.fill();}acc=(acc+L)%(d*.55);}ctx.restore();}
  // Canhão: anel dourado + bolha da vez; a próxima espera ao lado.
  ctx.save();ctx.beginPath();ctx.arc(SX,SY,r*1.28,0,Math.PI*2);ctx.fillStyle='rgba(40,8,60,.55)';ctx.fill();ctx.lineWidth=4;ctx.strokeStyle='#ffd257';ctx.stroke();ctx.restore();
  if(!shot)drawBubble(SX,SY,cur);drawBubble(SX-d*1.9,SY+r*.25,next,.68);
  if(shot)drawBubble(shot.x,shot.y,shot.col);
  for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.t+=1/60;if(f.kind==='pop'){const k=Math.max(0,Math.min(1,f.t/.22));drawBubble(f.x,f.y,f.col,1+.35*k,1-k);if(k>=1)fx.splice(i,1);}else{f.vy+=H*2.4/60;f.y+=f.vy/60;f.x+=f.vx/60;drawBubble(f.x,f.y,f.col,1,Math.max(0,1-f.t*.9));if(f.y>H+r)fx.splice(i,1);}}};
 const loop=()=>{if(!o.isConnected)return;stepShot();render();raf=requestAnimationFrame(loop);};raf=requestAnimationFrame(loop);
 const stop=()=>{cancelAnimationFrame(raf);removeEventListener('resize',fit);};
 const stepShot=()=>{if(!shot)return;const sp=W*2.4/60,n=6;for(let i=0;i<n;i++){shot.x+=shot.vx*sp/n;shot.y+=shot.vy*sp/n;
  if(shot.x<r){shot.x=r;shot.vx=Math.abs(shot.vx);snd(1320,.04,.025);vib(8);}if(shot.x>W-r){shot.x=W-r;shot.vx=-Math.abs(shot.vx);snd(1320,.04,.025);vib(8);}
  if(shot.y<=r||hit(shot.x,shot.y)){const s=shot;shot=null;land(s);return;}}};
 const fly=(txt,col,fs,x,y)=>{const b=cv.getBoundingClientRect(),X=b.left+x,Y=b.top+y,p=document.createElement('span');p.className='tr-pts';p.textContent=txt;p.style.cssText=`--c:${col};--fs:${fs}px;left:${X}px;top:${Y}px`;o.append(p);
  const f=fillEl.getBoundingClientRect(),tx=f.left+Math.max(12,f.width),ty=f.top+f.height/2;
  p.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:'translate(-50%,-50%) scale(1.25)',opacity:1,offset:.2},{transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.45},{transform:`translate(calc(-50% + ${tx-X}px),calc(-50% + ${ty-Y}px)) scale(.5)`,opacity:.9}],{duration:900,easing:'cubic-bezier(.4,0,.6,1)'}).onfinish=()=>{p.remove();fillEl.animate([{filter:'brightness(1.8)'},{filter:'none'}],{duration:260});};};
 const land=async s=>{const at=snap(s.x,s.y);if(!at){busy=false;board.setAttribute('aria-busy','false');return;}
  g[at.row][at.c]=s.col;snd(440,.06,.04);vib(14);
  // Estoura 3+ da mesma cor ligadas à bolha que chegou.
  const same=[[at.row,at.c]],seen=new Set([at.row*COLS+at.c]);for(let i=0;i<same.length;i++)for(const [a,b] of nb(...same[i]))if(!seen.has(a*COLS+b)&&g[a][b]===s.col){seen.add(a*COLS+b);same.push([a,b]);}
  let popped=0,dropped=0,tiger=false;
  if(same.length>=3){popped=same.length;tiger=s.col===TIGER;same.forEach(([a,b],i)=>{fx.push({kind:'pop',x:px(a,b),y:py(a),col:g[a][b],t:-i*.04});g[a][b]=-1;snd([523,587,659,784,880,988,1047,1175,1319][Math.min(8,i)],.14,.05,i*.04);});vib(popped>4?[20,25,20,25,40]:[22,20,30]);
   // Soltas do teto caem.
   const keep=new Set(),q=[];for(let c=0;c<COLS;c++)if(g[0][c]>=0){keep.add(c);q.push([0,c]);}for(let i=0;i<q.length;i++)for(const [a,b] of nb(...q[i]))if(g[a][b]>=0&&!keep.has(a*COLS+b)){keep.add(a*COLS+b);q.push([a,b]);}
   for(let a=0;a<ROWS;a++)for(let b=0;b<COLS;b++)if(g[a][b]>=0&&!keep.has(a*COLS+b)){fx.push({kind:'drop',x:px(a,b),y:py(a),col:g[a][b],vx:(rnd()-.5)*W*.4,vy:-H*.15,t:0});g[a][b]=-1;dropped++;}
   if(dropped){setTimeout(()=>{snd(330,.12,.05);snd(262,.14,.05,.06);vib([30,30,60]);},180);}
   const n=popped+2*dropped,col=n>=8?'#ffd257':n>=5?'#7fe3ff':'#ffffff';if(!tiger)fly('+'+n,col,n>=8?40:n>=5?32:26,px(at.row,at.c),py(at.row));}
  used++;movesEl.textContent=String(moves-used);
  if(tiger){setBar(bar-9);fillEl.classList.add('is-hurt');snd(196,.3,.08);vib([50,40,50]);await wait(420);fillEl.classList.remove('is-hurt');}
  await wait(popped?520:220);
  const units=popped?1+(popped-3)*.25+dropped*.5:0;if(!tiger)setBar(Math.min(win?100:94,Math.max(plan(used),bar+6*Math.max(0,units-1))));
  // Pouca bolha na tela: entram 2 linhas novas no topo (mantém o desafio sem acabar o tabuleiro).
  let count=0,low=0;for(let a=0;a<ROWS;a++)for(let b=0;b<COLS;b++)if(g[a][b]>=0){count++;low=Math.max(low,a);}
  if(count<14&&low<ROWS-3){for(let a=ROWS-1;a>=2;a--)g[a]=g[a-2];g[0]=Array(COLS).fill(-1);g[1]=Array(COLS).fill(-1);for(let a=0;a<2;a++)for(let b=0;b<COLS;b++)g[a][b]=pickColor();snd(660,.1,.04);}
  cur=next;next=pickColor(present());
  busy=false;board.setAttribute('aria-busy','false');if(bar>=100)return finish(true);if(used>=moves)return finish(false);};
 const finish=async won=>{over=true;await wait(350);const end=document.createElement('div');end.className='tr-end';
  let result;
  try{result=await window.KingRicoCloud.royalComplete(round.id,false);}catch(e){
   end.innerHTML='<b>CONFIRMAR PRÊMIO</b><button type="button">TENTAR NOVAMENTE</button>';board.append(end);
   end.querySelector('button').onclick=()=>{end.remove();finish(won);};window.KingRicoCloud.error(e);return;}
  won=result.royal.won;
  let prize='';if(won){const coins=result.royal.winUnits/100;
   prize=`<img src="/assets/symbols/sym-coin.webp" alt="" style="width:96px;height:96px;object-fit:contain"><span style="font-size:28px;font-weight:800;color:#8a4a05">+${coins.toLocaleString('pt-BR',{maximumFractionDigits:2})} MOEDAS</span>`;
   try{fc.sfxWin?.(true);}catch{}vib([40,40,90]);}
  else{snd(330,.4,.07);snd(262,.5,.07,.18);vib([60,60,60]);}
  end.innerHTML=`<b>${won?'VOCÊ CONSEGUIU!':'QUASE!'}</b>${prize}<button type="button">OK</button>`;board.append(end);
  end.querySelector('button').onclick=()=>{try{fc.sfxClick?.();}catch{}stop();o.remove();done({won});};};
 const angleAt=e=>{const b=cv.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;if(y>SY-r*.5)return null;const a=Math.atan2(SY-y,x-SX);return Math.max(.2,Math.min(Math.PI-.2,a));};
 board.addEventListener('pointerdown',e=>{if(busy||over||shot)return;try{board.setPointerCapture(e.pointerId);}catch{}const a=angleAt(e);aim={ang:a??Math.PI/2,ok:a!=null};});
 board.addEventListener('pointermove',e=>{if(!aim)return;const a=angleAt(e);if(a!=null){aim.ang=a;aim.ok=true;}});
 board.addEventListener('pointerup',e=>{if(!aim||busy||over)return;const a=angleAt(e),A2=a??aim.ang,ok=aim.ok||a!=null;aim=null;if(!ok)return;
  busy=true;board.setAttribute('aria-busy','true');if(!hinted){hinted=true;board.querySelector('.bb-hand')?.remove();}
  shot={x:SX,y:SY,vx:Math.cos(A2),vy:-Math.sin(A2),col:cur};snd(660,.08,.05);snd(990,.06,.03,.03);vib(18);});
 board.addEventListener('pointercancel',()=>{aim=null;});
 try{fc.sfxWin?.(false);}catch{}vib([40,40,80]);
});}
