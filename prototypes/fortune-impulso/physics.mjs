// Setup varies before input. Flight and score are deterministic.
export const DT=1/120, BALL_RADIUS=.4, START={x:0,y:.68,z:4.2};
export const GRAVITY=15, LIFT=6.6, FLIGHT_TIME=2*LIFT/GRAVITY;
export function random(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function makeLayout(seed,stage=0){
  const rng=random((seed+stage*49157)>>>0),radius=[1.9,1.65,1.42][stage];
  const target={x:stage?(rng()>.5?1:-1)*(1.2+rng()*.65):(rng()-.5)*.6,z:-2.1-stage*.4,radius};
  return{stage,target,goals:[{radius,mult:1.2,color:0xb574bd,name:'ACERTO'},{radius:radius*.65,mult:1.8,color:0xf4cab7,name:'PRECISÃO'},{radius:radius*.29,mult:3,color:0xffcf67,name:'PERFEITO'}]};
}
export function velocityFromGesture(dx,dy,reference=390){
  const nx=dx*390/reference,ny=dy*390/reference;
  if(ny>-22||Math.hypot(nx,ny)<26)return null;
  return{vx:Math.max(-9,Math.min(9,nx*.065)),vz:Math.max(-14.8,ny*.074),vy:LIFT,power:Math.min(1,-ny/180)};
}
export function simulateShot(layout,v){
  const x=START.x+v.vx*FLIGHT_TIME,z=START.z+v.vz*FLIGHT_TIME;
  const dx=x-layout.target.x,dz=z-layout.target.z,distance=Math.hypot(dx,dz);
  const index=distance<=layout.goals[2].radius?2:distance<=layout.goals[1].radius?1:distance<=layout.target.radius?0:-1;
  const points=Math.max(0,Math.round(100*(1-distance/layout.target.radius)));
  const hint=Math.abs(dz)>Math.abs(dx)?(dz>0?'Faltou um pouco de força.':'Um pouco menos de força.'):(dx>0?'Mire um pouco mais à esquerda.':'Mire um pouco mais à direita.');
  return{kind:index<0?'miss':'hit',index,mult:index<0?0:layout.goals[index].mult,quality:index===2?'PERFEITO':index===1?'NA MOSCA':'ACERTOU',points,x,z,dx,dz,distance,duration:FLIGHT_TIME,hint};
}
export function createBall(v){return{...START,vx:v.vx,vz:v.vz,vy:v.vy,t:0,done:false};}
export function stepBall(ball,layout,dt=DT){
  if(ball.done)return[];
  ball.t=Math.min(FLIGHT_TIME,ball.t+dt);ball.x=START.x+ball.vx*ball.t;ball.z=START.z+ball.vz*ball.t;
  ball.y=START.y+ball.vy*ball.t-.5*GRAVITY*ball.t*ball.t;
  if(ball.t>=FLIGHT_TIME){ball.done=true;ball.result=simulateShot(layout,ball);return[ball.result];}return[];
}
export function applyOutcome(state){
  if(state.round?.status!=='flight')return state;
  const s=structuredClone(state),r=s.round;s.best=Math.max(s.best||0,r.outcome.points||0);
  if(r.training){s.practiceLast={seed:r.seed,...r.outcome};r.amount=r.outcome.points;r.stage=1;r.status=r.outcome.kind==='hit'?'paid':'lost';return s;}
  if(r.outcome.kind==='hit'){r.amount=Math.floor(r.amount*r.outcome.mult);r.stage++;if(r.stage===3){s.balance+=r.amount;r.status='paid';}else r.status='choice';}else r.status='lost';return s;
}
export function collect(state){if(state.round?.status!=='choice')return state;const s=structuredClone(state);s.balance+=s.round.amount;s.round.status='paid';return s;}
