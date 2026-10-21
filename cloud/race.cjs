'use strict';
const PAY=4.8;
function race(bet,selected,seed,roundId,version=1){
 const betUnits=Math.round(bet*100),winner=seed%(version===2?5:4);
 return {roundId,betUnits,selected,seed,winner,ended:true,winUnits:selected===winner?Math.round(betUnits*(version===2?48:38)/10):0,...(version===2?{version:2}:{})};
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
module.exports={PAY,race,finishTime,progress};
