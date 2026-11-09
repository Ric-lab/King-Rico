// Explicit demo only: not called by the production store or normal slot lottery.
export function tuckerDemo(player,park,bet){
 const before=player.peaches;
 if(!Number.isInteger(before)||before<1)throw Error('Junte um Happeach para testar o Tucker.');
 const bank=player.peachBank?.count===before?player.peachBank:{count:before,units:before*Math.round(bet*100)};
 const remaining=before-1,units=bank.units-Math.round(bank.units/before);
 park.spins=Math.min(9,park.spins+1);
 return {grid:[0,1,2,13,13,13,6,7,8],res:{win:0,cells:[3,4,5],lines:[1],full:false,peach:[]},feature:null,
  peaches:remaining,peachBank:{count:remaining,units},slotVersion:4,parkVersion:1,ticketAward:0,winUnits:0,
  tucker:{version:1,before,stolen:1,remaining}};
}
