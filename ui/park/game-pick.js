// Trinca de Controle: 2 cartas viradas. A pessoa escolhe uma e joga o minijogo que saiu.
// Os dois pagam igual (10× a aposta, decidido pela rodada do servidor), então a escolha é só diversão.
// Teste/prévia: localStorage 'kingRico.preview.forceGame' = 'royal' | 'bubble' pula a escolha.
const FRONT={
 royal:`<div class="gp-face gp-front gp-royal"><div class="gp-icons"><i style="background-image:url(/assets/wheel/wheel-symbol-v1.webp)"></i><i style="background-image:url(/assets/symbols/sym-gem.png)"></i><i style="background-image:url(/assets/symbols/clover-green-bonus-v1.webp)"></i><i style="background-image:url(/assets/symbols/sym-crown-lossless.webp)"></i></div><b>ROYAL<br>RICO</b></div>`,
 bubble:`<div class="gp-face gp-front gp-bubble"><div class="gp-bubbles"><i style="--c:#ff5fb0;--d:#b8206e;background-image:url(/assets/wheel/wheel-symbol-v1.webp)"></i><i style="--c:#4ab4ff;--d:#1a5fb8;background-image:url(/assets/symbols/sym-gem.png)"></i><i style="--c:#ffcc2a;--d:#c07a00;background-image:url(/assets/symbols/sym-crown-lossless.webp)"></i></div><b>BUBBLE<br>RICO</b></div>`};

