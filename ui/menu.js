// Shared by the Home screen and all games through the DC runtime's x-import.
const h = React.createElement;
if (!document.getElementById('king-rico-menu-style')) {
  const style = document.createElement('style');
  style.id = 'king-rico-menu-style';
  style.textContent = `
    .kr-menu-button{position:absolute;right:20.167px;top:29.5px;width:41px;height:41px;padding:0;border:0;border-radius:50%;cursor:pointer;background: url('assets/stage-lit.webp') -391.833px -29.5px / 453px 802px no-repeat;transform:translateX(2px) scale(1.25);overflow:hidden}
    .kr-menu-button:active{filter:brightness(.6) saturate(1.2);box-shadow:inset 0 2px 6px #0005}
    .kr-menu-button:disabled{cursor:default;opacity:.55}
    .kr-menu-button:focus-visible,.kr-menu-dialog button:focus-visible{outline:3px solid #fff3c4;outline-offset:3px}
    .kr-menu-shade{position:fixed;inset:0;z-index:1000;background:rgba(10,2,20,.8);font-family:'Baloo 2',system-ui,sans-serif;color:#f6e8ff;-webkit-tap-highlight-color:transparent}
    .kr-menu-dialog{position:absolute;left:50%;top:max(72px,calc(env(safe-area-inset-top,0px) + 16px));transform:translateX(-50%);width:min(421px,calc(100% - 32px));max-height:calc(100dvh - 88px - env(safe-area-inset-bottom,0px));box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;border-radius:18px;background:linear-gradient(180deg,#3d0a63,#26043f);border:2px solid #f0b41f;box-shadow:0 16px 40px #0009}
    .kr-menu-dialog button{font:inherit;color:inherit;cursor:pointer}
    .kr-menu-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px 12px;border-bottom:1px solid #ffd25738}
    .kr-menu-header h2{margin:0;font-size:26px;font-weight:800;color:#fff3c4}
    .kr-menu-close{width:44px;height:44px;flex-shrink:0;border:0;border-radius:50%;background:#0005;color:#ffd257!important;font-size:22px!important;font-weight:800!important}
    .kr-menu-screen{margin:0;padding:12px 18px 0;font-size:14px;font-weight:800;letter-spacing:1px;color:#c9a3e6}
    .kr-menu-controls{padding:0 18px}
    .kr-menu-row{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #ffffff14}
    .kr-menu-icon{width:24px;flex-shrink:0;text-align:center;font-size:22px;color:#ffd257}
    .kr-menu-label{flex:1;font-size:19px;font-weight:700;line-height:1.2}
    .kr-menu-levels{display:flex;flex-shrink:0;gap:3px;padding:3px;border-radius:17px;background:#ffffff1f}
    .kr-menu-levels button{min-width:46px;min-height:44px;padding:0 6px;border:0;border-radius:14px;background:transparent;font-size:14px;font-weight:800;color:#e8d4ff}
    .kr-menu-levels button[aria-pressed=true]{background:#ffd257;color:#4a1a00}
    .kr-menu-paytable{width:100%;border:0;background:transparent;text-align:left}
    .kr-menu-arrow{font-size:26px;font-weight:800;color:#ffd257}
    .kr-menu-progress{padding:14px 18px;background:#0004}
    .kr-menu-progress h3{margin:0 0 7px;font-size:19px;font-weight:800;color:#fff3c4}
    .kr-menu-progress p{margin:6px 0;font-size:16px;line-height:1.45;color:#dcc2f0}
    .kr-menu-account{display:grid;grid-template-columns:1fr;gap:10px;padding:12px 18px 16px;border-top:1px solid #ffd25738}
    .kr-menu-account button{min-height:44px;padding:10px 12px;border:1px solid #ffd25770;border-radius:12px;background:#ffffff0d;font-size:17px;font-weight:700;text-align:left}
    @media(max-width:380px){.kr-menu-label{font-size:17px}.kr-menu-row{gap:7px}.kr-menu-controls{padding:0 12px}.kr-menu-icon{width:20px}}
    @media(max-height:500px){.kr-menu-dialog{top:16px;max-height:calc(100dvh - 32px)}}
  `;
  document.head.append(style);
}

function MenuButton({onClick,style,hidden,disabled,onPointerDown,onPointerUp}) {
  if (hidden) return null;
  return h('button',{type:'button',className:'kr-menu-button','aria-label':'Abrir menu',
    'aria-haspopup':'dialog',onClick,style,disabled,onPointerDown,onPointerUp,
    onPointerLeave:onPointerUp,onPointerCancel:onPointerUp});
}

