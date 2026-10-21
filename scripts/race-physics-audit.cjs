// Regenerate audited settlement winners (v3) after changing rigid-body geometry.
// npm test independently resimulates every layout and checks this same table.
const fs=require('node:fs'),p=require('../cloud/race-physics.cjs'),winners=[];
for(let layout=0;layout<p.LAYOUTS;layout++){const r=p.simulate(layout);winners.push(r.order[0]);console.log(layout,JSON.stringify({winner:r.order[0],times:r.times,contacts:r.contacts}));}
fs.writeFileSync('cloud/race-physics-winners.json',JSON.stringify(winners)+'\n');
const file='firestore.rules',rules=fs.readFileSync(file,'utf8').replace(/return \(\[[0-4,]+\]\[int\(seed \/ 5\)\]/,'return ('+JSON.stringify(winners)+'[int(seed / 5)]');fs.writeFileSync(file,rules);
