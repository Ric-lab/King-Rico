// Read-only audit of the actual engine, including prize rounding and Happeach.
// Probe RNG boundaries on the same 32-bit uniform grid used by Web Crypto,
// rather than duplicating the engine's chance formula.
import engine from '../cloud/engine.cjs';
import {pathToFileURL} from 'node:url';

const GRID=2**32, LAST=(GRID-1)/GRID, ROUND='audit-round';
function probability(predicate) {
  let lower=0,upper=GRID;
  while(lower<upper) {
    const middle=Math.floor((lower+upper)/2);
    if(predicate(middle/GRID)) lower=middle+1;
    else upper=middle;
  }
  return lower/GRID;
}
function sequence(values) {
  return ()=>{
    if(!values.length) throw Error('Unexpected extra RNG draw in Neck audit');
    return values.shift();
  };
}

export function auditNeck(game=engine) {
  const sample=roll=>game.neck(game.BETS[0],null,'start',ROUND,sequence([0,roll,0]));
  const peachProbability=probability(roll=>game.neck(game.BETS[0],null,'start',ROUND,
    sequence([roll,0,0])).peachAt!==0);
  const cases=[];
  if(peachProbability<1) cases.push({peachAt:0,weight:1-peachProbability});
  if(peachProbability>0) {
    const first=sample(0).peachAt,last=sample(LAST).peachAt;
    if(!Number.isInteger(first) || first<1 || last>game.NECK_MULTIPLIERS.length) throw Error('Invalid guarantee range');
    let previous=0;
    for(let floor=first;floor<=last;floor++) {
      const cumulative=probability(roll=>sample(roll).peachAt<=floor);
      if(cumulative>previous) cases.push({peachAt:floor,weight:peachProbability*(cumulative-previous),
        selection:(cumulative+previous)/2});
      previous=cumulative;
    }
  }
  const finalFloor=game.NECK_MULTIPLIERS.length;
  const bets=game.BETS.map(bet=>{
    const stakeUnits=game.units(bet);
    const conditional=cases.map(c=>{
      const previous=floor=>({id:ROUND,betUnits:stakeUnits,floor,peachAt:c.peachAt,
        savedUnits:c.peachAt>0 && floor>=c.peachAt ? game.neckPrize(bet,c.peachAt) : 0});
      const step=(floor,roll)=>floor===0
        ? game.neck(bet,null,'start',ROUND,sequence(c.peachAt ? [0,c.selection,roll] : [LAST,roll]))
        : game.neck(bet,previous(floor),'climb',ROUND,()=>roll);
      const collect=floor=>game.neck(bet,previous(floor),'collect',ROUND,
        ()=>{throw Error('Collecting must not draw a new result');}).winUnits;
      const transitions=Array.from({length:finalFloor},(_,floor)=>({
        probability:probability(roll=>step(floor,roll).ok),
        miss:step(floor,LAST).winUnits,win:step(floor,0)
      }));
      const fixed=Array.from({length:finalFloor},(_,index)=>{
        const target=index+1;
        let alive=1,expected=0;
        for(let floor=0;floor<target;floor++) {
          const t=transitions[floor];
          expected+=alive*(1-t.probability)*t.miss;
          alive*=t.probability;
        }
        const payout=target===finalFloor ? transitions.at(-1).win.winUnits : collect(target);
        return {floor:target,success:alive,returnUnits:expected+alive*payout};
      });
      // A player knows the guarantee's location after paying the stake and
      // may optimally choose between collecting and climbing at every floor.
      let optimal=transitions.at(-1).win.winUnits;
      for(let floor=finalFloor-1;floor>=1;floor--) {
        const t=transitions[floor];
        optimal=Math.max(collect(floor),t.probability*optimal+(1-t.probability)*t.miss);
      }
      optimal=transitions[0].probability*optimal+(1-transitions[0].probability)*transitions[0].miss;
      return {weight:c.weight,fixed,optimal};
    });
    const fixedFloors=Array.from({length:finalFloor},(_,index)=>{
      const returnUnits=conditional.reduce((total,c)=>total+c.weight*c.fixed[index].returnUnits,0);
      return {floor:index+1,success:conditional.reduce((total,c)=>total+c.weight*c.fixed[index].success,0),
        rtp:returnUnits/stakeUnits,expectedNet:(returnUnits-stakeUnits)/100};
    });
    return {bet,fixedFloors,optimalRtp:conditional.reduce((total,c)=>total+c.weight*c.optimal,0)/stakeUnits};
  });
  return {rng:'uniform 32-bit Web Crypto',peachProbability,bets,
    maxOptimalRtp:Math.max(...bets.map(b=>b.optimalRtp))};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const audit=auditNeck();
  console.log(JSON.stringify({rng:audit.rng,peachProbability:audit.peachProbability,
    bets:audit.bets.map(({bet,fixedFloors,optimalRtp})=>({bet,firstFloor:fixedFloors[0],
      secondFloor:fixedFloors[1],bestFixedRtp:Math.max(...fixedFloors.map(f=>f.rtp)),optimalRtp})),
    maxOptimalRtp:audit.maxOptimalRtp},null,2));
  if(audit.maxOptimalRtp>=1) process.exitCode=1;
}
