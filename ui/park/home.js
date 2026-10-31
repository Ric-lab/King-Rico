import {MenuPanel} from '../menu.js';
import {RewardAd} from '../reward-ad.js';
import {RewardReceipt} from '../reward-receipt.js';
(async()=>{
 while(!window.KingRicoPark)await new Promise(r=>setTimeout(r,20));
 const {Cloud,format,modal}=window.KingRicoPark;await Cloud.ready;if(!Cloud.player)return;
 const value=document.querySelector('[data-home-balance]'),recharge=document.querySelector('[data-recharge]'),host=document.createElement('div');document.body.append(host);
 const root=ReactDOM.createRoot(host),h=React.createElement;
 const view={menu:false,ad:false,complete:false,busy:false,error:false,receipt:false,base:0,target:0,daily:false};
 const wallet=(n,extra={})=>window.KingRicoWallet?.set(value,format(n),extra);
 const render=()=>root.render(h(React.Fragment,null,
  h(MenuPanel,{open:view.menu,onClose:()=>{view.menu=false;render();},screen:'Fortune Circus',details:'Trincas de ingressos dão 3 entradas para o parque. A roleta multiplica o prêmio do décimo giro.',sfxLvl:Cloud.player?.settings.sfxLvl,vibLvl:Cloud.player?.settings.vibLvl,onSfx:n=>Cloud.settings({sfxLvl:n}),onVib:n=>Cloud.settings({vibLvl:n})}),
  h(RewardAd,{open:view.ad,complete:view.complete,busy:view.busy,error:view.error,onComplete:finishAd,onCancel:cancelAd,coin:'/assets/symbols/sym-coin.webp'}),
  h(RewardReceipt,{open:view.receipt,coin:'/assets/symbols/sym-coin.webp',target:rewardTarget,onCollect:()=>{},onProgress:rewardProgress,onDone:rewardDone})));
 function rewardTarget(){return value.closest('[aria-label="Seu saldo"]');}
 function rewardProgress(n){wallet(Math.min(view.target,view.base+n),{external:true});}
 function rewardDone(){view.receipt=false;wallet(Cloud.player.balance,{external:true});render();}
 function cancelAd(){if(view.busy)return;view.ad=false;view.complete=false;view.error=false;render();}
 async function finishAd(){if(!view.ad||view.busy)return;view.busy=true;view.complete=true;view.error=false;render();try{
  view.base=Cloud.player.balance;const r=await Cloud.recharge('home');if(r.amount!==1000)throw Error('Recarga não confirmada.');
  view.target=Cloud.player.balance;view.ad=false;view.receipt=true;
 }catch(e){view.error=true;Cloud.error(e);}finally{view.busy=false;render();}}
 function daily(){
  if(view.daily)return;const p=Cloud.player,key=String(Cloud.dayKey()),today=key.slice(0,4)+'-'+key.slice(4,6)+'-'+key.slice(6);
  if(p.bonus.day===today)return;const gap=p.bonus.day?(Date.parse(today)-Date.parse(p.bonus.day))/86400000:99;
  const n=gap===1?p.bonus.streak%7:0,amount=[50,100,150,200,250,500,1000][n];view.daily=true;
  const e=modal(`<p class="park-eyebrow">DIA ${n+1} DE 7</p><h2>Presente do dia</h2><img src="/assets/symbols/sym-coin.webp" alt="" style="width:100px;height:100px"><p><strong>+${format(amount)} moedas</strong></p><button class="park-action">PEGAR MOEDAS</button>`,'Presente do dia');
  e.querySelector('button').onclick=async()=>{const button=e.querySelector('button');button.disabled=true;try{await Cloud.bonus();const rect=e.querySelector('img').getBoundingClientRect();e.close();view.daily=false;wallet(Cloud.player.balance,{source:{getBoundingClientRect:()=>rect}});}catch(error){Cloud.error(error);button.disabled=false;}};
 }
 Cloud.watch(p=>{
  wallet(p.balance,{hold:view.ad||view.receipt||view.daily});document.querySelector('[data-ticket-count]').textContent=Cloud.park?.tickets||0;
  for(const a of document.querySelectorAll('[data-game]'))a.querySelector('.park-card-price').textContent=p[a.dataset.game+'Round']?'CONTINUAR PARTIDA':'1 ingresso ou 25 moedas';
  recharge.disabled=view.ad||view.receipt||view.busy;
  render();
 });
 const icons=['sym-crown-lossless.webp','sym-gem.png','sym-coin.webp','sym-clover.png','sym-wild-s.webp','sym-tent-lossless.webp','sym-drum.png','sym-candy.webp','sym-scepter.png'];
 document.querySelector('.park-hero-symbols').innerHTML=icons.map(x=>`<img src="/assets/symbols/${x}" alt="">`).join('');
 recharge.onclick=()=>{if(view.ad||view.receipt||view.busy)return;view.ad=true;view.complete=false;view.error=false;render();};
 document.querySelector('.park-home-menu').onclick=()=>{view.menu=true;render();};daily();
})();
