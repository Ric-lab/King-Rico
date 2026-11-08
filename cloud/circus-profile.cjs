'use strict';
// Preview economy v3. Multipliers are per TOTAL stake, not per payline.
// Calibrate the complete park (including wheel and Happeach), never this table alone.
const VERSION=3, TARGET_COIN_RTP=.95;
const PEACH_P=.005,FEATURE_MIN=20;
const PAYS=[4,.6,1,2.5,1.6,5,8,15,20,50];
function tier(amount,bet){
 const ratio=Number.isFinite(amount)&&Number.isFinite(bet)&&bet>0?amount/bet:0;
 return ratio>=50?{id:'super',label:'SUPER PRÊMIO',ratio}:ratio>=35?{id:'mega',label:'MEGA PRÊMIO',ratio}:ratio>=20?{id:'big',label:'GRANDE PRÊMIO',ratio}:{id:'regular',label:'',ratio};
}
module.exports={VERSION,TARGET_COIN_RTP,PEACH_P,FEATURE_MIN,PAYS,tier};
