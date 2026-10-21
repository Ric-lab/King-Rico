// Interpolate recorded fixed-step rigid bodies, including free lateral movement.
// slots[i] is the physical body painted with colour i.
export const cyclicSlots=seed=>Array.from({length:5},(_,i)=>(i-seed%5+5)%5);
export function sample(recording,slots,time){
 const last=recording.frames.length-1,f=Math.max(0,Math.min(last,time*60)),a=Math.floor(f),b=Math.min(a+1,last),mix=f-a;
 return slots.map(slot=>{const p=recording.frames[a][slot],q=recording.frames[b][slot];return p.map((x,k)=>x+(q[k]-x)*mix);});
}
export const arrival=(recording,slots,index)=>recording.times?recording.times[slots[index]]:Infinity;
export const buffered=(recording,time)=>recording.done||time*60<recording.frames.length-2;