export function pickGame(fc){return new Promise(done=>{
 let forced=null;try{forced=localStorage.getItem('kingRico.preview.forceGame');}catch{}
 if(forced==='royal'||forced==='bubble'){done(forced);return;}
 const snd=(f,d=.18,v=.06,w=0)=>{try{fc.bell?.(f,d,v,w);}catch{}},vib=p=>{try{navigator.vibrate?.(p);}catch{}};
 const order=Math.random()<.5?['royal','bubble']:['bubble','royal'];
 const o=document.createElement('div');o.id='kr-game-pick';o.setAttribute('role','dialog');o.setAttribute('aria-label','Escolha uma carta');
 o.innerHTML=`<style>
 #kr-game-pick{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;gap:5vw;background:#2a0a4a url(/assets/bleed/stage-bleed.webp) center 100%/cover no-repeat;font-family:'Baloo 2',system-ui,sans-serif;user-select:none;-webkit-user-select:none;animation:gpIn .3s ease-out}
 #kr-game-pick::before{content:'';position:absolute;inset:0;background:radial-gradient(70% 50% at 50% 50%,rgba(30,6,50,.2),rgba(30,6,50,.7));pointer-events:none}
 @keyframes gpIn{from{opacity:0}}
 #kr-game-pick .gp-card{position:relative;width:min(40vw,190px);aspect-ratio:2/3;border:0;padding:0;background:none;perspective:900px;cursor:pointer;animation:gpDeal .5s cubic-bezier(.2,1.3,.4,1) both}
 #kr-game-pick .gp-card:nth-of-type(2){animation-delay:.12s}
 @keyframes gpDeal{from{transform:translateY(60px) scale(.6);opacity:0}}
 #kr-game-pick .gp-card:not([disabled]):active .gp-inner{transform:scale(.95)}
 #kr-game-pick .gp-inner{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.3,1.2,.5,1)}
 #kr-game-pick .gp-card.is-open .gp-inner{transform:rotateY(180deg)}
 #kr-game-pick .gp-card.is-chosen{z-index:2}#kr-game-pick .gp-card.is-chosen .gp-inner{transform:rotateY(180deg) scale(1.08)}
 #kr-game-pick .gp-card.is-other{opacity:.55;filter:saturate(.6);transition:opacity .4s,filter .4s}
 #kr-game-pick .gp-face{position:absolute;inset:0;border-radius:20px;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 0 0 4px #ffd257,0 0 0 7px #b86e0a,0 14px 24px rgba(20,0,40,.5);overflow:hidden}
 #kr-game-pick .gp-back{background:radial-gradient(circle at 50% 42%,#a04ee0,#5a1f9a 60%,#3a0d62);display:flex;align-items:center;justify-content:center}
 #kr-game-pick .gp-back::before{content:'';position:absolute;inset:10px;border-radius:13px;border:2px dashed rgba(255,215,90,.55)}
 #kr-game-pick .gp-back i{width:58%;aspect-ratio:1;background:url(/assets/symbols/sym-crown-lossless.webp) center/contain no-repeat;filter:drop-shadow(0 4px 4px rgba(0,0,0,.4));animation:gpBob 1.6s ease-in-out infinite}
 @keyframes gpBob{50%{transform:translateY(-6px) scale(1.04)}}
 #kr-game-pick .gp-front{transform:rotateY(180deg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10%;background:linear-gradient(180deg,#fffdf6,#f6e7c4)}
 #kr-game-pick .gp-front b{font:400 clamp(20px,6vw,30px)/1.05 'Rammetto One','Baloo 2',sans-serif;color:#6829a8;text-align:center;text-shadow:0 2px 0 #ffd257}
 #kr-game-pick .gp-icons{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:70%}
 #kr-game-pick .gp-icons i{aspect-ratio:1;border-radius:12px;background:rgba(104,41,168,.12) center/80% no-repeat}
 #kr-game-pick .gp-bubbles{position:relative;width:74%;aspect-ratio:1}
 #kr-game-pick .gp-bubbles i{position:absolute;width:52%;aspect-ratio:1;border-radius:50%;background:center/62% no-repeat,radial-gradient(circle at 32% 28%,#fff,var(--c) 30%,var(--d));box-shadow:0 0 0 2.5px #fff,0 4px 6px rgba(0,0,0,.25)}
 #kr-game-pick .gp-bubbles i:nth-child(1){left:0;top:4%}#kr-game-pick .gp-bubbles i:nth-child(2){right:0;top:4%}#kr-game-pick .gp-bubbles i:nth-child(3){left:24%;bottom:0}
 #kr-game-pick .gp-hand{position:absolute;left:50%;top:62%;width:54px;height:54px;margin-left:-27px;border-radius:50%;background:rgba(255,255,255,.92);box-shadow:0 0 0 8px rgba(255,255,255,.3),0 4px 10px rgba(0,0,0,.4);pointer-events:none;animation:gpHand 2.2s ease-in-out infinite}
 @keyframes gpHand{0%,100%{transform:translateX(-24vw) scale(1)}20%{transform:translateX(-24vw) scale(.85)}50%{transform:translateX(24vw) scale(1)}70%{transform:translateX(24vw) scale(.85)}}
 </style>`+order.map((id,i)=>`<button type="button" class="gp-card" aria-label="Carta ${i+1}" data-game="${id}"><div class="gp-inner"><div class="gp-face gp-back"><i></i></div>${FRONT[id]}</div></button>`).join('')+'<i class="gp-hand"></i>';
 document.body.append(o);try{fc.sfxWhoosh?.();}catch{}
 let chosen=false;
 o.querySelectorAll('.gp-card').forEach(card=>card.addEventListener('click',()=>{if(chosen)return;chosen=true;
  o.querySelector('.gp-hand')?.remove();o.querySelectorAll('.gp-card').forEach(c=>c.disabled=true);
  try{fc.sfxClick?.();}catch{}vib(25);card.classList.add('is-open','is-chosen');
  setTimeout(()=>{snd(988,.25,.07);snd(1319,.3,.06,.08);vib([20,30,40]);},260);
  const other=[...o.querySelectorAll('.gp-card')].find(c=>c!==card);
  setTimeout(()=>{other.classList.add('is-open','is-other');snd(523,.12,.04);},650);
  setTimeout(()=>{o.animate([{opacity:1},{opacity:0}],{duration:220,fill:'forwards'}).onfinish=()=>{o.remove();done(card.dataset.game);};},1500);}));
});}
