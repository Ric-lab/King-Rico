'use strict';
// Presentation tiers use the committed round stake; no wallet or payout rules.
function tier(amount,bet){
 const ratio=Number.isFinite(amount)&&Number.isFinite(bet)&&bet>0?amount/bet:0;
 return ratio>=50?{id:'super',label:'SUPER PRÊMIO',ratio}:ratio>=35?{id:'mega',label:'MEGA PRÊMIO',ratio}:ratio>=20?{id:'big',label:'GRANDE PRÊMIO',ratio}:{id:'regular',label:'',ratio};
}
module.exports={tier};
