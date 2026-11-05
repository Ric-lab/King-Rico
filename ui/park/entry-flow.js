// One confirmation per visit. Financial authorization still belongs to the
// existing wallet transaction; entering/reopening a page never consumes a pass.
export function createEntryFlow({snapshot,authorize,prompt}){
 const accepted=new Set(),pending=new Map();
 function ensure(game){
  const {player,park}=snapshot();
  if(player?.[game+'Round']||park.passes?.[game]){accepted.add(game);return Promise.resolve(true);}
  if(pending.has(game))return pending.get(game);
  const confirm=async method=>{await authorize(game,method);accepted.add(game);return true;};
  const op=Promise.resolve().then(async()=>{
   if(!accepted.has(game))return prompt(game,confirm);
   const {player,park}=snapshot();
   const method=park.tickets>0?'ticket':'coins';
   if(method==='coins'&&player.balance<park.price)throw Object.assign(Error(`Você precisa de 1 ingresso ou ${park.price} moedas para jogar.`),{code:'king-rico/failed-precondition'});
   return confirm(method);
  }).finally(()=>pending.delete(game));
  pending.set(game,op);return op;
 }
 return {ensure};
}
