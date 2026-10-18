// Deterministic, fixed-step physics. Randomness is confined to the visible setup.
export const DT=1/120, BALL_RADIUS=.3, START={x:0,z:4.6}, WALL=4.15, GOAL_Z=-5.35;
export function random(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function makeLayout(seed,stage=0){
  const rng=random((seed+stage*49157)>>>0),shift=(rng()-.5)*.3,shrink=1-stage*.1;
  return {stage,goals:[{x:-2.6+shift,width:2.45*shrink,mult:1.25,color:0x77d4a4,name:'LIVRE'},
    {x:.15+shift,width:1.85*shrink,mult:1.8,color:0xffcf68,name:'PRECISÃO'},
    {x:2.8+shift,width:1.2*shrink,mult:3,color:0xf28c9a,name:'FORTUNE'}],
    bumpers:[{x:(rng()-.5)*.7,z:-.7,r:.5},{x:-2.8+(rng()-.5)*.45,z:-2.7,r:.4},
      ...(stage>0?[{x:2.2+(rng()-.5)*.5,z:-3,r:.4}]:[])]};
}
export function velocityFromGesture(dx,dy,reference=390){
  const scale=390/reference, nx=dx*scale,ny=dy*scale;
  if(ny>-19||Math.hypot(nx,ny)<26)return null;
  // A substantial minimum keeps ordinary thumb swipes useful; length adds impulse.
  const angle=Math.max(-1.12,Math.min(1.12,Math.atan2(nx,-ny)));
  const speed=9.5+Math.min(1,Math.hypot(nx,ny)/160)*6;
  return{vx:Math.sin(angle)*speed,vz:-Math.cos(angle)*speed,power:Math.min(1,Math.hypot(nx,ny)/160)};
}
export function createBall(v){return{x:START.x,z:START.z,vx:v.vx,vz:v.vz,t:0,hits:0,done:false};}
export function stepBall(ball,layout,dt=DT){
  if(ball.done)return[];const events=[];ball.t+=dt;
  ball.vx*=Math.exp(-.2*dt);ball.vz*=Math.exp(-.2*dt);ball.x+=ball.vx*dt;ball.z+=ball.vz*dt;
  if(Math.abs(ball.x)>WALL-BALL_RADIUS){ball.x=Math.sign(ball.x)*(WALL-BALL_RADIUS);ball.vx=-ball.vx*.94;ball.hits++;events.push({kind:'wall',x:ball.x,z:ball.z});}
  for(let i=0;i<layout.bumpers.length;i++){
    const p=layout.bumpers[i],dx=ball.x-p.x,dz=ball.z-p.z,d=Math.hypot(dx,dz),r=p.r+BALL_RADIUS;
    if(d<r){const nx=dx/(d||1),nz=dz/(d||1),dot=ball.vx*nx+ball.vz*nz;ball.x=p.x+nx*r;ball.z=p.z+nz*r;
      if(dot<0){ball.vx-=1.93*dot*nx;ball.vz-=1.93*dot*nz;ball.hits++;events.push({kind:'bumper',index:i,x:ball.x,z:ball.z});}}
  }
  if(ball.z<=GOAL_Z){
    const index=layout.goals.findIndex(g=>Math.abs(ball.x-g.x)<g.width/2-BALL_RADIUS*.45);
    if(index>=0){ball.done=true;ball.result={kind:'hit',index,mult:layout.goals[index].mult,x:ball.x,z:GOAL_Z};events.push(ball.result);}
    else {ball.z=GOAL_Z;ball.vz=Math.abs(ball.vz)*.88;ball.hits++;events.push({kind:'wall',x:ball.x,z:ball.z});}
  }
  if(!ball.done&&(ball.z>5.65||ball.t>7||Math.hypot(ball.vx,ball.vz)<.55)){
    ball.done=true;ball.result={kind:'miss',reason:ball.z>5.65?'return':'stopped',x:ball.x,z:ball.z};events.push(ball.result);
  }
  return events;
}
export function simulateShot(layout,velocity){const b=createBall(velocity);while(!b.done)stepBall(b,layout);return{...b.result,duration:b.t,hits:b.hits};}
export function applyOutcome(state){
  const r=state.round;if(r?.status!=='flight')return state;
  const s=structuredClone(state),round=s.round;
  if(round.outcome.kind==='hit'){
    round.amount=Math.floor(round.amount*round.outcome.mult);round.stage++;
    if(round.stage===3){s.balance+=round.amount;round.status='paid';}else round.status='choice';
  }else round.status='lost';
  return s;
}
export function collect(state){
  if(state.round?.status!=='choice')return state;
  const s=structuredClone(state);s.balance+=s.round.amount;s.round.status='paid';return s;
}
