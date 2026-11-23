export function beginVillainHold(fc,shields,wheels){if(fc)fc._parkVillainHold={shields:shields??0,wheels:wheels??0};}
export function confirmVillainHold(fc,outcome){if(!fc)return;if(outcome.defense||!(outcome.tony||outcome.tucker||outcome.ray))delete fc._parkVillainHold;else if(fc._parkVillainHold){if(outcome.ray)fc._parkVillainHold.shields=outcome.ray.before;if(outcome.tucker)fc._parkVillainHold.wheels=outcome.peaches+outcome.tucker.stolen;}}
export function releaseVillainHold(fc){delete fc._parkVillainHold;fc._parkVisibleTickets=window.KingRicoPark.state.cedros??0;fc._parkRefresh?.();}
