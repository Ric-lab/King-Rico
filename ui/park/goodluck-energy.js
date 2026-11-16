import {colorAt,record} from './motion.js';
// All five outcomes and the debit are already in one immutable paid receipt.
// Raio do Good Luck (Claude): a tempestade escurece a tela, o raio sai das nuvens com a cor do líquido que acabou de
// sair da barra, pisca como raio de verdade e explode no botão com clarão branco → cor. Só visual; o tempo do impacto não muda.
const NS='http://www.w3.org/2000/svg';
const jag=(x0,y0,x1,y1,seg,amp)=>{const p=[[x0,y0]];for(let i=1;i<seg;i++){const t=i/seg;p.push([x0+(x1-x0)*t+(Math.random()*2-1)*amp*(1-Math.abs(.5-t)),y0+(y1-y0)*t]);}p.push([x1,y1]);return p;};
const pd=p=>'M'+p.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join('L');
function strike(box,color,flight,reduced,nodes,animations){
 const W=innerWidth,H=innerHeight,cx=box.x+box.width/2,cy=box.y+box.height/2,T=flight+520;
 const add=el=>{document.body.append(el);nodes.push(el);return el;},A=(el,k,o)=>{try{const a=el.animate(k,o);animations.push(a);return a;}catch{}};
 const storm=add(document.createElement('div'));storm.className='park-gl-storm';storm.style.setProperty('--gl-x',cx+'px');storm.style.setProperty('--gl-c',color);
 if(!reduced)for(let i=0;i<8;i++){const c=document.createElement('i'),s=150+Math.random()*170;c.className='park-gl-cloud';c.style.cssText=`left:${i/7*W-s/2+(Math.random()-.5)*40}px;top:${-s*.5+Math.random()*40}px;width:${s}px;height:${s*.6}px`;storm.append(c);
  A(c,[{transform:'translateY(-70%) scale(.8)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1}],{duration:340,delay:i*22,easing:'cubic-bezier(.2,.8,.3,1)',fill:'both'});}
 A(storm,[{opacity:0},{opacity:1,offset:reduced?.05:.45},{opacity:1,offset:(flight+120)/T},{opacity:0}],{duration:T,easing:'ease-out',fill:'both'});
 const svg=add(document.createElementNS(NS,'svg'));svg.setAttribute('class','park-gl-bolt');svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
 svg.innerHTML='<defs><filter id="parkGlBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter></defs>';
 const main=jag(cx+(Math.random()-.5)*70,-12,cx,cy-box.height*.12,12,44),all=[pd(main)];
 for(let b=0;b<3;b++){const k=2+Math.floor(Math.random()*6),p=main[k],s=Math.random()<.5?-1:1;all.push(pd(jag(p[0],p[1],p[0]+s*(40+Math.random()*60),p[1]+45+Math.random()*70,4,16)));}
 for(const [w,c,op,blur] of [[24,color,.85,1],[9,color,1,0],[3.5,'#fff',1,0]]){const gr=document.createElementNS(NS,'g');gr.setAttribute('fill','none');gr.setAttribute('stroke',c);gr.setAttribute('stroke-linecap','round');gr.setAttribute('stroke-linejoin','round');gr.setAttribute('opacity',op);if(blur)gr.setAttribute('filter','url(#parkGlBlur)');
  all.forEach((d,i)=>{const p=document.createElementNS(NS,'path');p.setAttribute('d',d);p.setAttribute('stroke-width',i?w*.45:w);gr.append(p);});svg.append(gr);}
 const at=ms=>Math.max(0,Math.min(1,ms/T)),s0=reduced?0:flight-210;
 A(svg,reduced?[{opacity:1},{opacity:1,offset:.7},{opacity:0}]:[{opacity:0},{opacity:0,offset:at(s0-150)},{opacity:.45,offset:at(s0-120)},{opacity:0,offset:at(s0-90)},{opacity:1,offset:at(s0)},{opacity:.3,offset:at(s0+60)},{opacity:1,offset:at(s0+110)},{opacity:1,offset:at(flight+70)},{opacity:0}],{duration:T,fill:'both'});
 const flash=add(document.createElement('div')),tint=add(document.createElement('div'));flash.className=tint.className='park-gl-flash';flash.style.background='#fff';tint.style.background=`radial-gradient(circle at ${cx}px ${cy}px,${color} 0,${color}cc 30%,${color}00 85%)`;
 A(flash,[{opacity:0},{opacity:reduced?.35:.85,offset:.08},{opacity:0}],{duration:reduced?160:240,delay:flight-10,fill:'both'});
 A(tint,[{opacity:0},{opacity:.55,offset:.15},{opacity:0}],{duration:reduced?300:620,delay:flight,easing:'ease-out',fill:'both'});
 const ring=add(document.createElement('i'));ring.className='park-gl-ring';ring.style.cssText=`left:${cx}px;top:${cy}px;--gl-c:${color}`;
 A(ring,[{transform:'scale(.2)',opacity:1},{transform:'scale(3.4)',opacity:0}],{duration:520,delay:flight,easing:'cubic-bezier(.1,.7,.3,1)',fill:'both'});
 if(!reduced){for(let i=0;i<14;i++){const sp=add(document.createElement('i')),a=Math.random()*Math.PI*2,r=70+Math.random()*110;sp.className='park-gl-spark';sp.style.cssText=`left:${cx}px;top:${cy}px;--gl-c:${color}`;
   A(sp,[{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(a)*r}px,${Math.sin(a)*r*.7}px) scale(.2)`,opacity:0}],{duration:420+Math.random()*220,delay:flight,easing:'cubic-bezier(.15,.8,.3,1)',fill:'both'});}
  setTimeout(()=>{storm.classList.add('is-lit');setTimeout(()=>storm.classList.remove('is-lit'),110);},flight);
  const stage=document.querySelector('.park-circus-stage');if(stage)A(stage,[{translate:'0 0'},{translate:'-3px 2px'},{translate:'3px -2px'},{translate:'-2px 1px'},{translate:'0 0'}],{duration:260,delay:flight});}
}
export function installGoodLuckEnergy(fc,rails,{refresh}){
 let animations=[],nodes=[];
 const clean=()=>{animations.forEach(a=>{try{a.cancel();}catch{}});animations=[];nodes.forEach(n=>n.remove());nodes=[];};
 fc._parkBeginGoodLuck=(receipt,bet)=>{
  fc.danceClear();fc.reelsHalt();fc.stopWhirr();
  fc._goodLuckOpeningWin=receipt.outcome.res.win;fc._goodLuckWasAuto=fc.state.auto;fc._parkFeatureFill=10;
  fc._goodLuckEnergyLog=[];
  fc.setState({spinning:false,queued:false,spinCells:[],stopped:[],grid:receipt.outcome.grid.slice(),balance:receipt.balanceDebited??receipt.balanceBefore-bet,balPending:0,peaches:receipt.outcome.peaches,peachShownBase:null,peachShownAdd:0,winCells:[],winLines:[],winDim:false});
  record(fc,'goodluck:entry',{openingWin:fc._goodLuckOpeningWin});refresh();
  fc.startPeachFeature(bet);
 };
 fc.peachPress=go=>{
  clean();const left=fc.state.featLeft??5,from=left*2,to=Math.max(0,(left-1)*2),color=colorAt(from/10);
  fc.setState({featLeft:Math.max(0,left-1),featReady:false,pressed:null});fc._parkFeatureFill=to;
  const index=6-left;fc._goodLuckEnergyLog.push({index,from,to,color,at:performance.now()});record(fc,'goodluck:charge',{index,from,to,color});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?280:650;
  for(const tube of rails.querySelectorAll('.park-meter')){
   tube.style.setProperty('--park-pour-color',colorAt(to/10));
   const fill=tube.querySelector('.park-meter-fill'),h=tube.querySelector('.park-meter-track').clientHeight;
   try{const a=fill.animate([{height:h*from/10+'px'},{height:h*to/10+'px'}],{duration,easing:'ease-in-out',fill:'both'});animations.push(a);a.finished.then(()=>a.cancel()).catch(()=>{});}catch{}
  }
  refresh();
  const button=document.querySelector('[data-spin-btn]'),box=button?.getBoundingClientRect();
  const flight=reduced?300:640;let landed=false;
  const hit=()=>{if(landed)return;landed=true;
   record(fc,'goodluck:impact',{index});
   fc.setState({pressed:'spin'});fc._spinTouchDown?.();
   try{fc.click(true);fc.hap('impact');}catch{}
   fc.later(()=>{fc.click(false);fc._spinTouchUp?.();fc.setState({pressed:null});go();},220);
  };
  if(box)try{strike(box,color,flight,reduced,nodes,animations);}catch{}
  fc.later(hit,flight);

 };
 const end=fc.endFeature.bind(fc);fc.endFeature=(...args)=>{clean();fc._parkFeatureFill=0;fc._parkAfterGoodLuck=true;fc._parkMeterLevel=0;fc._parkShown=0;fc.setState({auto:!!fc._goodLuckWasAuto});const result=end(...args);refresh();return result;};
 window.addEventListener('pagehide',clean,{once:true});
}
