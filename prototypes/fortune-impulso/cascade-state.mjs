export const TOTAL=60,WIDTH=360,HEIGHT=500,COMBO_BONUS=3,BONUS_PER_GATE=12,MAX_BALLS=TOTAL+BONUS_PER_GATE*3,RADIUS=11.4;
export const GATE_X=[76,180,284];
export function random(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function marblePlan(seed,id){
  const rng=random((seed+id*7919)>>>0),bonus=id>=TOTAL,wave=Math.floor(id/3),waveRandom=random((seed+wave*104729)>>>0);
  const color=bonus?Math.floor((id-TOTAL)/BONUS_PER_GATE):Math.floor(waveRandom()*3),local=(id-TOTAL)%BONUS_PER_GATE;
  return{id,x:bonus?GATE_X[color]+(local%3-1)*23:[104,180,256][(wave+(seed%3))%3]+(rng()-.5)*22,
    y:bonus?61+Math.floor(local/3)*23:174,vx:(rng()-.5)*(bonus?.3:1.2),color};
}
export const availableIds=r=>Array.from({length:MAX_BALLS},(_,i)=>i).filter(i=>i<TOTAL||r.gates[Math.floor((i-TOTAL)/BONUS_PER_GATE)].openedAt!==null);
export function begin(state,id,seed,practice=false){
  if(state.round?.phase==='playing'||!practice&&state.balance<state.bet)return state;
  const s=structuredClone(state);if(!practice)s.balance-=s.bet;
  s.round={id,seed,practice,bet:s.bet,phase:'playing',tick:0,spawned:0,total:TOTAL,deadline:840,gates:Array.from({length:3},()=>({openedAt:null,spawned:0})),resolved:[],balls:[],catcher:WIDTH/2,points:0,caught:0,perfect:0,comboColor:-1,comboCount:0,combos:0};return s;
}
export function resolveBall(state,id,caught,perfect=false){
  const r=state.round;if(r?.phase!=='playing'||id<0||id>=MAX_BALLS||r.resolved.includes(id)||id>=TOTAL&&r.gates[Math.floor((id-TOTAL)/BONUS_PER_GATE)].openedAt===null)return state;
  const s=structuredClone(state),round=s.round;round.resolved.push(id);
  if(caught){const color=marblePlan(round.seed,id).color;round.caught++;round.points+=perfect?2:1;if(perfect)round.perfect=(round.perfect||0)+1;round.comboCount=round.comboColor===color?round.comboCount+1:1;round.comboColor=color;
    if(round.comboCount===3){round.points+=COMBO_BONUS;round.combos++;round.comboCount=0;round.comboColor=-1;if(round.gates[color].openedAt===null){round.gates[color].openedAt=round.tick;round.total+=BONUS_PER_GATE;round.deadline=Math.min(1200,Math.max(round.deadline,round.tick+360));}}}
  return s;
}
export const payout=r=>r.practice?0:Math.floor(r.bet*r.points/25);
export function settle(state){
  if(state.round?.phase!=='playing'||state.round.resolved.length<state.round.total)return state;
  const s=structuredClone(state);s.balance+=payout(s.round);s.round.phase='paid';s.round.balls=[];return s;
}
