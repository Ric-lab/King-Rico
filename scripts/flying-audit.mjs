// Adapt Flying's persisted round to the same exact, guarantee-aware DP as Neck.
import engine from '../cloud/engine.cjs';
import {auditNeck} from './neck-audit.mjs';
import {pathToFileURL} from 'node:url';
export function auditFlying(game=engine) {
  return auditNeck({...game,NECK_MULTIPLIERS:game.FLYING_MULTIPLIERS,
    neckPrize:(bet,floor)=>Math.round(game.units(bet)*game.FLYING_MULTIPLIERS[floor-1]),
    neck:(bet,previous,move,id,rng)=>{
      const round=previous?{...previous,step:previous.floor,ladderVersion:2,
        popped:Array.from({length:previous.floor},(_,i)=>i)}:null;
      const x=game.flying(bet,round,move==='collect'?'collect':'pop',id,previous?.floor||0,rng);
      return{...x,floor:x.step};
    }});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const x=auditFlying();console.log(JSON.stringify(x,null,2));if(x.maxOptimalRtp>=1)process.exitCode=1;
}
