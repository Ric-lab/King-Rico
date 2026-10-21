'use strict';
const MULTIPLIERS=[1.2,1.5,2,1.5,3,1.2,2,1.2,1.5];
function quality(selected,aimX,aimZ){const dx=Math.abs(aimX-(selected%3*320+180)),dz=Math.abs(aimZ-(Math.floor(selected/3)*280+220));return Math.max(0,1000-Math.floor(Math.max(dx,dz)*1000/160));}
function claw(bet,selected,aimX,aimZ,seed,roundId){const q=quality(selected,aimX,aimZ),betUnits=Math.round(bet*100),multiplier=MULTIPLIERS[(selected+seed)%9];return {roundId,betUnits,selected,aimX,aimZ,seed,quality:q,ended:true,winUnits:q>=700?Math.round(betUnits*multiplier):q>=400?betUnits:0};}
module.exports={MULTIPLIERS,quality,claw};
