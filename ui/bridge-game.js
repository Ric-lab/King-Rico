const h=React.createElement;
const {MenuButton,MenuPanel}=require('./menu.js');
const {WalletValue}=require('./wallet-value.js');
const {RoundControls}=require('./round-controls.js');
const BETS=[1,2.5,5,10,25,50,100,250,500,1000],MULT=[1.9,3.8,7.5,15,30,60];
const fmt=n=>n.toLocaleString('pt-BR',{maximumFractionDigits:2});
const duration=ms=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?Math.min(ms,80):ms;
class BridgeGame extends React.Component{
  state={balance:0,betIdx:3,round:null,viewStep:0,side:-1,busy:false,menu:false,result:null,vw:453,vh:802,sfxLvl:2,vibLvl:2,ready:false};
  stage=React.createRef();actor=React.createRef();
  componentDidMount(){
    window.__bridge=this;this.resize=()=>this.setState({vw:innerWidth,vh:window.KingRicoViewport?.height??innerHeight});this.resize();window.addEventListener('resize',this.resize);
    const c=window.KingRicoCloud;this.unwatch=c?.watch(p=>{this.deferred=p;if(!this.locked&&!this.state.busy&&!this.state.result)this.sync();});
    c?.ready.then(()=>{this.deferred=c.player;if(!this.locked)this.sync();});
  }
  componentWillUnmount(){this.dead=true;this.unwatch?.();window.removeEventListener('resize',this.resize);if(window.__bridge===this)delete window.__bridge;this.audio?.close();}
  sync(){const p=this.deferred;if(!p)return;this.deferred=null;const r=p.bridgeRound;
    this.setState({ready:true,balance:p.balance,round:r,viewStep:r?.step||0,side:r?.choices.at(-1)??-1,betIdx:r?BETS.indexOf(r.betUnits/100):p.settings.bridgeBetIdx??3,sfxLvl:p.settings.sfxLvl,vibLvl:p.settings.vibLvl});}
  componentDidUpdate(){if(this.deferred&&!this.locked&&!this.state.busy&&!this.state.result)this.sync();}
  sound(ok){if(!this.state.sfxLvl)return;try{const a=this.audio||=new (window.AudioContext||window.webkitAudioContext)();a.resume();[ok?523:180,ok?659:100,ok?784:65].forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+i*.065;o.type=ok?'sine':'triangle';o.frequency.value=f;g.gain.setValueAtTime(.055*(this.state.sfxLvl/2),t);g.gain.exponentialRampToValueAtTime(.0001,t+.24);o.connect(g).connect(a.destination);o.start(t);o.stop(t+.25);});}catch{}}
  async animate(el,frames,ms){if(!el?.animate)return;try{const a=el.animate(frames,{duration:duration(ms),easing:'ease-in-out',fill:'forwards'});await Promise.race([a.finished,new Promise(resolve=>setTimeout(resolve,duration(ms)+100))]);a.cancel();}catch{}}
  bet=delta=>{if(this.locked||this.state.round||this.state.result)return;this.setState(s=>({betIdx:Math.max(0,Math.min(9,s.betIdx+delta))}));};
  jump=side=>this.move('jump',side);
  start=()=>this.move('start');collect=()=>this.move('collect');
  async move(move,selected=-1){
    const c=window.KingRicoCloud,s=this.state;if(this.locked||s.busy||s.menu||s.result||!c?.player||!s.ready)return;
    const r=s.round;if(move==='start'?!!r:!r||move==='collect'&&r.step<1)return;
    const bet=r?r.betUnits/100:BETS[s.betIdx],id=r?.id||crypto.randomUUID();this.locked=true;this.setState({busy:true});
    // Press feedback is immediate; the glass outcome only appears after persistence.
    let press;try{if(move==='jump')press=this.actor.current?.animate?.([{scale:'1 1'},{scale:'1.1 .9'}],{duration:100,fill:'forwards'});}catch{}
    try{
      const reply=await c.bridge(move,bet,id,r?.step||0,selected),x=reply.outcome,confirmedAt=performance.now();
      press?.cancel();if(this.dead)return;
      if(c.player.revision>reply.player.revision){this.deferred=c.player;return;}
      if(move==='jump')await this.presentJump(selected,x,s.side);
      else if(move==='start')await this.animate(this.actor.current,[{scale:'1 1'},{scale:'1.04 .96'},{scale:'1 1'}],320);
      if(this.dead)return;
      const next=reply.player.bridgeRound;
      this.setState({balance:reply.player.balance,round:next,viewStep:next?.step??x.step,side:move==='jump'?selected:s.side,
        result:x.ended?{win:x.winUnits/100,ok:x.ok,complete:x.step===6}:null});
      // Keep inputs inside the transaction cooldown even with reduced/missing animation.
      await new Promise(resolve=>setTimeout(resolve,Math.max(0,330-(performance.now()-confirmedAt))));
      this.sound(x.ok);if(this.state.vibLvl)try{navigator.vibrate?.(x.ok?22:[35,25,35]);}catch{}
    }catch(error){press?.cancel();c.error(error);this.deferred=c.player;}
    finally{this.locked=false;if(!this.dead){this.setState({busy:false});if(this.deferred&&!this.state.result)this.sync();}}
  }
  async presentJump(side,x,oldSide){
    const actor=this.actor.current,fromX=oldSide<0?226:oldSide?330:123,toX=side?306:147,dx=toX-fromX;
    await this.animate(actor,[{transform:'translate(0,0)'},{transform:`translate(${dx*.5}px,-160px) rotate(${side?5:-5}deg)`,offset:.5},{transform:`translate(${dx}px,-102px)`}],620);
    if(!actor||this.dead)return;actor.style.transform=`translate(${dx}px,-102px)`;
    const tile=this.stage.current.querySelector(`[data-row="${this.state.viewStep}"][data-side="${side}"]`);
    this.sound(x.ok);
    if(x.ok){await this.animate(tile,[{translate:'0 0',filter:'brightness(1)'},{translate:'0 9px',filter:'brightness(1.8)',offset:.25},{translate:'0 0',filter:'brightness(1)'}],280);}
    else{
      if(tile)tile.style.opacity='.1';this.shatter(side);
      await this.animate(actor,[{transform:`translate(${dx}px,-102px)`},{transform:`translate(${dx+12}px,58px) rotate(${side?24:-24}deg) scale(.8)`}],430);
      actor.style.opacity='0';
    }
    actor.style.transform='';actor.style.opacity='';if(tile)tile.style.opacity='';
  }
  shatter(side){const stage=this.stage.current;if(!stage)return;for(let i=0;i<8;i++){
    const node=document.createElement('i');node.className='br-shard';node.style.cssText=`left:${(side?238:78)+(i%4)*26}px;top:${467+Math.floor(i/4)*21}px;width:36px;height:31px`;stage.append(node);
    try{const a=node.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${(i-3.5)*14}px,170px) rotate(${i*43}deg)`,opacity:0}],{duration:duration(620),fill:'forwards'});a.finished.catch(()=>{}).finally(()=>node.remove());}catch{node.remove();}
    setTimeout(()=>node.remove(),1200);
  }}
  closeResult=()=>{this.setState({result:null,viewStep:0,side:-1});this.deferred=window.KingRicoCloud?.player;this.sync();};
  setLevel=(key,value)=>{this.setState({[key]:value});window.KingRicoCloud.settings({[key]:value}).catch(window.KingRicoCloud.error);};
  render(){
    const s=this.state,r=s.round,step=s.viewStep,bet=r?r.betUnits/100:BETS[s.betIdx],active=!!r,busy=s.busy||s.menu||!!s.result,prize=step?Math.round(bet*100*MULT[step-1])/100:0;
    const rows=[];for(let n=0;n<6;n++){
      const distance=n-step,depth=Math.max(0,distance),factor=Math.pow(.76,depth),w=151*factor,height=80*factor,y=distance<0?578+(distance+1)*110:214+250*Math.pow(.67,depth);
      for(let side=0;side<2;side++){
        const current=distance===0,chosen=r?.choices[n]===side,done=n<step,enabled=current&&active&&!busy;
        rows.push(h('div',{key:`${n}-${side}`,className:'br-row',style:{top:y,opacity:distance< -1?0:done&&!chosen ? .22 : Math.max(.25,1-depth*.14),zIndex:7-Math.max(0,distance)}},
          h('button',{type:'button','data-row':n,'data-side':side,className:'br-tile'+(enabled?' active':'')+(done&&chosen?' br-safe':''),disabled:!enabled,
            tabIndex:current?0:-1,'aria-label':`Saltar para o vidro da ${side?'direita':'esquerda'}`,onClick:()=>this.jump(side),
            style:{width:w,height,left:226+(side?1:-1)*(w/2+9*factor)-w/2}},current&&h('span',null,side?'DIREITA':'ESQUERDA'))));
      }
    }
    const side=s.side,actorX=side<0?226:side?330:123;
    return h('div',{className:'br-viewport'},h('main',{className:'br-stage',ref:this.stage,style:{transform:`scale(${Math.min(s.vw/453,s.vh/802)})`},'aria-label':'Fortune Bridge','data-screen-label':'Fortune Bridge'},
      h('div',{className:'br-backdrop'}),h('div',{className:'br-spot'}),
      h('div',{className:'kr-hud-balance',style:{position:'absolute',zIndex:20},role:'status','aria-label':`Seu saldo: ${fmt(s.balance)} moedas`},h('strong',null,h(WalletValue,{value:s.balance,hold:s.busy,external:false}))),
      h('a',{className:'kr-hud-home',href:'Home.dc.html',style:{zIndex:20},'aria-label':'Voltar para o início',onClick:e=>{if(s.busy)e.preventDefault();}}),
      h(MenuButton,{onClick:()=>this.setState({menu:true}),disabled:s.busy,style:{zIndex:25}}),
      h('div',{className:'br-title'},h('small',null,'FORTUNE'),h('h1',null,'PONTE DE VIDRO'),h('span',{className:'br-preview'},'EM TESTE · NICK NECK')),
      h('div',{className:'br-prizes','aria-label':'Prêmios por etapa'},MULT.map((m,i)=>h('div',{key:i,className:'br-prize'+(step===i+1?' current':step===i?' next':'')},h('small',null,`${i+1}º SALTO`),fmt(Math.round(bet*100*m)/100)))),
      h('div',{className:'br-runway','aria-hidden':true},h('div',{className:'br-rail left'}),h('div',{className:'br-rail right'})),
      h('div',{className:'br-net','aria-hidden':true}),h('div',{className:'br-deck',style:{opacity:step?0:1},'aria-hidden':true}),...rows,
      h('div',{className:'br-shadow',style:{left:actorX-34,top:592},'aria-hidden':true}),
      h('img',{ref:this.actor,className:'br-giraffe',src:'assets/girafa/girafa.webp',alt:'Nick Neck',draggable:false,style:{left:actorX-42,top:420}}),
      h('p',{className:'br-status',role:'status'},s.busy?'Preparando o salto…':active?'Qual vidro vai aguentar?':'Um salto. Dois caminhos.',
        h('small',null,s.busy?'':active?`Toque no vidro · salto ${Math.min(6,step+1)} de 6`:'Escolha um vidro. Avance ou pegue seu prêmio.')),
      active?h('div',{className:'br-playing-controls'},h('div',null,'PRÓXIMO SALTO',h('strong',null,fmt(Math.round(bet*100*MULT[Math.min(step,5)])/100))),
        h('button',{className:'kr-button kr-button--gold',disabled:busy||!step,onClick:this.collect,'aria-label':`Pegar ${fmt(prize)} moedas`},'PEGAR',h('small',null,fmt(prize)+' moedas'))):
        h(RoundControls,{active:false,busy,betText:fmt(bet),onBetDown:()=>this.bet(-1),onBetUp:()=>this.bet(1),onStart:this.start,betDownDisabled:s.betIdx===0,betUpDisabled:s.betIdx===9,startDisabled:!s.ready||s.balance<bet}),
      !active&&s.ready&&s.balance<1&&h('a',{href:'/home',style:{position:'absolute',top:679,left:0,right:0,textAlign:'center',color:'#ffe1a1',zIndex:15}},'Recarregar moedas na Home'),
      h(MenuPanel,{open:s.menu,onClose:()=>this.setState({menu:false}),screen:'Fortune Bridge',details:'Aposte uma vez e escolha um dos dois vidros. Só um aguenta: a chance de acertar é de 1 em 2 por salto. São seis etapas. Após cada acerto, você pode pegar o prêmio ou continuar. Se o vidro quebrar, perde a aposta e o prêmio acumulado; Nick cai numa rede. Os prêmios incluem a aposta. O caminho é sorteado antes do primeiro salto e continua igual ao atualizar a página. Moedas virtuais, sem dinheiro real.',sfxLvl:s.sfxLvl,vibLvl:s.vibLvl,onSfx:v=>this.setLevel('sfxLvl',v),onVib:v=>this.setLevel('vibLvl',v)}),
      s.result&&h('div',{className:'br-dialog-overlay'},h('section',{className:'br-dialog',role:'dialog','aria-modal':true,'aria-labelledby':'br-result-title'},
        h('img',{src:s.result.win?'assets/symbols/sym-coin.webp':'assets/girafa/head.webp',alt:''}),
        h('h2',{id:'br-result-title'},s.result.complete?'ATRAVESSOU!':s.result.win?'PRÊMIO NA MÃO!':'OPS! NA REDE!'),
        s.result.win?h('p',null,h('strong',null,'+'+fmt(s.result.win)), 'moedas'):h('p',null,'Esse vidro não aguentou.',h('br'),'Nick está seguro na rede.'),
        h('button',{className:'kr-button',onClick:this.closeResult},'JOGAR DE NOVO'),h('a',{href:'/neck'},'Voltar ao Neck atual')))
    ));
  }
}
module.exports={BridgeGame};
