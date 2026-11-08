'use strict';
// Versioned Circus economy v3. Multipliers are per TOTAL stake, not per payline.
// Calibrate the complete park (including wheel and Happeach), never this table alone.
const VERSION=3, TARGET_COIN_RTP=.95;
const PEACH_P=.005,FEATURE_MIN=20;
const PAYS=[4,.6,1,2.5,1.6,5,8,15,20,50];
const {tier}=require('./prize-tier.cjs');

module.exports={VERSION,TARGET_COIN_RTP,PEACH_P,FEATURE_MIN,PAYS,tier};
