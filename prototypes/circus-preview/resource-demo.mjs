// Explicit test wallet only; draw a real v6 receipt, with the current defenses intact.
import park from '../../cloud/park.cjs';
import controller from '../../cloud/circus-control-v6.cjs';
export function resourceDemo(player,state,bet,kind){
 const c=controller.control(player,state,bet),chance=c.maxTiger>=c.stake?.05+.45*Math.min(1,c.budget/(c.stake*25)):0;
 let first=true;
 // A pending tenth spin is a wheel; explicit resource demos start a fresh test cycle.
 if(state.spins>=9){state.spins=0;state.cycleWagerUnits=0;}
 return park.spin(player,state,bet,'demo-'+kind,()=>first?(first=false,chance+(kind==='tucker'?.01:.04)):.51,6);
}
