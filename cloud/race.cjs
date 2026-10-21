'use strict';
const PAY=4.8,PAY_EXACTA=19.2,PHYSICS_WINNERS=require('./race-physics-winners.json');
// version 4: 640 seeds; seed%20 is the ordered (1st,2nd) pair, the rest only varies the staging.
const V4_LAYOUTS=32,V4_SEEDS=V4_LAYOUTS*20;
function physicalWinner(seed){return (PHYSICS_WINNERS[Math.floor(seed/5)]+seed%5)%5;}
function circusPair(seed){const winner=Math.floor(seed%20/4);return [winner,(winner+1+seed%4)%5];}
function race(bet,selected,seed,roundId,version=1,selected2=-1){
 const betUnits=Math.round(bet*100);
 if(version===4){const [winner,second]=circusPair(seed),exact=selected2>=0;
  return {roundId,betUnits,selected,selected2,seed,winner,second,ended:true,version,
   winUnits:exact?(selected===winner&&selected2===second?Math.round(betUnits*192/10):0):(selected===winner?Math.round(betUnits*48/10):0)};}
 const winner=version===3?physicalWinner(seed):seed%(version===2?5:4);
 return {roundId,betUnits,selected,seed,winner,ended:true,winUnits:selected===winner?Math.round(betUnits*(version>=2?48:38)/10):0,...(version>=2?{version}:{})};
}
// All presentation positions are functions of the saved seed and active elapsed
// time. The finish order is continuous: no teleport, late winner swap or new draw.
function finishTime(seed,index,version=1){
 if(version===2){const winner=seed%5,direction=seed&4?1:-1,rank=((index-winner)*direction+10)%5;return 17.4+((seed>>>3)%100)*.008+(rank?rank*.38+((seed>>>5)+index*17)%13*.008:0);}
 const winner=seed%4,direction=seed&4?1:-1,rank=((index-winner)*direction+8)%4;
 return 17.4+((seed>>>3)%100)*.008+(rank?rank*.62+((seed>>>5)+index*17)%13*.008:0);
}
function progress(seed,index,time,version=1){
 if(version===2){const u=Math.max(0,Math.min(1,time/finishTime(seed,index,2))),phase=(seed%31)*.23+index*1.67;return Math.max(0,Math.min(1,u-.018*Math.sin(4*Math.PI*u)+.037*Math.sin(5*Math.PI*u+phase)*Math.sin(Math.PI*u)));}
 const u=Math.max(0,Math.min(1,time/finishTime(seed,index))),phase=(seed%31)*.23+index*1.67;
 return Math.max(0,Math.min(1,u+.026*Math.sin(u*Math.PI*3.6+phase)*Math.sin(Math.PI*u)));
}
module.exports={PAY,PAY_EXACTA,V4_LAYOUTS,V4_SEEDS,race,finishTime,progress,physicalWinner,circusPair};
