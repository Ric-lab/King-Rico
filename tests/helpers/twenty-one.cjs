exports.rngFor=function(prefix){
 const target=[...prefix,...Array.from({length:52},(_,i)=>i).filter(i=>!prefix.includes(i))];
 const current=Array.from({length:52},(_,i)=>i),draws=[];
 for(let i=51;i>0;i--){const j=current.indexOf(target[i]);draws.push((j+.5)/(i+1));[current[i],current[j]]=[current[j],current[i]];}
 let k=0;return ()=>draws[k++%draws.length];
};
