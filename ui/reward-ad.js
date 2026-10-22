/* A visible 30-second prototype interruption, without an ad network or ad-view metric. */
const h=React.createElement, DURATION=30000, CIRCUMFERENCE=2*Math.PI*82;
function RewardAd({open,complete,busy,error,onComplete,onCancel,coin}) {
  const [elapsed,setElapsed]=React.useState(0),panel=React.useRef(),latest=React.useRef();
  latest.current={busy,onCancel};
  React.useEffect(()=>{
    if(!open)return;
    setElapsed(0);
    let spent=0,last=performance.now(),frame,finished=false;
    const visibility=()=>{last=performance.now();};
    const tick=now=>{
      if(!document.hidden)spent+=Math.max(0,now-last);
      last=now;setElapsed(Math.min(DURATION,spent));
      if(spent>=DURATION){if(!finished){finished=true;onComplete();}return;}
      frame=requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange',visibility);
    frame=requestAnimationFrame(tick);
    return ()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);};
  },[open,onComplete]);
  React.useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement,overflow=document.body.style.overflow;
    const background=[...document.body.children].filter(el=>el!==panel.current&&!el.contains(panel.current)&&!el.matches('script,style'));
    const inert=background.map(el=>[el,el.inert]);inert.forEach(([el])=>{el.inert=true;});
    document.body.style.overflow='hidden';panel.current?.querySelector('button')?.focus();
    const keydown=event=>{
      if(event.key==='Escape'&&!latest.current.busy){event.preventDefault();latest.current.onCancel();}
      if(event.key==='Tab'){
        const buttons=[...panel.current.querySelectorAll('button:not(:disabled)')];
        if(!buttons.length){event.preventDefault();panel.current.focus();return;}
        const first=buttons[0],last=buttons[buttons.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',keydown);
    return ()=>{
      document.removeEventListener('keydown',keydown);document.body.style.overflow=overflow;
      inert.forEach(([el,value])=>{el.inert=value;});
      if(previous?.isConnected)previous.focus();
    };
  },[open]);
  if(!open)return null;
  const seconds=Math.max(0,Math.ceil((DURATION-elapsed)/1000));
  return window.ReactDOM.createPortal(h('section',{ref:panel,className:'kr-reward-ad',role:'dialog',tabIndex:-1,
    'aria-modal':true,'aria-label':'Simulação de anúncio de 30 segundos'},
    h('div',{className:'kr-reward-ad-top'},h('span',null,'SIMULAÇÃO DE ANÚNCIO'),
      h('button',{type:'button',className:'kr-reward-ad-close',disabled:!!busy,onClick:onCancel,
        'aria-label':'Fechar anúncio sem ganhar moedas'},'✕')),
    h('div',{className:'kr-reward-ad-content'},
      h('div',{className:'kr-reward-ad-clock',role:'timer','aria-label':`${seconds} segundos restantes`},
        h('svg',{viewBox:'0 0 180 180','aria-hidden':true},
          h('circle',{cx:90,cy:90,r:82,className:'kr-reward-ad-track'}),
          h('circle',{cx:90,cy:90,r:82,className:'kr-reward-ad-progress',strokeDasharray:CIRCUMFERENCE,
            strokeDashoffset:CIRCUMFERENCE*elapsed/DURATION})),
        h('div',null,h('strong',null,String(seconds).padStart(2,'0')),h('span',null,'SEGUNDOS'))),
      h('h2',null,error?'Falta confirmar suas moedas':complete?'Confirmando suas moedas…':'Aguarde para ganhar'),
      h('div',{className:'kr-reward-ad-prize'},h('img',{src:coin,alt:''}),h('strong',null,'+1.000 MOEDAS')),
      h('p',{'aria-live':'polite'},error?'Confira a conexão e tente confirmar novamente.':complete?'Só mais um instante.':'Ao terminar, você volta ao jogo com as moedas.'),
      error&&h('button',{type:'button',className:'kr-button',onClick:onComplete,disabled:!!busy},'TENTAR CONFIRMAR')),
    h('p',{className:'kr-reward-ad-footer'},'Tela de teste • nenhum anúncio real é exibido')),document.body);
}
module.exports={RewardAd};
