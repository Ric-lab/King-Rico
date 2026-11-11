'use strict';
// Finite rejection sampler for inclusive integer bounds. Four standard deviations
// fit between the midpoint and either edge; rounding keeps discrete tails rare.
// Effective resource limits must be applied to bounds before calling this helper.
function boundedNormalInt(min,max,rng){
 if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||min>max)throw Error('Invalid normal bounds');
 if(min===max)return min;
 const mean=(min+max)/2,sigma=(max-min)/8;
 for(let attempt=0;attempt<64;attempt++){
  const u=Math.max(Number.EPSILON,Math.min(1-Number.EPSILON,rng())),v=Math.max(0,Math.min(1-Number.EPSILON,rng()));
  const value=mean+sigma*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  if(value>=min&&value<=max)return Math.max(min,Math.min(max,Math.round(value)));
 }
 // A broken/adversarial RNG cannot hang a transaction or pile losses at a cap.
 return Math.round(mean);
}
module.exports={boundedNormalInt};
