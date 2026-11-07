// Seeded Monte Carlo: includes the tenth-spin guarantee, wheel extra and Happeach.
// Virtual ticket utility is counted separately, never added to coin RTP.
const engine=require('../cloud/engine.cjs'),park=require('../cloud/park.cjs');
function audit(version,spins=100000,seed=17843){
 const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const p={peaches:0,peachBank:{count:0,units:0}},state=park.fresh(),counts=[0,0,0,0];let paid=0,base=0,hits=0,columns=0,tickets=0;
 for(let i=0;i<spins;i++){
  const x=park.spin(p,state,10,'spin-'+i,rng,version);p.peaches=x.peaches;p.peachBank=x.peachBank;
  paid+=x.winUnits;base+=engine.units(x.res.win);hits+=x.res.win>0?1:0;columns+=x.res.lines.some(l=>l>=5)?1:0;
  counts[x.grid.filter(v=>v===10).length]++;tickets+=x.ticketAward;
  if(state.wheel){paid+=park.bonus(state,state.wheel.id,rng);state.wheel=null;state.spins=0;}
 }
 return {version,spins,seed:17843,coinRtp:paid/(spins*1000),baseCoinRtp:base/(spins*1000),prizeRate:hits/spins,columnPrizeRate:columns/spins,ticketAppearances:counts,ticketsAwarded:tickets};
}
module.exports={audit};
if(require.main===module)console.log(JSON.stringify({date:'2026-11-07',scope:'Simulation, not a guaranteed RTP. Includes existing bonus wheel and Happeach. No payout/weight retuning.',legacy:audit(1),eightLines:audit(2)},null,2));
