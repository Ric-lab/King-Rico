// Interpolate recorded fixed-step rigid bodies, including free lateral movement.
export function sample(recording,seed,time){
 const f=Math.max(0,Math.min(recording.frames.length-1,time*60)),a=Math.floor(f),b=Math.min(a+1,recording.frames.length-1),mix=f-a,shift=seed%5;
 return Array.from({length:5},(_,i)=>{const slot=(i-shift+5)%5,p=recording.frames[a][slot],q=recording.frames[b][slot];return p.map((x,k)=>x+(q[k]-x)*mix);});
}
export const arrival=(recording,seed,index)=>recording.times[(index-seed%5+5)%5];
