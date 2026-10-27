import engine from '../cloud/engine.cjs';
import {pathToFileURL} from 'node:url';
export function auditFingoCard(count=20000){
 const results=[];
 for(const policy of ['lines','gold','random']){
  let seed=90431,wins=0,paid=0,used=0;
  const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  for(let i=0;i<count;i++){
   let r=null;
   do{
    r=engine.fingo(10,r,'roll','audit',0,rng);
    const card=engine.fingoCard.expandCard(r.targets);
    const selected=policy==='lines'?engine.fingoCard.chooseSlot(r):policy==='gold'?r.slots.findIndex(n=>engine.fingoCard.useful(card,r.marks,n)):Math.floor(rng()*5);
    r=engine.fingo(10,r,'drop','audit',selected,rng);
   }while(!r.ended);
   wins+=r.winUnits>0;paid+=r.winUnits;used+=r.used;
  }
  results.push({policy,count,seed:90431,rtp:paid/(1000*count),prizeRate:wins/count,meanPlays:used/count});
 }
 return {rulesVersion:engine.RULES_VERSION,note:'Seeded simulation, not proof of optimal play or theoretical RTP. Fixed odds; a quina pays 2x at any play. Gifts and refills excluded.',results};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(auditFingoCard(),null,2));
