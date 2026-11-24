'use strict';
// Six equally likely physical sides. Extras rotate uniformly when 6 is not
// divisible by N+1 (N=3/4); no value is favored across rounds.
function resourceDie(stock,rng){
 const n=Math.min(5,Math.max(0,Math.floor(stock)));if(!n)return null;
 const offset=Math.min(n,Math.floor(rng()*(n+1))),faces=Array.from({length:6},(_,i)=>(i+offset)%(n+1));
 for(let i=5;i>0;i--){const j=Math.min(i,Math.floor(rng()*(i+1)));[faces[i],faces[j]]=[faces[j],faces[i]];}
 const index=Math.min(5,Math.floor(rng()*6));return {version:2,value:faces[index],faces,index};
}
module.exports={resourceDie};
