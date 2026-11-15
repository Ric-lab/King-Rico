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
  const button=document.querySelector('[data-spin-btn]'),r=button?.getBoundingClientRect();
  if(r){
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('park-goodluck-bolt');svg.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);svg.style.setProperty('--bolt-color',color);
   const tx=r.x+r.width/2,ty=r.y+r.height/2;
   for(const tube of rails.querySelectorAll('.park-meter-track')){
    const b=tube.getBoundingClientRect(),sx=b.x+b.width/2,sy=b.y+b.height*(1-from/10),dx=tx-sx,dy=ty-sy;
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M${sx} ${sy} L${sx+dx*.38} ${sy+dy*.22} L${sx+dx*.22} ${sy+dy*.43} L${sx+dx*.73} ${sy+dy*.65} L${tx} ${ty}`);svg.append(path);
   }
   document.body.append(svg);nodes.push(svg);
   for(const path of svg.children)try{const length=path.getTotalLength();path.style.strokeDasharray=length;animations.push(path.animate([{strokeDashoffset:length,opacity:0},{strokeDashoffset:0,opacity:1,offset:.4},{strokeDashoffset:-length,opacity:0}],{duration:reduced?280:650,easing:'ease-out',fill:'both'}));}catch{}
  }
  fc.later(()=>{
   try{fc.buzz?.([75]);fc.burst(850,1,.045,.18);fc.bell(784,.25,.045);fc._parkFlashRim?.();}catch{}
   if(button)try{animations.push(button.animate([{filter:'brightness(1)'},{filter:'brightness(1.65) drop-shadow(0 0 12px '+color+')',offset:.25},{filter:'brightness(1)'}],{duration:350,easing:'ease-out'}));}catch{}
   go();
  },reduced?160:350);
 };
 const end=fc.endFeature.bind(fc);fc.endFeature=(...args)=>{clean();fc._parkFeatureFill=null;fc._parkShown=0;fc.setState({auto:!!fc._goodLuckWasAuto});const result=end(...args);refresh();return result;};
 window.addEventListener('pagehide',clean,{once:true});
}
