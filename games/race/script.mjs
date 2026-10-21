// Choreographed race (v4). The settled pair comes from the seed; this module only
// stages it: arrival times are fixed per rank, so the crossing order is exact.
import {LENGTH,RADIUS,RUNOUT,PINS,DRUMS,halfWidth} from './course.mjs';
const hash=(seed,k)=>{let h=Math.imul(seed+1,2654435761)^Math.imul(k+7,40503);h^=h>>>15;h=Math.imul(h,2246822507);h^=h>>>13;return (h>>>0)/4294967296;};
const PERMS=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
export function plan(seed,[winner,second]){
 const rest=[0,1,2,3,4].filter(c=>c!==winner&&c!==second),p=PERMS[Math.floor(hash(seed,1)*6)],order=[winner,second,...p.map(i=>rest[i])];
 const first=21.4+hash(seed,2)*1.2,gap=[.05,.09,.14,.22,.34,.5][Math.floor(hash(seed,3)*6)];
 const times=[];order.forEach((c,rank)=>{times[c]=rank?first+gap+(rank-1)*(.42+hash(seed,10+rank)*.45):first;});
 const balls=[0,1,2,3,4].map(c=>({amp:.016+hash(seed,20+c)*.012,freq:1.2+hash(seed,30+c)*1.6,ph:hash(seed,40+c)*6.283,drift:.3+hash(seed,50+c)*.35,dph:hash(seed,60+c)*6.283,
  // The winner and runner-up often sit back mid-race and come through late.
  surge:c===winner?.012+hash(seed,4)*.022:c===second?hash(seed,5)*.014:0}));
 return {order,times,balls,seed};
}
const C=1.1,ramp=t=>t-C*(1-Math.exp(-t/C));
export function distance(p,i,t){
 const T=p.times[i];if(t<=0)return 0;
 if(t>=T)return LENGTH+5*(1-Math.exp(-(t-T)/1.1));
 const u=ramp(t)/ramp(T),b=p.balls[i],w=b.amp*Math.sin(Math.PI*u)*Math.sin(2*Math.PI*b.freq*u+b.ph)-b.surge*Math.exp(-(((u-.62)/.14)**2))*Math.sin(Math.PI*u);
 return LENGTH*(u+w);
}
const LANES=[-1.46,-.73,0,.73,1.46];
// Lateral positions: each marble drifts, then a few relaxation passes keep it out
// of pins, drums, walls and the other marbles. prev (last frame) keeps each marble
// on the side of an obstacle it is already on, so nobody flips through a pin.
export function lanes(p,t,ds,prev=null){
 const l=ds.map((d,i)=>{const b=p.balls[i],w=Math.min(1,t/2.5),s=(halfWidth(Math.min(d,LENGTH))-RADIUS-.06)/(2-RADIUS-.06);return (LANES[i]+w*b.drift*Math.sin(.32*t+b.dph))*s;});
 const near=[...PINS,...DRUMS];
 for(let pass=0;pass<8;pass++){
  for(let i=0;i<5;i++){const d=ds[i];for(const o of near){const dd=d-o.d,min=RADIUS+o.r+.02;if(Math.abs(dd)>=min)continue;const room=Math.sqrt(min*min-dd*dd),gap=l[i]-o.lane;if(Math.abs(gap)<room){const m=halfWidth(Math.min(d,LENGTH))-RADIUS-.06;const g0=prev?prev[i]-o.lane:gap;let side=g0>0?1:g0<0?-1:i<2?-1:1;if(Math.abs(o.lane+side*room)>m)side=-side;l[i]=o.lane+side*room;}}}
  for(let i=0;i<5;i++)for(let j=i+1;j<5;j++){const dd=ds[i]-ds[j],min=2*RADIUS+.02;if(Math.abs(dd)>=min)continue;const room=Math.sqrt(min*min-dd*dd),gap=l[j]-l[i];if(Math.abs(gap)<room){const push=(room-Math.abs(gap))/2,s=gap>=0?1:-1;l[i]-=s*push;l[j]+=s*push;}}
  for(let i=0;i<5;i++){const m=halfWidth(Math.min(ds[i],LENGTH+RUNOUT))-RADIUS-.06;l[i]=Math.max(-m,Math.min(m,l[i]));}
 }
 // A dodge is quick but never a teleport.
 if(prev)for(let i=0;i<5;i++)l[i]=prev[i]+Math.max(-.07,Math.min(.07,l[i]-prev[i]));
 for(let pass=0;pass<3;pass++)for(let i=0;i<5;i++)for(let j=i+1;j<5;j++){const dd=ds[i]-ds[j],min=2*RADIUS+.02;if(Math.abs(dd)>=min)continue;const room=Math.sqrt(min*min-dd*dd),gap=l[j]-l[i];if(Math.abs(gap)<room){const push=(room-Math.abs(gap))/2,s=gap>=0?1:-1;l[i]-=s*push;l[j]+=s*push;}}
 return l;
}
export const settledAt=p=>[...p.times].sort((a,b)=>a-b)[1]+1.3;
