import {colorAt,record} from './motion.js';
// All five outcomes and the debit are already in one immutable paid receipt.
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
  const flight=reduced?300:560;let landed=false;
  const hit=()=>{if(landed)return;landed=true;
   record(fc,'goodluck:impact',{index});
   if(bolt){bolt.dataset.phase='impact';try{animations.push(bolt.animate([{opacity:1,scale:1},{opacity:0,scale:.6}],{duration:200,fill:'forwards'}));}catch{}}
   if(box){const ring=document.createElement('i');ring.className='park-goodluck-contact';ring.style.cssText=`left:${box.x+box.width/2}px;top:${box.y+box.height/2}px`;document.body.append(ring);nodes.push(ring);}
   fc.setState({pressed:'spin'});fc._spinTouchDown?.();
   try{fc.click(true);fc.hap('impact');}catch{}
   fc.later(()=>{fc.click(false);fc._spinTouchUp?.();fc.setState({pressed:null});go();},220);
  };
  let bolt;
  if(box)try{
   bolt=document.createElement('img');bolt.className='park-goodluck-falling-bolt';bolt.alt='';bolt.src='/assets/machine/goodluck-bolt-v1.svg';document.body.append(bolt);nodes.push(bolt);
   // The asset tip (55,389 in its viewBox) contacts the middle of the real button.
   const tx=box.x+box.width/2-55*.5,ty=box.y+box.height/2-389*.5;
   animations.push(bolt.animate([{transform:`translate(${tx}px,-220px)`,opacity:0},{opacity:1,offset:.12},{transform:`translate(${tx}px,${ty}px)`,opacity:1}],{duration:flight,easing:'cubic-bezier(.35,.05,.65,1)',fill:'both'}));
  }catch{}
  fc.later(hit,flight);

 };
 const end=fc.endFeature.bind(fc);fc.endFeature=(...args)=>{clean();fc._parkFeatureFill=0;fc._parkAfterGoodLuck=true;fc._parkMeterLevel=0;fc._parkShown=0;fc.setState({auto:!!fc._goodLuckWasAuto});const result=end(...args);refresh();return result;};
 window.addEventListener('pagehide',clean,{once:true});
}
