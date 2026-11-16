// The pending free wager belongs to saved park state, never to an animation timer.
export function installCloverFreeSpin(fc){
 const bet=fc.bet.bind(fc);fc.bet=()=>window.KingRicoPark.state.cloverFreeBetUnits/100||bet();
 const payout=fc.payout.bind(fc);
 fc.payout=(...args)=>{
  const result=payout(...args);
  if(fc._cloudSpin?.outcome?.freeSpinAward){
   const label=document.createElement('strong');label.className='park-free-spin-caption';label.textContent='+1 GIRO GRÁTIS';document.body.append(label);
   fc._parkFreeNoticeUntil=performance.now()+1800;setTimeout(()=>label.remove(),1800);
  }
  return result;
 };
 let nextAttempt=0;
 const tick=setInterval(()=>{
  if(document.hidden||performance.now()<nextAttempt||fc.state.menu||fc.state.pays||[...document.querySelectorAll('[role=dialog]')].some(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden')||!window.KingRicoPark.state.cloverFreeBetUnits||performance.now()<(fc._parkFreeNoticeUntil||0)||fc.cloudBusy()||fc.state.showWin||document.querySelector('.park-modal,.park-controller-game'))return;
  nextAttempt=performance.now()+3000;fc.doSpin();
 },250);
 window.addEventListener('pagehide',()=>clearInterval(tick),{once:true});
}
