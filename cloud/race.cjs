'use strict';
const PAY=3.8;
function race(bet,selected,seed,roundId){
 const betUnits=Math.round(bet*100),winner=seed%4;
 return {roundId,betUnits,selected,seed,winner,ended:true,winUnits:selected===winner?Math.round(betUnits*38/10):0};
}
// All presentation positions are functions of the saved seed and active elapsed
// time. The finish order is continuous: no teleport, late winner swap or new draw.
function finishTime(seed,index){
 const winner=seed%4,direction=seed&4?1:-1,rank=((index-winner)*direction+8)%4;
 return 17.4+((seed>>>3)%100)*.008+(rank?rank*.62+((seed>>>5)+index*17)%13*.008:0);
}
function progress(seed,index,time){
 const u=Math.max(0,Math.min(1,time/finishTime(seed,index))),phase=(seed%31)*.23+index*1.67;
 return Math.max(0,Math.min(1,u+.026*Math.sin(u*Math.PI*3.6+phase)*Math.sin(Math.PI*u)));
}
module.exports={PAY,race,finishTime,progress};
