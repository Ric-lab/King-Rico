import {record} from './motion.js';
const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,4,8],[2,4,6],[0,3,6],[1,4,7],[2,5,8]];
// Credit and the pending free wager belong to saved state; the flight only presents them.
export function installCloverFreeSpin(fc){
 const bet=fc.bet.bind(fc);fc.bet=()=>window.KingRicoPark.state.cloverFreeBetUnits/100||bet();
 const busy=fc.isCeleb.bind(fc);fc.isCeleb=(...args)=>!!fc._parkFreeCloverFlying||busy(...args);
 const spin=fc.doSpin.bind(fc),press=fc.spin.bind(fc);
 let approvedToken=null;
 const pendingToken=()=>window.KingRicoPark.state.cloverFreeSpinId;
 fc.spin=(...args)=>{if(pendingToken()&&pendingToken()!==approvedToken){requestFlight();return;}return press(...args);};
 fc.doSpin=(...args)=>{
  if(fc._parkFreeCloverFlying)return;
  if(approvedToken&&pendingToken()!==approvedToken){approvedToken=null;return;}
  if(pendingToken()&&pendingToken()!==approvedToken){requestFlight();return;}
  const result=spin(...args);approvedToken=null;return result;
 };
 let giftReady=false;
 const giftPending=()=>{const cloud=window.KingRicoCloud;if(!cloud.player||cloud.dailyRewardActive)return true;if(giftReady)return false;const day=cloud.dayKey?.(),waiting=day!=null&&cloud.player.bonus?.day!==String(day).replace(/^(....)(..)(..)$/,'$1-$2-$3');if(!waiting)giftReady=true;return waiting;};
 const blocked=()=>giftPending()||document.hidden||fc.state.menu||fc.state.pays||fc.state.showWin||[...document.querySelectorAll('[role=dialog]')].some(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');
 let nextAttempt=0,cleanup=()=>{};
 function fly(){
  const token=window.KingRicoPark.state.cloverFreeSpinId;if(!token)return;
  fc._parkFreeCloverFlying=true;record(fc,'free-clover:start',{token});
  const line=fc._cloudSpin?.outcome?.cedarLines?.[0],cell=LINES[line]?.[1];
  const source=(document.querySelector('[data-sym="'+cell+'"]')||document.querySelector('.park-pocket .park-ticket-wallet-art'))?.getBoundingClientRect();
  const button=document.querySelector('[data-spin-btn]'),target=button?.getBoundingClientRect();
  const el=document.createElement('img');el.className='park-free-clover-flight';el.src='/assets/symbols/clover-rainbow-gold-v1.webp';el.alt='';document.body.append(el);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?350:1050;
  let ended=false,animation,safety,removeTimer;
  cleanup=()=>{ended=true;clearTimeout(safety);clearTimeout(removeTimer);try{animation?.cancel();}catch{}el.remove();fc._parkFreeCloverFlying=false;};
  const impact=()=>{
   if(ended)return;ended=true;clearTimeout(safety);
   fc._parkFreeCloverFlying=false;
   if(blocked()||window.KingRicoPark.state.cloverFreeSpinId!==token){cleanup();return;}
   record(fc,'free-clover:impact',{token,x:target?.x+target?.width/2,y:target?.y+target?.height/2});
   el.dataset.phase='impact';try{el.animate?.([{opacity:1,scale:1},{opacity:0,scale:.35}],{duration:180,fill:'forwards'});}catch{}
   // Use the actual spin handlers: one tactile press and one saved free operation.
   approvedToken=token;fc.pressSpin();fc.spin();setTimeout(()=>fc.pressUp(),100);
   removeTimer=setTimeout(()=>{try{animation?.cancel();}catch{}el.remove();},220);
  };
  if(source&&target)try{
   const sx=source.x+source.width/2-28,sy=source.y+source.height/2-28,tx=target.x+target.width/2-28,ty=target.y+target.height/2-28,frames=[];
   for(let i=0;i<=40;i++){const t=i/40;frames.push({transform:`translate(${(1-t)**2*sx+2*(1-t)*t*(sx+tx)/2+t*t*tx}px,${(1-t)**2*sy+2*(1-t)*t*(sy-55)+t*t*ty}px) scale(${.75+.25*t}) rotate(${-10+20*t}deg)`,opacity:Math.min(1,t*12),offset:t});}
   animation=el.animate(frames,{duration,easing:'cubic-bezier(.25,.1,.5,1)',fill:'both'});animation.finished.then(impact).catch(()=>{});
  }catch{}
  // A failed or paused animation can never lose the persisted free wager.
  safety=setTimeout(impact,duration+150);
 }
 function requestFlight(){
  if(blocked()||performance.now()<nextAttempt||!window.KingRicoPark.state.cloverFreeBetUnits||fc.cloudBusy())return;
  nextAttempt=performance.now()+3000;fly();
 }
 const tick=setInterval(requestFlight,250);
 window.addEventListener('pagehide',()=>{clearInterval(tick);cleanup();},{once:true});
}
