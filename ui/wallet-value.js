const h=React.createElement;
function WalletValue({value,hold,external}) {
  const ref=React.useRef();
  const holding=!!hold||!!window.KingRicoCloud?.dailyRewardActive;
  React.useLayoutEffect(()=>{
    if(window.KingRicoWallet)window.KingRicoWallet.set(ref.current,value,{hold:holding,external:!!external});
    else ref.current.textContent=value;
  },[value,holding,external]);
  React.useEffect(()=>{const el=ref.current;return()=>window.KingRicoWallet?.dispose(el);},[]);
  return h('span',{ref,'data-kr-wallet-value':''});
}
module.exports={WalletValue};
