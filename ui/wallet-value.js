const h=React.createElement;
function WalletValue({value,hold,external}) {
  const ref=React.useRef();
  React.useLayoutEffect(()=>{
    if(window.KingRicoWallet)window.KingRicoWallet.set(ref.current,value,{hold:!!hold,external:!!external});
    else ref.current.textContent=value;
  },[value,hold,external]);
  React.useEffect(()=>{const el=ref.current;return()=>window.KingRicoWallet?.dispose(el);},[]);
  return h('span',{ref,'data-kr-wallet-value':''});
}
module.exports={WalletValue};
