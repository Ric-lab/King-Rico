// Stress changing stakes around the guaranteed tenth-spin prize. No gifts/refills.
import engine from '../cloud/engine.cjs';
import park from '../cloud/park.cjs';
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(const mode of['alternate','before-wheel']){
 const random=rng(51421),p={balanceUnits:500000000000,peaches:0,peachBank:{count:0,units:0}},s=park.fresh();
 let stakes=0,paid=0,awarded=0,lost=0;
 for(let i=0;i<1000000;i++){
  const bet=mode==='alternate'?(i%2?1000:1):(s.spins===9?1000:1),stake=engine.units(bet),x=park.spin(p,s,bet,'audit'+i,random,5),loss=x.tony?.stolenUnits||0;
  p.balanceUnits+=x.winUnits-stake-loss;p.peaches=x.peaches;p.peachBank=x.peachBank;stakes+=stake;paid+=x.winUnits-loss;awarded+=x.ticketAward;lost+=x.ray?.stolen||0;
  if(s.wheel){const extra=park.bonus(s,s.wheel.id,random);p.balanceUnits+=extra;paid+=extra;s.spins=0;s.wheel=null;if('cycleWagerUnits' in s)s.cycleWagerUnits=0;}
 }
 console.log(JSON.stringify({mode,spins:1000000,gross:(paid+awarded*2500)/stakes,net:(paid+(awarded-lost)*2500)/stakes}));
}
