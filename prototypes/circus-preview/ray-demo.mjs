// Explicit visual demo; production store and normal lotteries never invoke it.
export function rayDemo(player,park,bet){
 const before=park.tickets;
 if(!Number.isInteger(before)||before<0)throw Error('Contagem de ingressos inválida.');
 const stolen=Math.min(1,before),remaining=before-stolen;
 park.tickets=remaining;park.spins=Math.min(9,park.spins+1);
 return {grid:[14,1,2,3,14,6,6,7,14],res:{win:0,cells:[0,4,8],lines:[3],full:false,peach:[]},feature:null,
  peaches:player.peaches,peachBank:player.peachBank||{count:player.peaches,units:player.peaches*Math.round(bet*100)},
  slotVersion:4,parkVersion:1,ticketAward:0,winUnits:0,ray:{version:1,before,stolen,remaining}};
}
