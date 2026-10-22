/* The reward is committed before this receipt opens. OK only animates that saved credit. */
const h=React.createElement;
function RewardReceipt({open,coin,target,onCollect,onProgress,onDone}) {
  const [flying,setFlying]=React.useState(false),panel=React.useRef(),origin=React.useRef(),started=React.useRef(false);
  const collect=()=>{
    if(started.current)return;
    started.current=true;origin.current=panel.current.querySelector('img').getBoundingClientRect();
    onCollect();setFlying(true);
  };
  React.useEffect(()=>{
    if(!open){started.current=false;setFlying(false);return;}
    started.current=false;setFlying(false);
    const previous=document.activeElement,overflow=document.body.style.overflow;
    const background=[...document.body.children].filter(el=>el!==panel.current&&!el.contains(panel.current)&&!el.matches('script,style'));
    const inert=background.map(el=>[el,el.inert]);inert.forEach(([el])=>{el.inert=true;});
    document.body.style.overflow='hidden';panel.current.querySelector('button')?.focus();
    const keydown=e=>{if(e.key==='Tab'){e.preventDefault();(panel.current.querySelector('button')||panel.current).focus();}};
    document.addEventListener('keydown',keydown);
    return ()=>{
      document.removeEventListener('keydown',keydown);document.body.style.overflow=overflow;
      inert.forEach(([el,value])=>{el.inert=value;});if(previous?.isConnected)previous.focus({preventScroll:true});
    };
  },[open]);
  React.useEffect(()=>{
    if(!open||!flying)return;
    const wallet=target(),rect=wallet?.getBoundingClientRect(),source=origin.current;
    if(!rect||!source){onProgress(1000);onDone();return;}
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count=reduced?1:12,animations=[],nodes=[];let alive=true,landed=0;
    const safety=setTimeout(()=>{if(alive){onProgress(1000);onDone();}},1600);
    const sx=source.x+source.width/2,sy=source.y+source.height/2,tx=rect.x+rect.width/2,ty=rect.y+rect.height/2;
    try {for(let i=0;i<count;i++){
      const el=document.createElement('img');el.src=coin;el.alt='';el.className='kr-reward-flying-coin';
      panel.current.appendChild(el);nodes.push(el);
      const transform=(x,y,s,r)=>`translate(${x-24}px,${y-24}px) rotate(${r}deg) scale(${s})`;
      const animation=el.animate(reduced?[
        {transform:transform(tx,ty,.6,0),opacity:0},{transform:transform(tx,ty,.6,0),opacity:1}
      ]:[
        {transform:transform(sx,sy,1,0),opacity:0},
        {transform:transform(sx+(i%4-1.5)*23,sy-45-(i%3)*12,1.08,(i%2?1:-1)*30),opacity:1,offset:.22},
        {transform:transform(tx,ty,.42,180+i*17),opacity:1}
      ],{duration:reduced?160:720,delay:reduced?0:i*34,easing:'cubic-bezier(.45,0,.7,1)',fill:'both'});
      animations.push(animation);
      animation.finished.then(()=>{
        if(!alive)return;
        el.remove();landed++;onProgress(Math.round(1000*landed/count));
        if(landed===count){
          wallet.animate([{filter:'brightness(1)'},{filter:'brightness(1.5)'},{filter:'brightness(1)'}],{duration:400});
          onDone();
        }
      }).catch(()=>{});
    }} catch {onProgress(1000);onDone();}
    return ()=>{alive=false;clearTimeout(safety);animations.forEach(a=>a.cancel());nodes.forEach(el=>el.remove());};
  },[open,flying,coin,target,onProgress,onDone]);
  if(!open)return null;
  return window.ReactDOM.createPortal(h('div',{ref:panel,className:'kr-reward-receipt'+(flying?' kr-reward-receipt--flying':''),
    role:'dialog','aria-modal':true,'aria-label':flying?'Moedas indo para o saldo':'Você ganhou 1.000 moedas',tabIndex:-1},
    !flying&&h('div',{className:'kr-home-gift kr-reward-receipt-panel'},
      h('h2',null,'Você ganhou!'),h('img',{className:'kr-reward-receipt-coin',src:coin,alt:''}),
      h('div',{className:'kr-reward-receipt-amount'},'1.000 ',h('span',null,'moedas')),
      h('button',{type:'button',className:'kr-button',onClick:collect},'OK'))),document.body);
}
module.exports={RewardReceipt};
