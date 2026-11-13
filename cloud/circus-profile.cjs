'use strict';
// Versioned Circus economy v3. Multipliers are per TOTAL stake, not per payline.
// Calibrate the complete park (including wheel and Happeach), never this table alone.
const VERSION=3, TARGET_COIN_RTP=.80;
const PEACH_P=.005,FEATURE_MIN=20;
const PAY_SCALE=1.28;
const PAYS=[6.7,.4,.8,3.9,1.5,9,13.5,25,34,90].map((pay,i)=>i===1||i===2?pay:Number((pay*PAY_SCALE).toFixed(3)));
// New v5 table. Keep the live v3/v4 table above for saved receipts and older clients.
// Atlas indices stay stable: scepter (5) is inactive; its artwork is preserved.
const PAYS_V5=Object.freeze([2.5,.4,.8,1.2,5,0,10,15,20,25]);
const {tier}=require('./prize-tier.cjs');

// V6 keeps atlas IDs; tickets now pay coins, cedar is protection, controller reserved.
const PAYS_V6=Object.freeze([1.2,0,.8,0,0,0,2.5,10,5,0,.4,0,0,0,0,0]);
const WEIGHTS_V6=Object.freeze([9,0,12,0,0,0,7,5,6,0,70,0,0,0,0,4]); // 15 = controle (3 em linha abre um jogo)
const CEDAR_P=.12;
module.exports={PAYS_V6,WEIGHTS_V6,CEDAR_P,VERSION,TARGET_COIN_RTP,PEACH_P,FEATURE_MIN,PAYS,PAYS_V5,tier};
