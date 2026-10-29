const world=require('./world.cjs'),paths=require('./paths.json');
function pathFor(column,bin,key){
 const matches=paths[column].filter(p=>p.bin===bin);if(!matches.length)return null;
 let hash=2166136261;for(const c of String(key))hash=Math.imul(hash^c.charCodeAt(0),16777619);
 const path=matches[(hash>>>0)%matches.length],raw=atob(path.frames),values=[];
 for(let i=0;i<raw.length;i+=2){const n=raw.charCodeAt(i)|(raw.charCodeAt(i+1)<<8);values.push(n>32767?n-65536:n);}
 const frames=[];for(let i=0;i<values.length;i+=3)frames.push({x:values[i]/10,y:values[i+1]/10,angle:values[i+2]/100});
 return {frames,hits:path.hits,bin};
}
module.exports={...world,pathFor};
