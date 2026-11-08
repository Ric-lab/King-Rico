// Seeded Monte Carlo: includes the tenth-spin guarantee, wheel extra and Happeach.
// Virtual ticket utility is counted separately, never added to coin RTP.
const engine=require('../cloud/engine.cjs'),park=require('../cloud/park.cjs');
function audit(version,spins=100000,seed=17843,bet=10){
 const initialSeed=seed,stake=engine.units(bet);
 const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const p={peaches:0,peachBank:{count:0,units:0}},state=park.fresh(),counts=[0,0,0,0];let paid=0,base=0,hits=0,columns=0,tickets=0,big=0,mega=0,superWin=0,wheelPaid=0,featurePaid=0,profit=0;const batches=[];let batchPaid=0;
 for(let i=0;i<spins;i++){
  const x=park.spin(p,state,bet,'spin-'+i,rng,version);p.peaches=x.peaches;p.peachBank=x.peachBank;
  paid+=x.winUnits;batchPaid+=x.winUnits;featurePaid+=x.feature?engine.units(x.feature.res.win):0;base+=engine.units(x.res.win);profit+=x.winUnits>stake;for(const [value,reference]of [[x.res.win,bet],...(x.feature?[[x.feature.res.win,x.feature.bet]]:[])]){const tier=engine.circusProfile.tier(value,reference).id;big+=tier==='big';mega+=tier==='mega';superWin+=tier==='super';}hits+=x.res.win>0?1:0;columns+=x.res.lines.some(l=>l>=5)?1:0;
  counts[x.grid.filter(v=>v===10).length]++;tickets+=x.ticketAward;
  if(state.wheel){const extra=park.bonus(state,state.wheel.id,rng);paid+=extra;batchPaid+=extra;wheelPaid+=extra;state.wheel=null;state.spins=0;}
  if((i+1)%10000===0){batches.push(batchPaid/(10000*stake));batchPaid=0;}
 }
 const mean=batches.reduce((a,b)=>a+b,0)/batches.length,se=batches.length>1?Math.sqrt(batches.reduce((a,b)=>a+(b-mean)**2,0)/(batches.length-1)/batches.length):null;
 return {version,spins,seed:initialSeed,bet,coinRtp:paid/(spins*stake),sample95Interval:se?[mean-1.96*se,mean+1.96*se]:null,baseCoinRtp:base/(spins*stake),featureCoinRtp:featurePaid/(spins*stake),wheelExtraRtp:wheelPaid/(spins*stake),prizeRate:hits/spins,profitRate:profit/spins,bigWinRate:big/spins,megaWinRate:mega/spins,superWinRate:superWin/spins,columnPrizeRate:columns/spins,ticketAppearances:counts,ticketsAwarded:tickets};
}
module.exports={audit};
if(require.main===module)console.log(JSON.stringify({date:'2026-11-07',scope:'Simulation, not a guaranteed RTP. Includes existing bonus wheel and Happeach. No payout/weight retuning.',legacy:audit(1),eightLines:audit(2)},null,2));
