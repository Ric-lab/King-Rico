'use strict';
// One visible track per round. Reloading never rerolls its lanes or golden tile.
const MAX_STEP = 500;
const multiplier = step => (10 + step) / 10;
const prize = (betUnits, step) => Math.round(betUnits * (10 + step) / 10);
function track(id, count = MAX_STEP + 16) {
  let seed = 2166136261;
  for (const c of id) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619);
  const random = () => {seed += 0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
  const rows=[{k:0,x:0,size:1.7,gold:false,moving:false,phase:0}],lanes=[-1.65,0,1.65];
  let lane=1;
  for(let k=1;k<=count;k++) {
    const d=Math.min(1,k/40),r=random();
    // The first two contacts teach the gesture; difficulty is visible ahead.
    const tier=k<3?0:r<.64-.3*d?0:r<.94-.2*d?1:2;
    lane=k<3?1:tier===0?Math.max(0,Math.min(2,lane+Math.floor(random()*3)-1)):tier===1?Math.max(0,Math.min(2,lane+(random()<.5?-1:1))):lane===0?2:lane===2?0:random()<.5?0:2;
    rows.push({k,x:lanes[lane],size:[1.65-.25*d,1.4-.25*d,1.2-.25*d][tier],gold:k>=2&&random()<1/40,moving:k>6&&tier>0&&random()<.22+.25*d,phase:random()*Math.PI*2});
  }
  return rows;
}
function outcome(bet, previous, move, roundId) {
  const betUnits=previous?.betUnits || Math.round(bet*100);
  const step=(previous?.step || 0)+(move==='land'?1:0);
  const guardStep=previous?.guardStep || (move==='land' && track(roundId,step)[step].gold ? step : 0);
  const ended=move==='collect'||move==='fall'||step===MAX_STEP;
  return {move,roundId,betUnits,step,guardStep,ended,winUnits:ended ? move==='fall' ? guardStep ? prize(betUnits,guardStep) : 0 : prize(betUnits,step) : 0};
}
module.exports={MAX_STEP,multiplier,prize,track,outcome};
