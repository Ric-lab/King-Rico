'use strict';
// Both climb games share the same checkpoint, risk and settlement mechanics.
const GUARANTEED_FACTOR=.85, PEACH_PROBABILITY=1/8;
function climb({multipliers,base,peachMin,peachMax,prize},bet,previous,move,rng) {
  const peachAt=previous ? previous.peachAt : rng()<PEACH_PROBABILITY
    ? peachMin+Math.floor(rng()*(peachMax-peachMin+1)) : 0;
  const floor=previous?.floor||0,savedUnits=previous?.savedUnits||0;
  if(move==='collect')return{peachAt,floor,savedUnits,ok:true,ended:true,winUnits:prize(bet,floor)};
  const next=floor+1,chance=(next===1?base/multipliers[0]:multipliers[next-2]/multipliers[next-1])
    *(savedUnits>0?GUARANTEED_FACTOR:1);
  const ok=rng()<chance,saved=ok&&next===peachAt?prize(bet,next):savedUnits;
  const ended=!ok||next===multipliers.length;
  return{peachAt,floor:ok?next:floor,savedUnits:saved,ok,ended,winUnits:ended?(ok?prize(bet,next):saved):0};
}
module.exports={GUARANTEED_FACTOR,PEACH_PROBABILITY,climb};
