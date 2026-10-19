export const TOTAL=60,WIDTH=360,HEIGHT=500,COMBO_BONUS=3;
export function random(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function marblePlan(seed,id){const rng=random((seed+id*7919)>>>0);return{id,x:WIDTH/2+(rng()-.5)*74,vx:(rng()-.5)*2,color:Math.floor(rng()*3)};}
export function begin(state,id,seed,practice=false){
  if(state.round?.phase==='playing'||!practice&&state.balance<state.bet)return state;
  const s=structuredClone(state);if(!practice)s.balance-=s.bet;
  s.round={id,seed,practice,bet:s.bet,phase:'playing',tick:0,spawned:0,resolved:[],balls:[],catcher:WIDTH/2,points:0,caught:0,comboColor:-1,comboCount:0,combos:0};return s;
}
export function resolveBall(state,id,caught){
  const r=state.round;if(r?.phase!=='playing'||id<0||id>=TOTAL||r.resolved.includes(id))return state;
  const s=structuredClone(state),round=s.round;round.resolved.push(id);
  if(caught){const color=marblePlan(round.seed,id).color;round.caught++;round.points++;round.comboCount=round.comboColor===color?round.comboCount+1:1;round.comboColor=color;
    if(round.comboCount===3){round.points+=COMBO_BONUS;round.combos++;round.comboCount=0;round.comboColor=-1;}}
  return s;
}
export const payout=r=>r.practice?0:Math.floor(r.bet*r.points/25);
export function settle(state){
  if(state.round?.phase!=='playing'||state.round.resolved.length<TOTAL)return state;
  const s=structuredClone(state);s.balance+=payout(s.round);s.round.phase='paid';s.round.balls=[];return s;
}