function MenuPanel({open,onClose,onPaytable,screen,details,sfxLvl=2,vibLvl=2,onSfx,onVib}) {
  const cloud=window.KingRicoCloud;
  const [player,setPlayer]=React.useState(cloud?.player);
  const panel=React.useRef(null);
  React.useEffect(()=>cloud?.watch(setPlayer),[cloud]);
  React.useEffect(()=>{
    if (!open) return;
    const previous=document.querySelector('.kr-menu-button:not(:disabled)') || document.activeElement;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    panel.current?.querySelector('button')?.focus();
    const keydown=event=>{
      if(event.key==='Escape') {event.preventDefault();event.stopPropagation();onClose();}
      if(event.key==='Tab') {
        const buttons=Array.from(panel.current.querySelectorAll('button:not(:disabled)'));
        const first=buttons[0],last=buttons.at(-1);
        if(event.shiftKey && document.activeElement===first) {event.preventDefault();last.focus();}
        else if(!event.shiftKey && document.activeElement===last) {event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',keydown);
    return ()=>{
      document.removeEventListener('keydown',keydown);document.body.style.overflow=overflow;
      (previous?.isConnected ? previous : document.querySelector('.kr-menu-button:not(:disabled)'))?.focus();
    };
  },[open]);
  if(!open) return null;
  const levels=(label,icon,value,change)=>h('div',{className:'kr-menu-row'},
    h('span',{className:'kr-menu-icon','aria-hidden':true},icon),
    h('span',{className:'kr-menu-label'},label),
    h('div',{className:'kr-menu-levels',role:'group','aria-label':label},
      ...['OFF','50%','100%'].map((name,i)=>h('button',{key:i,type:'button',
        'aria-label':name,'aria-pressed':value===i,onClick:()=>change(i)},name))));
  return window.ReactDOM.createPortal(h('div',{className:'kr-menu-shade',
    onClick:event=>{if(event.target===event.currentTarget) onClose();}},
    h('section',{ref:panel,className:'kr-menu-dialog',role:'dialog','aria-modal':true,
      'aria-label':`Menu — ${screen}`,'data-menu-screen':screen},
      h('div',{className:'kr-menu-header'},h('h2',null,'Menu'),
        h('button',{type:'button',className:'kr-menu-close','aria-label':'Fechar menu',onClick:onClose},'✕')),
      h('p',{className:'kr-menu-screen'},screen),
      h('div',{className:'kr-menu-controls'},
        levels('Efeitos sonoros','♫',sfxLvl,onSfx),levels('Vibração','≈',vibLvl,onVib),
        onPaytable && h('button',{type:'button',className:'kr-menu-row kr-menu-paytable',
          'aria-label':'Tabela de pagamentos',onClick:onPaytable},
          h('span',{className:'kr-menu-icon','aria-hidden':true},'◇'),
          h('span',{className:'kr-menu-label'},'Tabela de pagamentos'),
          h('span',{className:'kr-menu-arrow','aria-hidden':true},'›'))),
      h('div',{className:'kr-menu-progress'},h('h3',null,'Seu progresso'),h('p',null,details),
        h('p',null,cloud?.enabled
          ? 'Saldo e ajustes salvos na sua conta Google e compartilhados entre os jogos.'
          : 'Saldo e ajustes salvos neste aparelho.'),
        h('p',null,'Moedas virtuais, sem dinheiro real.')),
      cloud?.enabled && player && h('div',{className:'kr-menu-account'},
        h('button',{type:'button','data-cloud-analytics':'','aria-pressed':!!player.analyticsConsent},
          `Dados de uso: ${player.analyticsConsent?'ligados':'desligados'}`),
        h('button',{type:'button','data-cloud-signout':''},'Sair da conta')))),document.body);
}

module.exports={MenuButton,MenuPanel};

// The same exhausted-wallet prompt in every game. Daily gift and refill are separate.
function RechargePanel({available=true,onLocalRecharge}) {
  const cloud=window.KingRicoCloud;
  const [player,setPlayer]=React.useState(cloud?.player),[busy,setBusy]=React.useState(false);
  React.useEffect(()=>cloud?.watch(setPlayer),[cloud]);
  if(!available||!cloud?.enabled||!player||player.balance>=1||player.neckRound||player.fingoRound||player.penaltyRound||player.bounceRound)return null;
  return window.ReactDOM.createPortal(h('div',{className:'kr-menu-shade',style:{display:'grid',placeItems:'center'}},
    h('section',{className:'kr-menu-dialog',role:'dialog','aria-modal':true,'aria-label':'Saldo esgotado',style:{position:'relative',left:'auto',top:'auto',transform:'none',padding:24,textAlign:'center'}},
      h('h2',{style:{color:'#ffe2a3'}},'SALDO ESGOTADO'),h('p',null,'Recarregue 1.000 moedas virtuais para continuar.'),
      h('button',{type:'button',disabled:busy,'aria-label':'Recarregar saldo',style:{font:'800 20px inherit',minHeight:52,padding:'12px 24px',borderRadius:18,border:'2px solid #ffd257',background:'linear-gradient(#51d77f,#168d48)',color:'#fff'},onClick:async()=>{
        if(busy)return;setBusy(true);try{const r=await cloud.recharge();onLocalRecharge?.(r.player.balance);}catch(e){cloud.error(e);}finally{setBusy(false);}
      }},busy?'RECARREGANDO…':'RECARREGAR'))),document.body);
}
module.exports.RechargePanel=RechargePanel;
