// Receipts already consumed exactly one cedar. Presentation cannot debit it again.
export function installDefense(fc,rails){
 const payout=fc.payout.bind(fc),busy=fc.cloudBusy.bind(fc);
 fc.cloudBusy=(...args)=>!!fc._cedarDefending||busy(...args);
 fc.payout=(res,...args)=>{
  const event=fc._cloudSpin?.outcome?.defense;if(!event)return payout(res,...args);
  if(fc._cedarDefending)return;fc._cedarDefending=true;fc._celebHold=true;
  fc._parkVisibleTickets=(window.KingRicoPark.state.cedros??0)+1;
  fc.setState({spinning:false,auto:false,winCells:res.cells,winLines:res.lines,barWin:0,balPending:0,winDim:false,hint:'Trevo da sorte te protegeu!'});
  const names={tony:'Tony Tiger',tucker:'Tucker Toucan',ray:'Ray Raccoon'};
  const heads={tony:'/assets/tony/head.webp',tucker:'/assets/tucker/head.webp',ray:'/assets/ray/head-v1.webp'};
  const scene=document.createElement('div');scene.className='park-defense-scene';scene.innerHTML=`<div class="park-defense-shield"><img src="/assets/symbols/sym-clover.png" alt=""><strong>Trevo da sorte te protegeu!</strong><span>${names[event.against]} não levou nada</span></div><img class="park-defense-villain" src="${heads[event.against]}" alt="${names[event.against]}">`;
  document.body.append(scene);try{fc.sfxTicket?.(2);fc.buzz?.([40,50,80]);}catch{}
  let ended=false;
  const finish=()=>{if(ended)return;ended=true;clearTimeout(timer);scene.remove();fc._parkVisibleTickets=window.KingRicoPark.state.cedros??0;rails.querySelector('[data-tickets]').textContent=fc._parkVisibleTickets+'/5';fc._cedarDefending=false;fc._celebHold=false;fc.syncCeleb();fc.kingSet('idle');fc.setState({balance:window.KingRicoCloud.player.balance,peaches:window.KingRicoCloud.player.peaches,winCells:[],winLines:[],hint:'Trevo da sorte te protegeu!'});};
  const timer=setTimeout(finish,2600);window.addEventListener('pagehide',finish,{once:true});
 };
}
