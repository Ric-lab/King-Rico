'use strict';
// Versioned Circus economy v3. Multipliers are per TOTAL stake, not per payline.
// Calibrate the complete park (including wheel and Happeach), never this table alone.
const VERSION=3, TARGET_COIN_RTP=.80;
const PEACH_P=.005,FEATURE_MIN=20;
const PAY_SCALE=1.28;
const PAYS=[6.7,.4,.8,3.9,1.5,9,13.5,25,34,90].map((pay,i)=>i===1||i===2?pay:Number((pay*PAY_SCALE).toFixed(3)));
const {tier}=require('./prize-tier.cjs');

module.exports={VERSION,TARGET_COIN_RTP,PEACH_P,FEATURE_MIN,PAYS,tier};
