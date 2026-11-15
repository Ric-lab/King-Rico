// Reproduce the adversarial v6 scenarios against the same engine as the preview.
import {auditV6} from './circus-v6-audit.mjs';
const spins=Number(process.argv.find(a=>a.startsWith('--spins='))?.slice(8)||1000000),results=[];
for(const options of [{strategy:'tenth-high'},{strategy:'armor-farm'},{strategy:'alternating'},{armor:true}]){
 const row=auditV6({spins,...options});results.push(row);console.error(JSON.stringify({options,return:row.return,triggerPrizes:row.triggerPrizes}));
}
console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.inRange))process.exitCode=1;
