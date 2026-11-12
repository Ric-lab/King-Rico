import {RewardAd} from '../reward-ad.js';
import {RewardReceipt} from '../reward-receipt.js';
export function installRecharge(fc){
 const Cloud=window.KingRicoCloud,h=React.createElement,host=document.createElement('div');document.body.append(host);const root=ReactDOM.createRoot(host);
 const busy=fc.cloudBusy.bind(fc);fc.cloudBusy=(...args)=>!!fc._circusRecharge||busy(...args);
 const view={ad:false,complete:false,busy:false,error:false,receipt:false,base:0};
 const finish=()=>{view.receipt=false;fc._circusRecharge=false;fc._celebHold=false;fc.setState({balance:Cloud.player.balance});fc.syncCeleb();render();};
 const cancel=()=>{if(view.busy)return;view.ad=false;finish();};
 async function confirm(){if(!view.ad||view.busy)return;view.busy=true;view.complete=true;render();try{const r=await Cloud.recharge('home');if(r.amount!==1000)throw Error('Recarga não confirmada.');view.ad=false;view.receipt=true;}catch(e){view.error=true;Cloud.error(e);}finally{view.busy=false;render();}}
 const target=()=>document.querySelector('.kr-hud-balance');
 const progress=n=>fc.setState({balance:Math.min(Cloud.player.balance,view.base+n)});
 function render(){root.render(h(React.Fragment,null,h(RewardAd,{open:view.ad,complete:view.complete,busy:view.busy,error:view.error,onComplete:confirm,onCancel:cancel,coin:'/assets/symbols/sym-coin.webp'}),h(RewardReceipt,{open:view.receipt,coin:'/assets/symbols/sym-coin.webp',target,onCollect:()=>{},onProgress:progress,onDone:finish})));}
 window.KingRicoCircusRecharge=()=>{if(fc.cloudBusy()||fc.state.showWin||fc._parkWheelVisible)return;view.base=Cloud.player.balance;view.ad=true;view.complete=false;view.error=false;fc._circusRecharge=true;fc._celebHold=true;fc.setState({menu:false,auto:false,balance:view.base});render();};
}
